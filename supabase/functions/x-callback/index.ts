// X redirects the browser here after the user approves. Exchanges the code,
// stores the tokens server-side, and sends the user back to Postbox.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLIENT_ID = Deno.env.get("X_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("X_CLIENT_SECRET") ?? "";
const APP_URL = Deno.env.get("POSTBOX_APP_URL") ?? "https://www.shamwise.com/postbox";
const REDIRECT = `${SUPABASE_URL}/functions/v1/x-callback`;

const back = (msg: string, ok = false) =>
  new Response(null, { status: 302, headers: { Location: `${APP_URL}?x=${ok ? "ok" : "err"}&m=${encodeURIComponent(msg)}` } });

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error")) return back("You cancelled the X connection.");
  if (!code || !state) return back("X did not return a code.");
  if (!CLIENT_ID || !CLIENT_SECRET) return back("X is not configured.");

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: "postbox" } });
  const { data: st } = await admin.from("x_oauth_state").select("*").eq("state", state).maybeSingle();
  if (!st) return back("That connection link expired. Try again.");
  await admin.from("x_oauth_state").delete().eq("state", state);

  const tok = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT,
      code_verifier: st.verifier,
    }),
  });
  if (!tok.ok) return back(`X refused the token exchange (${tok.status}).`);
  const t = await tok.json();

  const me = await fetch("https://api.x.com/2/users/me?user.fields=profile_image_url,username,name", {
    headers: { Authorization: `Bearer ${t.access_token}` },
  });
  if (!me.ok) return back(`Could not read the X account (${me.status}).`);
  const who = (await me.json()).data ?? {};

  const { error } = await admin.from("x_accounts").upsert({
    workspace_id: st.workspace_id,
    x_user_id: who.id,
    handle: "@" + who.username,
    name: who.name,
    avatar_url: who.profile_image_url,
    access_token: t.access_token,
    refresh_token: t.refresh_token ?? null,
    expires_at: t.expires_in ? new Date(Date.now() + t.expires_in * 1000).toISOString() : null,
    scopes: t.scope ?? null,
    connected_by: st.email,
    connected_at: new Date().toISOString(),
  });
  if (error) return back("Could not save the connection: " + error.message);

  return back(`Connected @${who.username}`, true);
});
