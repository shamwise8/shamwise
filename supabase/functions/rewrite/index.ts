// Postbox AI rewrite — server-side so the Anthropic key never reaches the browser.
// Auth: caller must be a signed-in member of the workspace. Rate limited per user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_KEY = Deno.env.get("POSTBOX_ANTHROPIC_KEY") ?? "";
const MODEL = Deno.env.get("POSTBOX_MODEL") ?? "claude-opus-5";

// $ per 1M tokens — used only for the usage log, so Sam can see spend per chapter.
const PRICES: Record<string, [number, number]> = {
  "claude-opus-5": [5, 25],
  "claude-sonnet-5": [2, 10],
  "claude-haiku-4-5": [1, 5],
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const ACTIONS: Record<string, string> = {
  tighten:
    "Tighten this so every tweet fits within 280 characters. Cut filler, keep every concrete fact, number, name, handle and link exactly as written. Do not add claims.",
  punchier:
    "Make this land harder without exaggerating. Stronger opening line, plainer verbs, no hype words, no emoji inflation. Keep all facts, numbers and links exactly as written.",
  clearer:
    "Rewrite for clarity. Shorter sentences, concrete nouns, no jargon a newcomer would miss. Keep all facts, numbers and links exactly as written.",
  thai:
    "Translate to natural Thai as a native speaker would write it for social media — not a literal translation. Keep names, handles, numbers and links in their original form.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!ANTHROPIC_KEY) return json({ error: "AI is not configured yet — no API key set." }, 503);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Not signed in" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: "postbox" } });

  // who is calling?
  const { data: userData, error: userErr } = await createClient(SUPABASE_URL, SERVICE_KEY)
    .auth.getUser(authHeader.replace("Bearer ", ""));
  if (userErr || !userData?.user?.email) return json({ error: "Not signed in" }, 401);
  const email = userData.user.email.toLowerCase();

  let body: { workspace?: string; content?: string; action?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const { workspace, content } = body;
  const action = body.action && ACTIONS[body.action] ? body.action : "tighten";
  if (!workspace || !content) return json({ error: "workspace and content are required" }, 400);

  // settings + kill switch
  const { data: settings } = await admin.from("ai_settings").select("*").eq("id", 1).single();
  if (!settings?.enabled) return json({ error: "AI features are turned off" }, 503);
  if (content.length > (settings.max_input_chars ?? 6000)) {
    return json({ error: `Too long — max ${settings.max_input_chars} characters` }, 413);
  }

  // membership check
  const { data: member } = await admin.from("members")
    .select("email, ai_uncapped").eq("workspace_id", workspace).eq("email", email).maybeSingle();
  if (!member) return json({ error: "You are not a member of that workspace" }, 403);

  // Who pays? A sponsored workspace (e.g. Thailand) draws on the sponsor's pool
  // instead of each member burning their own daily allowance.
  const { data: ws } = await admin.from("workspaces")
    .select("ai_sponsor, ai_pool_daily, ai_context, ai_handles").eq("id", workspace).maybeSingle();
  const sponsor = (ws?.ai_sponsor ?? "").toLowerCase();
  const billedTo = sponsor || email;
  const since = new Date(Date.now() - 86400000).toISOString();

  if (member.ai_uncapped) {
    // no limit at all
  } else if (sponsor) {
    // sponsored: cap the workspace as a whole, not the individual
    const pool = ws?.ai_pool_daily ?? 300;
    const { count } = await admin.from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace).gte("created_at", since);
    if ((count ?? 0) >= pool) {
      return json({ error: `This workspace has used its daily AI allowance (${pool}). Resets in 24h.` }, 429);
    }
  } else {
    const { count } = await admin.from("ai_usage")
      .select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since);
    if ((count ?? 0) >= (settings.daily_per_user ?? 30)) {
      return json({ error: `Daily limit reached (${settings.daily_per_user}). Try again tomorrow.` }, 429);
    }
  }

  let system =
    "You rewrite social posts for X. Rules: never invent facts, numbers, dates, names, handles or links — " +
    "carry them across exactly. Keep the author's voice; do not make it sound like marketing copy. " +
    "Threads are separated by a line containing only ---; keep that format and keep each tweet under 280 characters. " +
    "Links count as 23 characters. Reply with the rewritten post only — no preamble, no explanation, no quotes around it.";

  if (ws?.ai_context) {
    system += "\n\nHouse style for this account — follow it:\n" + String(ws.ai_context).slice(0, 2000);
  }
  if (ws?.ai_handles) {
    // A wrong @mention tags a real stranger, so the roster is a closed list, not a hint.
    system += "\n\nThe ONLY X handles you may use are the ones listed here:\n" +
      String(ws.ai_handles).slice(0, 2000) +
      "\nNever write an @handle that is not on that list or already in the author's text. " +
      "If you want to credit someone who is not listed, use their plain name with no @.";
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: `${ACTIONS[action]}\n\n---\n${content}` }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return json({ error: "AI request failed", detail: detail.slice(0, 300) }, 502);
  }
  const data = await res.json();
  const text = (data.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
  const inTok = data.usage?.input_tokens ?? 0;
  const outTok = data.usage?.output_tokens ?? 0;
  const [pin, pout] = PRICES[MODEL] ?? [0, 0];
  const cost = (inTok * pin + outTok * pout) / 1_000_000;

  await admin.from("ai_usage").insert({
    workspace_id: workspace, email, billed_to: billedTo, action, model: MODEL,
    input_tokens: inTok, output_tokens: outTok, cost_usd: cost,
  });

  return json({ result: text, usage: { input_tokens: inTok, output_tokens: outTok, cost_usd: cost, model: MODEL } });
});
