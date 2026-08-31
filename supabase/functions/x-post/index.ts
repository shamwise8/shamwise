// Publishes a draft to X as a thread. Manual only — nothing here runs on a timer.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLIENT_ID = Deno.env.get("X_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("X_CLIENT_SECRET") ?? "";
const MAX_TWEETS = 25;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const segments = (t: string) =>
  String(t || "").split(/\n\s*---\s*\n|\n[ \t]*\n[ \t]*\n+/).map((x) => x.trim()).filter(Boolean);
const HAS_LINK = /(https?:\/\/[^\s]+)|(^|\s)(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i;

async function freshToken(admin: any, acc: any) {
  const soon = Date.now() + 60_000;
  if (!acc.expires_at || new Date(acc.expires_at).getTime() > soon) return acc.access_token;
  if (!acc.refresh_token) return acc.access_token;   // let X reject it and report honestly
  const r = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: acc.refresh_token }),
  });
  if (!r.ok) return acc.access_token;
  const t = await r.json();
  await admin.from("x_accounts").update({
    access_token: t.access_token,
    refresh_token: t.refresh_token ?? acc.refresh_token,
    expires_at: t.expires_in ? new Date(Date.now() + t.expires_in * 1000).toISOString() : null,
  }).eq("workspace_id", acc.workspace_id);
  return t.access_token;
}

async function uploadMedia(token: string, url: string, isVideo: boolean) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`could not read attachment (${res.status})`);
  const blob = await res.blob();
  const fd = new FormData();
  fd.append("media", blob);
  fd.append("media_category", isVideo ? "tweet_video" : "tweet_image");
  const up = await fetch("https://api.x.com/2/media/upload", {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
  });
  if (!up.ok) throw new Error(`media upload failed (${up.status}): ${(await up.text()).slice(0, 200)}`);
  const j = await up.json();
  return j?.data?.id || j?.id || j?.media_id_string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Not signed in" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: "postbox" } });
  const { data: u } = await createClient(SUPABASE_URL, SERVICE_KEY).auth.getUser(auth.replace("Bearer ", ""));
  const email = u?.user?.email?.toLowerCase();
  if (!email) return json({ error: "Not signed in" }, 401);

  let body: { draft_id?: string; confirm_repost?: boolean };
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  if (!body.draft_id) return json({ error: "draft_id required" }, 400);

  const { data: draft } = await admin.from("drafts").select("*").eq("id", body.draft_id).maybeSingle();
  if (!draft) return json({ error: "Draft not found" }, 404);

  const { data: m } = await admin.from("members")
    .select("email").eq("workspace_id", draft.workspace_id).eq("email", email).maybeSingle();
  if (!m) return json({ error: "You are not a member of that workspace" }, 403);

  // posting costs money and cannot be undone, so never do it twice by accident
  if (draft.posted_at && !body.confirm_repost) {
    return json({ error: "already_posted", posted_at: draft.posted_at, tweet_id: draft.x_tweet_id }, 409);
  }

  const { data: acc } = await admin.from("x_accounts")
    .select("*").eq("workspace_id", draft.workspace_id).maybeSingle();
  if (!acc) return json({ error: "No X account connected to this workspace" }, 400);

  const segs = segments(draft.content);
  if (!segs.length) return json({ error: "Nothing to post" }, 400);
  if (segs.length > MAX_TWEETS) return json({ error: `Thread is ${segs.length} tweets — the cap is ${MAX_TWEETS}` }, 400);

  const token = await freshToken(admin, acc);
  const media = Array.isArray(draft.media) ? draft.media : [];
  const ids: string[] = [];
  let reply: string | null = null;

  for (let i = 0; i < segs.length; i++) {
    const mine = media.filter((x: any) => Math.min(x.seg ?? 0, segs.length - 1) === i).slice(0, 4);
    let mediaIds: string[] = [];
    try {
      for (const mm of mine) mediaIds.push(await uploadMedia(token, mm.url, mm.type === "video"));
    } catch (e) {
      return json({ error: `Tweet ${i + 1}: ${e.message}`, posted: ids }, 502);
    }
    const payload: Record<string, unknown> = { text: segs[i] };
    if (mediaIds.length) payload.media = { media_ids: mediaIds };
    if (reply) payload.reply = { in_reply_to_tweet_id: reply };

    const r = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const detail = (await r.text()).slice(0, 300);
      // partial threads happen; say exactly what did go out
      return json({ error: `Tweet ${i + 1} rejected by X (${r.status}): ${detail}`, posted: ids }, 502);
    }
    const id = (await r.json())?.data?.id;
    ids.push(id);
    reply = id;
  }

  const withLinks = segs.filter((s) => HAS_LINK.test(s)).length;
  const cost = withLinks * 0.20 + (segs.length - withLinks) * 0.015;

  await admin.from("x_posts").insert({
    workspace_id: draft.workspace_id, draft_id: draft.id, tweet_ids: ids,
    tweets: segs.length, with_links: withLinks, est_cost_usd: cost, posted_by: email,
  });
  await admin.from("drafts").update({
    status: "posted", posted_at: new Date().toISOString(), x_tweet_id: ids[0],
  }).eq("id", draft.id);

  return json({
    ok: true, tweet_ids: ids,
    url: `https://x.com/${acc.handle.replace("@", "")}/status/${ids[0]}`,
    tweets: segs.length, with_links: withLinks, est_cost_usd: +cost.toFixed(4),
  });
});
