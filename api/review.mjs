// Key-gated batch review page. Nothing renders until the access key verifies,
// and the link's unfurl deliberately shows nothing about the content.
const SB_URL = "https://sepomduzcpuwmarjvqth.supabase.co";
const SB_ANON = "sb_publishable_4KO7yLJE3bX-CisShQbokw_3Ny0cS5a";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const segments = (t) => String(t || "")
  .split(/\n\s*---\s*\n|\n[ \t]*\n[ \t]*\n+/).map((x) => x.trim()).filter(Boolean);
const URL_RE = /https?:\/\/\S+|(?:^|\s)(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/gi;
function tweetLen(s) {
  let n = 0;
  const rest = s.replace(URL_RE, (m) => { n += 23 + (m.startsWith(" ") ? 1 : 0); return m.startsWith(" ") ? " " : ""; });
  for (const ch of rest) n += /[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-￯]/.test(ch) ? 2 : 1;
  return n;
}
const CSS = `
  :root { --bg:#0d0d0f; --panel:#141417; --panel2:#1b1b1f; --line:#26262c; --text:#e9e9ee;
          --dim:#8a8a94; --bad:#f87171; --accent:#e84142; --on-accent:#fff; }
  html[data-theme="solana"]    { --accent:#9945ff; --bg:#0c0a12; --panel:#141019; --panel2:#1b1622; --line:#2a2136; }
  html[data-theme="bitcoin"]   { --accent:#f7931a; }
  html[data-theme="ethereum"]  { --accent:#627eea; }
  html[data-theme="base"]      { --accent:#0052ff; }
  html[data-theme="mono"]      { --accent:#8a8a94; }
  html[data-theme="forest"]    { --accent:#16a34a; }
  html[data-theme="robinhood"] { --accent:#a5d610; --on-accent:#0a0a0a; --bg:#070707; --panel:#101010; --panel2:#171717; --line:#262626; }
  html[data-theme="sunset"]    { --accent:#f43f5e; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--text);
         font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif; }
  .bar { border-bottom:1px solid var(--line); padding:12px 16px; display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; }
  .bar b { font-size:14px; } .bar span { color:var(--dim); font-size:12.5px; }
  .tabs { display:flex; gap:6px; overflow-x:auto; padding:10px 16px; border-bottom:1px solid var(--line);
          position:sticky; top:0; background:var(--bg); z-index:5; }
  .tab { flex:none; background:var(--panel2); border:1px solid var(--line); color:var(--dim);
         border-radius:99px; padding:5px 12px; font-size:12.5px; cursor:pointer; white-space:nowrap; }
  .tab.on { background:var(--accent); color:var(--on-accent); border-color:transparent; font-weight:600; }
  .wrap { max-width:600px; margin:0 auto; padding:22px 16px 60px; }
  .post { display:none; } .post.on { display:block; }
  .pmeta { color:var(--dim); font-size:12.5px; margin-bottom:14px; }
  .tw { display:flex; gap:12px; }
  .rail { width:44px; flex:none; display:flex; flex-direction:column; align-items:center; }
  .av { width:44px; height:44px; border-radius:99px; overflow:hidden; display:flex; align-items:center;
        justify-content:center; background:var(--panel2); font-size:18px; flex:none; }
  .av img { width:100%; height:100%; object-fit:cover; }
  .line { flex:1; width:2px; background:var(--line); margin-top:4px; min-height:12px; }
  .main { flex:1; min-width:0; padding-bottom:14px; }
  .who { display:flex; gap:5px; align-items:baseline; flex-wrap:wrap; }
  .who .nm { font-weight:700; } .who .hd { color:var(--dim); }
  .body { white-space:pre-wrap; word-wrap:break-word; margin-top:2px; }
  .over { margin-top:6px; font-size:12px; color:var(--bad); font-weight:600; }
  .media { margin-top:12px; border-radius:16px; overflow:hidden; border:1px solid var(--line);
           display:grid; gap:2px; background:var(--line); }
  .media.n1 { grid-template-columns:1fr; }
  .media.n2 { grid-template-columns:1fr 1fr; aspect-ratio:16/9; }
  .media.n3, .media.n4 { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; aspect-ratio:16/9; }
  .media.n3 .cell:first-child { grid-row:span 2; }
  .cell { position:relative; overflow:hidden; background:var(--panel2); min-height:0; }
  .cell img, .cell video { width:100%; height:100%; object-fit:cover; display:block; }
  .media.n1 .cell img, .media.n1 .cell video { height:auto; max-height:510px; }
  .gate { max-width:360px; margin:16vh auto; padding:0 20px; text-align:center; }
  .gate h1 { font-size:19px; margin:0 0 6px; }
  .gate p { color:var(--dim); font-size:13.5px; margin:0 0 18px; }
  .gate input { width:100%; padding:11px 12px; border-radius:9px; border:1px solid var(--line);
                background:var(--panel2); color:var(--text); font-size:15px; }
  .gate button { width:100%; margin-top:10px; padding:11px; border-radius:9px; border:0;
                 background:var(--accent); color:var(--on-accent); font-size:15px; font-weight:600; cursor:pointer; }
  .err { color:var(--bad); font-size:13px; margin-top:12px; }
  .foot { max-width:600px; margin:0 auto; padding:0 16px 40px; color:var(--dim); font-size:12px; text-align:center; }
  .foot a { color:var(--dim); }`;

const shell = (title, theme, body) => `<!doctype html>
<html lang="en"${theme && theme !== "team1" ? ` data-theme="${esc(theme)}"` : ""}>
<head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${esc(title)}</title>
<meta property="og:title" content="Private review link" />
<meta property="og:description" content="An access key is required to open this." />
<meta name="twitter:card" content="summary" />
<style>${CSS}</style>
</head>
<body>${body}
<div class="foot">Private review · made with <a href="/postbox">Postbox</a></div>
</body></html>`;

const gate = (tok, err) => shell("Review link", null, `
<form class="gate" method="POST" action="/postbox/r/?t=${esc(tok)}">
  <h1>🔐 Access key required</h1>
  <p>This review link is private. Enter the key you were given.</p>
  <input type="password" name="key" placeholder="Access key" autofocus autocomplete="off" required />
  <button type="submit">Open</button>
  ${err ? `<div class="err">${esc(err)}</div>` : ""}
</form>`);

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return Object.fromEntries(new URLSearchParams(raw)); }
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const tok = url.searchParams.get("t") || "";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("Cache-Control", "no-store");

  if (!UUID.test(tok)) { res.statusCode = 404; return res.end(gate("", "That link is not valid.")); }

  const cookies = Object.fromEntries((req.headers.cookie || "").split(";")
    .map((c) => c.trim().split("=")).filter((p) => p.length === 2).map(([k, v]) => [k, decodeURIComponent(v)]));
  const cookieName = "rk_" + tok.slice(0, 8);

  let key = "";
  if (req.method === "POST") key = (await readBody(req)).key || "";
  else key = cookies[cookieName] || "";
  if (!key) return res.end(gate(tok));

  let data = null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/open_review_set`, {
      method: "POST",
      headers: { apikey: SB_ANON, "Content-Type": "application/json", "Content-Profile": "postbox" },
      body: JSON.stringify({ tok, key }),
    });
    if (r.ok) data = await r.json();
  } catch { /* handled below */ }

  if (!data) {
    res.setHeader("Set-Cookie", `${cookieName}=; Path=/postbox/r; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
    res.statusCode = 401;
    return res.end(gate(tok, req.method === "POST" ? "That key did not work." : null));
  }

  // key is good — remember it for this browser so refreshes and tabs keep working
  res.setHeader("Set-Cookie",
    `${cookieName}=${encodeURIComponent(key)}; Path=/postbox/r; Max-Age=28800; HttpOnly; Secure; SameSite=Strict`);

  const ws = data.workspace || {};
  const name = ws.name || "Preview";
  const posts = Array.isArray(data.posts) ? data.posts : [];
  const mark = ws.avatar_url
    ? `<span class="av"><img src="${esc(ws.avatar_url)}" alt="" /></span>`
    : `<span class="av">${esc(name.slice(0, 1).toUpperCase())}</span>`;

  const fmtDay = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
  const tabs = posts.map((p, i) =>
    `<button class="tab${i === 0 ? " on" : ""}" data-i="${i}">${i + 1} · ${
      p.planned_at ? esc(fmtDay(p.planned_at)) : "undated"}</button>`).join("");

  const panels = posts.map((p, i) => {
    const segs = segments(p.content);
    const media = Array.isArray(p.media) ? p.media : [];
    const over = segs.filter((x) => tweetLen(x) > 280).length;
    const thread = segs.map((seg, j) => {
      const mine = media.filter((m) => Math.min(m.seg ?? 0, segs.length - 1) === j).slice(0, 4);
      const cells = mine.map((m) => `<span class="cell">${m.type === "video"
        ? `<video src="${esc(m.url)}" muted playsinline controls></video>`
        : `<img src="${esc(m.url)}" alt="" loading="lazy" />`}</span>`).join("");
      const n = tweetLen(seg);
      return `<div class="tw">
        <div class="rail">${mark}${j < segs.length - 1 ? `<div class="line"></div>` : ""}</div>
        <div class="main">
          <div class="who"><span class="nm">${esc(name)}</span>${ws.handle ? `<span class="hd">${esc(ws.handle)}</span>` : ""}</div>
          <div class="body">${esc(seg)}</div>
          ${cells ? `<div class="media n${mine.length}">${cells}</div>` : ""}
          ${n > 280 ? `<div class="over">${n}/280 — too long to post</div>` : ""}
        </div></div>`;
    }).join("");
    return `<div class="post${i === 0 ? " on" : ""}" data-i="${i}">
      <div class="pmeta">${esc(p.title || "Untitled")}${p.planned_at ? " · 📅 " + esc(fmtDay(p.planned_at)) : ""} · ${segs.length} tweet${segs.length === 1 ? "" : "s"}${over ? ` · ⚠ ${over} over 280` : ""}</div>
      ${thread}</div>`;
  }).join("");

  res.statusCode = 200;
  res.end(shell(`${data.name} — ${name}`, ws.theme, `
<div class="bar"><b>${esc(data.name)}</b><span>${esc(name)}${ws.handle ? " " + esc(ws.handle) : ""} · ${posts.length} post${posts.length === 1 ? "" : "s"}</span></div>
${posts.length > 1 ? `<div class="tabs">${tabs}</div>` : ""}
<div class="wrap">${panels || `<div class="pmeta">Nothing in this set.</div>`}</div>
<script>
document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
  const i = b.dataset.i;
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === b));
  document.querySelectorAll(".post").forEach((p) => p.classList.toggle("on", p.dataset.i === i));
  window.scrollTo(0, 0);
}));
</script>`));
}
