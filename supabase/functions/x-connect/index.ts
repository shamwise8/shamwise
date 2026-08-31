// Starts the X OAuth 2.0 (PKCE) handshake for one workspace.
// Admin-only: connecting an account lets anyone in that workspace post as it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLIENT_ID = Deno.env.get("X_CLIENT_ID") ?? "";
const REDIRECT = `${SUPABASE_URL}/functions/v1/x-callback`;
const SCOPES = "tweet.read tweet.write users.read media.write offline.access";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const rand = () => b64url(crypto.getRandomValues(new Uint8Array(32)).buffer);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!CLIENT_ID) return json({ error: "X is not configured yet — no client id set." }, 503);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Not signed in" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: "postbox" } });
  const { data: u } = await createClient(SUPABASE_URL, SERVICE_KEY).auth.getUser(auth.replace("Bearer ", ""));
  const email = u?.user?.email?.toLowerCase();
  if (!email) return json({ error: "Not signed in" }, 401);

  let body: { workspace?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const ws = body.workspace;
  if (!ws) return json({ error: "workspace required" }, 400);

  const { data: m } = await admin.from("members")
    .select("role").eq("workspace_id", ws).eq("email", email).maybeSingle();
  if (!m) return json({ error: "You are not a member of that workspace" }, 403);
  if (m.role !== "admin") return json({ error: "Only admins can connect an X account" }, 403);

  const verifier = rand();
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const state = rand();

  await admin.from("x_oauth_state").insert({ state, workspace_id: ws, email, verifier });
  // drop handshakes older than an hour so the table cannot grow unbounded
  await admin.from("x_oauth_state").delete().lt("created_at", new Date(Date.now() - 3600_000).toISOString());

  const url = new URL("https://x.com/i/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  return json({ url: url.href });
});
