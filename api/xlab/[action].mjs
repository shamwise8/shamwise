// X lab: a throwaway test bench for the Avalanche Halloween guest app.
// It proves the risky X API calls on real phones before the build is handed over:
// OAuth 2.0 PKCE login, follow, repost, post with a phone photo, read-back, token refresh.
//
// One function serves every route under /api/xlab/<action>. Nothing is stored server-side:
// the X tokens live in an encrypted, httpOnly cookie in the tester's own browser.
// Every X request is recorded as a "step" (status, timing, rate-limit headers, X's body)
// and sent back to the page so failures can be screenshotted.
//
// Env (Vercel project settings):
//   X_CLIENT_ID, X_CLIENT_SECRET   required (same pair Postbox uses, or a dedicated app)
//   XLAB_PASSCODE                  optional but recommended: gate the page behind ?k=<passcode>
//   XLAB_FOLLOW_HANDLE             optional, default team1TH
//   XLAB_REPOST_ID                 optional, post id or URL prefilled in the repost field
//   XLAB_HASHTAG                   optional, default AvalancheHalloweenLab
//   XLAB_SESSION_SECRET            optional, defaults to a key derived from X_CLIENT_SECRET
//   XLAB_APP_URL                   optional origin override, e.g. https://www.shamwise.com
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

const API = "https://api.x.com/2";
const AUTHORIZE = "https://x.com/i/oauth2/authorize";
const TOKEN = "https://api.x.com/2/oauth2/token";
const REVOKE = "https://api.x.com/2/oauth2/revoke";
const SCOPES = "tweet.read tweet.write users.read follows.read follows.write media.write offline.access";
const PAGE = "/halloween-lab";          // the engineer's bench
const APP = "/halloween-lab/app";       // the guest flow (the prototype with real X steps)
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;         // Vercel caps request bodies at 4.5 MB; the page resizes first
// A post containing a link is billed far higher than a plain one, so captions never carry links.
const HAS_LINK = /(https?:\/\/[^\s]+)|(^|\s)(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i;

const env = (k, d = "") => (process.env[k] ?? d).trim();
const CLIENT_ID = () => env("X_CLIENT_ID");
const CLIENT_SECRET = () => env("X_CLIENT_SECRET");
const DEFAULTS = () => ({
  followHandle: env("XLAB_FOLLOW_HANDLE", "team1TH").replace(/^@/, ""),
  repostId: env("XLAB_REPOST_ID"),
  hashtag: env("XLAB_HASHTAG", "AvalancheHalloweenLab").replace(/^#/, ""),
});

/* ---------- small helpers ---------- */
const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");
const key = () => createHash("sha256").update("xlab:" + (env("XLAB_SESSION_SECRET") || CLIENT_SECRET())).digest();

function seal(obj) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return b64url(Buffer.concat([iv, c.getAuthTag(), ct]));
}
function unseal(str) {
  try {
    const raw = unb64url(str);
    const d = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8"));
  } catch { return null; }
}
const safeEq = (a, b) => {
  const x = createHash("sha256").update(String(a)).digest(), y = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(x, y);
};

function cookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function origin(req) {
  const fixed = env("XLAB_APP_URL").replace(/\/+$/, "");
  if (fixed) return fixed;
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "localhost");
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  const proto = String(req.headers["x-forwarded-proto"] || (local ? "http" : "https")).split(",")[0].trim();
  return `${proto}://${host}`;
}
function setCookie(res, req, name, value, { maxAge, httpOnly = true } = {}) {
  const secure = origin(req).startsWith("https://");
  const bits = [`${name}=${encodeURIComponent(value)}`, "Path=/", "SameSite=Lax"];
  if (httpOnly) bits.push("HttpOnly");
  if (secure) bits.push("Secure");
  if (maxAge !== undefined) bits.push(`Max-Age=${maxAge}`);
  const prev = res.getHeader("Set-Cookie");
  res.setHeader("Set-Cookie", [...(Array.isArray(prev) ? prev : prev ? [prev] : []), bits.join("; ")]);
}
const clearCookie = (res, req, name, httpOnly = true) => setCookie(res, req, name, "", { maxAge: 0, httpOnly });

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end(JSON.stringify(body));
}
function redirect(res, to) {
  res.statusCode = 302;
  res.setHeader("Location", to);
  res.setHeader("Cache-Control", "no-store");
  res.end();
}
async function readJson(req) {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) { try { return JSON.parse(req.body.toString("utf8")); } catch { return {}; } }
    if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
    if (typeof req.body === "object") return req.body;
  }
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 6 * 1024 * 1024) throw new Error("body too large"); chunks.push(c); }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return {}; }
}

/* ---------- X calls, recorded as steps ---------- */
const redact = (v) => {
  if (!v || typeof v !== "object") return typeof v === "string" ? v.slice(0, 1500) : v;
  const out = Array.isArray(v) ? [] : {};
  for (const [k, val] of Object.entries(v)) {
    out[k] = /^(access_token|refresh_token|id_token)$/.test(k)
      ? `[redacted, ${String(val).length} chars]`
      : (val && typeof val === "object" ? redact(val) : val);
  }
  return out;
};
async function xcall(steps, label, url, init = {}) {
  const t0 = Date.now();
  let status = 0, text = "", headers = null;
  try {
    const r = await fetch(url, init);
    status = r.status; headers = r.headers; text = await r.text();
  } catch (e) { text = `network error: ${e?.message || e}`; }
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
  const u = new URL(url);
  steps.push({
    label, method: init.method || "GET", url: u.origin + u.pathname + (u.search ? "?…" : ""),
    status, ms: Date.now() - t0,
    rate: headers && headers.get("x-rate-limit-limit") ? {
      limit: headers.get("x-rate-limit-limit"), remaining: headers.get("x-rate-limit-remaining"),
      reset: headers.get("x-rate-limit-reset"),
    } : null,
    body: redact(json ?? text),
  });
  return { ok: status >= 200 && status < 300, status, json, text };
}
const note = (steps, label, body, ok = true) => steps.push({ label, method: "NOTE", url: "", status: ok ? 200 : 0, ms: 0, rate: null, body });

function tokenRequest(params) {
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  const body = new URLSearchParams(params);
  if (CLIENT_SECRET()) headers.Authorization = "Basic " + Buffer.from(`${CLIENT_ID()}:${CLIENT_SECRET()}`).toString("base64");
  else body.set("client_id", CLIENT_ID());           // public client: no secret, id goes in the body
  return { method: "POST", headers, body };
}
const bearer = (s, extra = {}) => ({ Authorization: `Bearer ${s.at}`, ...extra });

function saveSession(res, req, s) { setCookie(res, req, "xlab_s", seal(s), { maxAge: 60 * 60 * 24 * 7 }); }

// Access tokens last about two hours; the event runs longer, so prove refresh works too.
async function refresh(steps, res, req, s) {
  if (!s.rt) { note(steps, "Refresh token", "No refresh token in this session (offline.access not granted).", false); return false; }
  const r = await xcall(steps, "Refresh access token", TOKEN, tokenRequest({ grant_type: "refresh_token", refresh_token: s.rt }));
  if (!r.ok || !r.json?.access_token) return false;
  s.at = r.json.access_token;
  s.rt = r.json.refresh_token || s.rt;
  s.exp = Date.now() + (r.json.expires_in || 7200) * 1000;
  s.scope = r.json.scope || s.scope;
  saveSession(res, req, s);
  return true;
}
async function ensureFresh(steps, res, req, s) {
  if (s.exp && s.exp - Date.now() < 60_000) await refresh(steps, res, req, s);
}

/* ---------- flash log for the redirect-based steps (login, callback) ---------- */
function flash(res, req, entry) {
  let json = JSON.stringify(entry);
  if (json.length > 2600) {                     // cookies top out near 4 KB once encoded; trim bodies first
    entry.steps = entry.steps.map((s) => ({ ...s, body: typeof s.body === "string" ? s.body.slice(0, 200) : JSON.stringify(s.body).slice(0, 200) }));
    json = JSON.stringify(entry);
  }
  setCookie(res, req, "xlab_log", b64url(Buffer.from(json.slice(0, 2900), "utf8")), { maxAge: 120, httpOnly: false });
}

/* ---------- gate ---------- */
function unlocked(req) {
  const pass = env("XLAB_PASSCODE");
  if (!pass) return true;
  const k = unseal(cookies(req).xlab_k || "");
  return !!(k && k.ok && safeEq(k.p, createHash("sha256").update(pass).digest("hex")));
}
function tryUnlock(req, res, given) {
  const pass = env("XLAB_PASSCODE");
  if (!pass || !given || !safeEq(given, pass)) return false;
  setCookie(res, req, "xlab_k", seal({ ok: 1, p: createHash("sha256").update(pass).digest("hex") }), { maxAge: 60 * 60 * 24 * 14 });
  return true;
}
function missingEnv() {
  const m = [];
  if (!CLIENT_ID()) m.push("X_CLIENT_ID");
  if (!CLIENT_SECRET() && !env("XLAB_SESSION_SECRET")) m.push("X_CLIENT_SECRET");
  return m;
}
const tweetId = (v) => {
  const s = String(v || "").trim();
  const m = s.match(/status(?:es)?\/(\d{5,25})/) || s.match(/^(\d{5,25})$/);
  return m ? m[1] : "";
};

/* ---------- routes ---------- */
export default async function handler(req, res) {
  const url = new URL(req.url, origin(req));
  const action = String(req.query?.action || url.pathname.split("/").filter(Boolean).pop() || "");
  const here = origin(req);
  const redirectUri = `${here}/api/xlab/callback`;
  // Redirect-based steps return to whichever page started them: ?to=app on the way in, carried in the state on the way back.
  let dest = url.searchParams.get("to") === "app" ? APP : PAGE;
  const back = (q) => redirect(res, `${here}${dest}${q ? "?" + q : ""}`);
  const jar = cookies(req);
  const steps = [];

  try {
    /* status: what the page needs to draw itself */
    if (action === "me") {
      const given = url.searchParams.get("k") || "";
      const open = unlocked(req) || tryUnlock(req, res, given);
      const missing = missingEnv();
      if (!open) return send(res, 401, { locked: true, wrongPasscode: !!given });
      const s = unseal(jar.xlab_s || "");
      return send(res, 200, {
        configured: missing.length === 0, missing, redirectUri,
        passcodeSet: !!env("XLAB_PASSCODE"), scopesRequested: SCOPES, defaults: DEFAULTS(),
        session: s ? { user: s.u, scope: s.scope || "", expiresAt: s.exp || 0, hasRefresh: !!s.rt } : null,
      });
    }

    /* everything below needs the gate and the env */
    if (action !== "callback" && !unlocked(req)) {
      return req.method === "GET" ? back("login=locked") : send(res, 401, { locked: true });
    }
    if (missingEnv().length) {
      return req.method === "GET" ? back("login=unconfigured") : send(res, 503, { error: "Lab is not configured", missing: missingEnv() });
    }

    if (action === "login") {
      const verifier = b64url(randomBytes(32));
      const challenge = b64url(createHash("sha256").update(verifier).digest());
      const nonce = b64url(randomBytes(12));
      // The verifier rides inside the encrypted state, so the exchange can still finish when an
      // in-app browser hands the flow to another browser. The cookie tells us whether that happened.
      const state = seal({ v: verifier, n: nonce, t: Date.now(), p: dest === APP ? "app" : "" });
      setCookie(res, req, "xlab_st", nonce, { maxAge: 600 });
      const a = new URL(AUTHORIZE);
      a.searchParams.set("response_type", "code");
      a.searchParams.set("client_id", CLIENT_ID());
      a.searchParams.set("redirect_uri", redirectUri);
      a.searchParams.set("scope", SCOPES);
      a.searchParams.set("state", state);
      a.searchParams.set("code_challenge", challenge);
      a.searchParams.set("code_challenge_method", "S256");
      return redirect(res, a.href);
    }

    if (action === "callback") {
      const err = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const st = unseal(url.searchParams.get("state") || "");
      if (st?.p === "app") dest = APP;
      const sameBrowser = !!(st && jar.xlab_st && jar.xlab_st === st.n);
      clearCookie(res, req, "xlab_st");
      const fail = (msg) => { note(steps, "Login failed", msg, false); flash(res, req, { title: "Log in with X", ok: false, steps }); return back("login=err"); };

      if (err) return fail(`X returned error=${err}: ${url.searchParams.get("error_description") || "no description"}`);
      if (!code) return fail("X came back without a code.");
      if (!st) return fail("The state value could not be read. It was changed in transit, or the lab's secret changed mid-login.");
      if (Date.now() - st.t > 10 * 60 * 1000) return fail("The login took longer than 10 minutes. Start again.");
      note(steps, sameBrowser ? "Same browser" : "DIFFERENT BROWSER",
        sameBrowser
          ? "The login started and finished in the same browser."
          : "The login finished in a different browser than the one it started in (no state cookie here). In the real app this is where guests get lost: the session now lives in THIS browser, not the one they tapped the button in.",
        sameBrowser);

      const tok = await xcall(steps, "Exchange code for tokens", TOKEN,
        tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri, code_verifier: st.v }));
      if (!tok.ok || !tok.json?.access_token) { flash(res, req, { title: "Log in with X", ok: false, steps }); return back("login=err"); }

      const s = {
        at: tok.json.access_token, rt: tok.json.refresh_token || "",
        exp: Date.now() + (tok.json.expires_in || 7200) * 1000, scope: tok.json.scope || "", u: null,
      };
      const me = await xcall(steps, "Read the logged-in account", `${API}/users/me?user.fields=username,name,profile_image_url`, { headers: bearer(s) });
      if (!me.ok || !me.json?.data?.id) { flash(res, req, { title: "Log in with X", ok: false, steps }); return back("login=err"); }
      s.u = { id: me.json.data.id, username: me.json.data.username, name: me.json.data.name };
      saveSession(res, req, s);
      flash(res, req, { title: `Log in with X · @${s.u.username}`, ok: true, crossBrowser: !sameBrowser, steps });
      return back(sameBrowser ? "login=ok" : "login=ok&cross=1");
    }

    /* the rest are POST actions on a logged-in session */
    if (req.method !== "POST") return send(res, 405, { error: "POST only" });
    const o = req.headers.origin;
    if (o && o !== here) return send(res, 403, { error: "Cross-site request refused" });
    const s = unseal(jar.xlab_s || "");

    if (action === "logout") {
      if (s?.at) await xcall(steps, "Revoke access token", REVOKE, tokenRequest({ token: s.at, token_type_hint: "access_token" }));
      clearCookie(res, req, "xlab_s");
      return send(res, 200, { ok: true, steps });
    }
    if (!s?.at || !s.u?.id) return send(res, 401, { error: "Not logged in. Log in with X first.", steps });

    const body = await readJson(req);
    const d = DEFAULTS();
    const json = { "Content-Type": "application/json" };

    if (action === "refresh") {
      const ok = await refresh(steps, res, req, s);
      return send(res, ok ? 200 : 502, { ok, expiresAt: s.exp, hasRefresh: !!s.rt, steps });
    }
    await ensureFresh(steps, res, req, s);

    // X removed follow/unfollow from pay-per-use on 16 Apr 2026. The API buttons stay so the lab captures
    // the exact refusal; this read-only check is what the guest app can rely on instead: the guest follows
    // on x.com (web intent), then we ask X whether the follow is there.
    if (action === "checkfollow") {
      const handle = String(body.handle || d.followHandle).replace(/^@/, "").trim();
      if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return send(res, 400, { error: "That is not a valid X handle.", steps });
      const r = await xcall(steps, `Is @${s.u.username} following @${handle}?`,
        `${API}/users/by/username/${handle}?user.fields=connection_status`, { headers: bearer(s) });
      const conn = r.json?.data?.connection_status;
      if (!r.ok || !r.json?.data?.id) return send(res, 502, { ok: false, error: `Could not look up @${handle}.`, steps });
      if (!Array.isArray(conn)) {
        note(steps, "No connection_status in the reply", "X answered, but without the field that says whether this account follows the target. The follow cannot be verified this way on this app.", false);
        return send(res, 200, { ok: false, handle, following: null, steps });
      }
      const following = conn.includes("following");
      return send(res, 200, { ok: true, handle, following, requested: conn.includes("follow_request_sent"), connection: conn, steps });
    }

    if (action === "follow" || action === "unfollow") {
      const handle = String(body.handle || d.followHandle).replace(/^@/, "").trim();
      if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return send(res, 400, { error: "That is not a valid X handle.", steps });
      const who = await xcall(steps, `Look up @${handle}`, `${API}/users/by/username/${handle}`, { headers: bearer(s) });
      const target = who.json?.data?.id;
      if (!who.ok || !target) return send(res, 502, { ok: false, error: `Could not find @${handle}.`, steps });
      if (target === s.u.id) return send(res, 400, { ok: false, error: "You cannot follow yourself. Use another handle.", steps });
      if (action === "follow") {
        const r = await xcall(steps, `Follow @${handle}`, `${API}/users/${s.u.id}/following`,
          { method: "POST", headers: bearer(s, json), body: JSON.stringify({ target_user_id: target }) });
        const ok = r.ok && !!(r.json?.data?.following || r.json?.data?.pending_follow);
        return send(res, ok ? 200 : 502, { ok, handle, pending: !!r.json?.data?.pending_follow, steps });
      }
      const r = await xcall(steps, `Unfollow @${handle}`, `${API}/users/${s.u.id}/following/${target}`, { method: "DELETE", headers: bearer(s) });
      return send(res, r.ok ? 200 : 502, { ok: r.ok && r.json?.data?.following === false, handle, steps });
    }

    if (action === "repost" || action === "unrepost") {
      const id = tweetId(body.post || d.repostId);
      if (!id) return send(res, 400, { error: "Paste a post URL or a numeric post id.", steps });
      if (action === "repost") {
        const r = await xcall(steps, `Repost ${id}`, `${API}/users/${s.u.id}/retweets`,
          { method: "POST", headers: bearer(s, json), body: JSON.stringify({ tweet_id: id }) });
        const ok = r.ok && r.json?.data?.retweeted === true;
        return send(res, ok ? 200 : 502, { ok, id, steps });
      }
      const r = await xcall(steps, `Undo repost ${id}`, `${API}/users/${s.u.id}/retweets/${id}`, { method: "DELETE", headers: bearer(s) });
      return send(res, r.ok ? 200 : 502, { ok: r.ok && r.json?.data?.retweeted === false, id, steps });
    }

    if (action === "post") {
      const text = String(body.text || "").trim();
      const tag = String(body.hashtag || d.hashtag).replace(/^#/, "").trim();
      if (!text) return send(res, 400, { error: "Write a caption first.", steps });
      if (HAS_LINK.test(text)) return send(res, 400, { error: "The caption contains a link. Posts with links are billed far higher, so the lab refuses them. Use tags and the hashtag only.", steps });

      let mediaId = "";
      if (body.image) {
        const m = String(body.image).match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/s);
        if (!m) return send(res, 400, { error: "The photo did not arrive as a JPEG, PNG, WebP or GIF.", steps });
        const buf = Buffer.from(m[2], "base64");
        if (buf.length > MAX_IMAGE_BYTES) return send(res, 413, { error: `The photo is ${(buf.length / 1048576).toFixed(1)} MB after resizing. The limit is 4 MB.`, steps });
        const fd = new FormData();
        fd.append("media", new Blob([buf], { type: m[1] }), "photo." + m[1].split("/")[1]);
        fd.append("media_category", "tweet_image");
        const up = await xcall(steps, `Upload photo (${Math.round(buf.length / 1024)} KB)`, `${API}/media/upload`, { method: "POST", headers: bearer(s), body: fd });
        mediaId = up.json?.data?.id || up.json?.id || up.json?.media_id_string || "";
        if (!up.ok || !mediaId) return send(res, 502, { ok: false, error: "X refused the photo upload.", steps });
      } else {
        note(steps, "No photo attached", "Posting text only. The real flow always attaches a photo.");
      }

      const payload = { text };
      if (mediaId) payload.media = { media_ids: [String(mediaId)] };
      const made = await xcall(steps, "Create the post", `${API}/tweets`, { method: "POST", headers: bearer(s, json), body: JSON.stringify(payload) });
      const id = made.json?.data?.id;
      if (!made.ok || !id) return send(res, 502, { ok: false, error: "X refused the post.", steps });

      // Read it back by id: the real app only credits spins once X shows the post with the hashtag.
      const q = "tweet.fields=entities,created_at&expansions=attachments.media_keys&media.fields=type,url";
      let back1 = await xcall(steps, "Read the post back", `${API}/tweets/${id}?${q}`, { headers: bearer(s) });
      if (!back1.ok || !back1.json?.data) {
        await new Promise((r) => setTimeout(r, 900));
        back1 = await xcall(steps, "Read the post back (retry)", `${API}/tweets/${id}?${q}`, { headers: bearer(s) });
      }
      const data = back1.json?.data || {};
      const tags = (data.entities?.hashtags || []).map((h) => String(h.tag || "").toLowerCase());
      const hashtagOk = tag ? (tags.includes(tag.toLowerCase()) || new RegExp(`#${tag}\\b`, "i").test(data.text || "")) : null;
      const mediaOk = mediaId ? !!((data.attachments?.media_keys || []).length || (back1.json?.includes?.media || []).length) : null;
      return send(res, 200, {
        ok: true, id, url: `https://x.com/${s.u.username}/status/${id}`,
        readBack: back1.ok, hashtag: tag, hashtagOk, mediaOk, steps,
      });
    }

    if (action === "delete") {
      const id = tweetId(body.id);
      if (!id) return send(res, 400, { error: "No post id given.", steps });
      const r = await xcall(steps, `Delete post ${id}`, `${API}/tweets/${id}`, { method: "DELETE", headers: bearer(s) });
      return send(res, r.ok ? 200 : 502, { ok: r.ok && r.json?.data?.deleted === true, id, steps });
    }

    return send(res, 404, { error: `Unknown action "${action}"` });
  } catch (e) {
    note(steps, "Lab crashed", String(e?.stack || e).slice(0, 600), false);
    if (req.method === "GET" && action !== "me") { flash(res, req, { title: "Lab error", ok: false, steps }); return back("login=err"); }
    return send(res, 500, { error: "The lab hit an error. See the log.", steps });
  }
}
