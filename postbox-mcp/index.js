#!/usr/bin/env node
// Postbox MCP server — lets Claude read, write and rewrite Postbox drafts.
// Local use only: it holds a Supabase service key, so never expose it publicly.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const URL = process.env.POSTBOX_URL;
const KEY = process.env.POSTBOX_SERVICE_KEY;
const ME = process.env.POSTBOX_EMAIL || "";
const ALLOWED = (process.env.POSTBOX_WORKSPACES || "").split(",").map((s) => s.trim()).filter(Boolean);

if (!URL || !KEY) {
  console.error("Missing POSTBOX_URL or POSTBOX_SERVICE_KEY. See README.md");
  process.exit(1);
}

const sb = createClient(URL, KEY, { db: { schema: "postbox" }, auth: { persistSession: false } });

const guard = (ws) => {
  if (!ws) throw new Error("workspace is required");
  if (ALLOWED.length && !ALLOWED.includes(ws)) {
    throw new Error(`workspace "${ws}" is not in POSTBOX_WORKSPACES (${ALLOWED.join(", ")})`);
  }
  return ws;
};
const text = (v) => ({ content: [{ type: "text", text: typeof v === "string" ? v : JSON.stringify(v, null, 2) }] });
const CHAR_LIMIT = 280;
const URL_RE = /https?:\/\/\S+|(?:^|\s)(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/gi;
function tweetLen(s) {
  let n = 0;
  const rest = s.replace(URL_RE, (m) => { n += 23 + (m.startsWith(" ") ? 1 : 0); return m.startsWith(" ") ? " " : ""; });
  for (const ch of rest) n += /[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-￯]/.test(ch) ? 2 : 1;
  return n;
}
const segments = (t) => (t || "").split(/\n\s*---\s*\n|\n[ \t]*\n[ \t]*\n+/).map((x) => x.trim()).filter(Boolean);
const measure = (content) => segments(content).map((s, i) => ({
  tweet: i + 1, chars: tweetLen(s), over: tweetLen(s) > CHAR_LIMIT,
}));

async function resolveCategory(workspace, name) {
  if (!name) return [];
  const { data } = await sb.from("labels").select("id,name").eq("workspace_id", workspace);
  const hit = (data || []).find((l) => l.name.toLowerCase() === name.toLowerCase());
  if (hit) return [hit.id];
  const { data: made, error } = await sb.from("labels")
    .insert({ workspace_id: workspace, name, color: "grey" }).select().single();
  if (error) throw error;
  return [made.id];
}

const server = new McpServer({ name: "postbox", version: "1.0.0" });

server.registerTool("list_workspaces", {
  description: "List Postbox workspaces (chapters) this server may write to.",
  inputSchema: {},
}, async () => {
  const { data, error } = await sb.from("workspaces").select("id,name").order("name");
  if (error) throw error;
  const rows = ALLOWED.length ? data.filter((w) => ALLOWED.includes(w.id)) : data;
  return text(rows);
});

server.registerTool("list_drafts", {
  description: "List drafts in a workspace. Use this to find a draft before rewriting it.",
  inputSchema: {
    workspace: z.string().describe("Workspace id, e.g. team1th"),
    status: z.enum(["idea", "draft", "review", "approved", "posted"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
}, async ({ workspace, status, limit }) => {
  guard(workspace);
  let q = sb.from("drafts").select("id,title,status,planned_at,assignee,content")
    .eq("workspace_id", workspace).order("planned_at", { ascending: true, nullsFirst: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q.limit(limit || 30);
  if (error) throw error;
  return text(data.map((d) => ({
    id: d.id, title: d.title, status: d.status, planned_at: d.planned_at, assignee: d.assignee,
    tweets: measure(d.content), preview: (d.content || "").slice(0, 120),
  })));
});

server.registerTool("get_draft", {
  description: "Get one draft in full — use before rewriting so you keep the author's meaning.",
  inputSchema: { id: z.string().describe("Draft id") },
}, async ({ id }) => {
  const { data, error } = await sb.from("drafts").select("*").eq("id", id).single();
  if (error) throw error;
  guard(data.workspace_id);
  return text({ ...data, tweets: measure(data.content) });
});

server.registerTool("create_draft", {
  description:
    "Create a draft. Threads: separate tweets with a line containing only ---. " +
    "Always created for human review; never publishes anything.",
  inputSchema: {
    workspace: z.string(),
    content: z.string().describe("Post body. Use --- on its own line between tweets."),
    title: z.string().optional(),
    planned_at: z.string().optional().describe("ISO date/time, e.g. 2026-09-23T12:00:00Z"),
    category: z.string().optional().describe("Category name; created if it does not exist"),
    status: z.enum(["idea", "draft", "review"]).optional().describe("Defaults to review"),
  },
}, async ({ workspace, content, title, planned_at, category, status }) => {
  guard(workspace);
  const labels = await resolveCategory(workspace, category);
  const { data, error } = await sb.from("drafts").insert({
    workspace_id: workspace, content, title: title || "",
    status: status || "review",
    planned_at: planned_at || null,
    labels, author: ME, updated_by: ME,
  }).select().single();
  if (error) throw error;
  return text({ created: data.id, title: data.title, status: data.status, tweets: measure(content) });
});

server.registerTool("update_draft", {
  description:
    "Update a draft — this is how you save a rewrite. Only the fields you pass are changed.",
  inputSchema: {
    id: z.string(),
    content: z.string().optional(),
    title: z.string().optional(),
    status: z.enum(["idea", "draft", "review", "approved", "posted"]).optional(),
    planned_at: z.string().optional(),
    category: z.string().optional(),
  },
}, async ({ id, content, title, status, planned_at, category }) => {
  const { data: existing, error: e1 } = await sb.from("drafts").select("workspace_id").eq("id", id).single();
  if (e1) throw e1;
  guard(existing.workspace_id);
  const patch = { updated_by: ME, updated_at: new Date().toISOString() };
  if (content !== undefined) patch.content = content;
  if (title !== undefined) patch.title = title;
  if (status !== undefined) patch.status = status;
  if (planned_at !== undefined) patch.planned_at = planned_at;
  if (category !== undefined) patch.labels = await resolveCategory(existing.workspace_id, category);
  const { data, error } = await sb.from("drafts").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return text({ updated: data.id, tweets: measure(data.content) });
});

server.registerTool("check_length", {
  description:
    "Measure a post against X's rules without saving: per-tweet character counts, " +
    "links counted as 23, CJK/Thai handled. Use this to verify a rewrite fits before saving.",
  inputSchema: { content: z.string() },
}, async ({ content }) => text({ limit: CHAR_LIMIT, tweets: measure(content) }));

server.registerTool("list_categories", {
  description: "List category labels in a workspace.",
  inputSchema: { workspace: z.string() },
}, async ({ workspace }) => {
  guard(workspace);
  const { data, error } = await sb.from("labels").select("id,name,color,locked").eq("workspace_id", workspace).order("name");
  if (error) throw error;
  return text(data);
});

await server.connect(new StdioServerTransport());
