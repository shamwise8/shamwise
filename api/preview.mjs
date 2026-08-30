// Server-rendered public thread preview.
// Exists so link unfurls (Telegram, Slack, X, iMessage) get real Open Graph
// tags with the thread's own first image — crawlers do not run JavaScript.
const SB_URL = "https://sepomduzcpuwmarjvqth.supabase.co";
const SB_ANON = "sb_publishable_4KO7yLJE3bX-CisShQbokw_3Ny0cS5a";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// @handles, #hashtags and URLs, rendered the way X shows them.
function linkify(text) {
  // Same shape as the character counter's URL rule, so what counts as a link and
  // what renders as one cannot drift apart.
  const re = /(https?:\/\/[^\s<]+)|(^|\s)((?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<]*)?)|(^|[^\w@#\/])([@#])([A-Za-z0-9_]{1,30})/gi;
  const a = (href, label) =>
    `<a class="tl" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
  let out = "", last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(text))) {
    const [full, url, pre1, bare, pre2, sigil, word] = m;
    out += esc(text.slice(last, m.index));
    if (url) {
      const c = url.replace(/[.,;:!?)\]]+$/, "");
      out += a(c, c) + esc(url.slice(c.length));
    } else if (bare) {
      const c = bare.replace(/[.,;:!?)\]]+$/, "");
      out += esc(pre1) + a("https://" + c, c) + esc(bare.slice(c.length));
    } else {
      out += esc(pre2) + a(sigil === "@" ? `https://x.com/${word}` : `https://x.com/hashtag/${word}`, sigil + word);
    }
    last = m.index + full.length;
  }
  return out + esc(text.slice(last));
}

// Last link in a tweet — same rule as the counter, so bare domains count.
function lastLink(text) {
  const re = /(https?:\/\/[^\s<>"']+)|(?:^|\s)((?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"']*)?)/gi;
  let found = null, m;
  while ((m = re.exec(String(text || "")))) {
    const raw = (m[1] || m[2] || "").replace(/[.,;:!?)\]]+$/, "");
    if (raw) found = m[1] ? raw : "https://" + raw;
  }
  return found;
}

const segments = (t) => String(t || "")
  .split(/\n\s*---\s*\n|\n[ \t]*\n[ \t]*\n+/).map((x) => x.trim()).filter(Boolean);
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function page({ title, desc, image, body, theme, name }) {
  return `<!doctype html>
<html lang="en"${theme && theme !== "team1" ? ` data-theme="${esc(theme)}"` : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${esc(title)}</title>
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${esc(name ? name + " · Postbox" : "Postbox")}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
${image ? `<meta property="og:image" content="${esc(image)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${esc(image)}" />` : `<meta name="twitter:card" content="summary" />`}
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="description" content="${esc(desc)}" />
<style>
  :root { --bg:#0d0d0f; --panel2:#1b1b1f; --line:#26262c; --text:#e9e9ee; --dim:#8a8a94; --link:#1d9bf0; --accent:#e84142; }
  html[data-theme="solana"]    { --accent:#9945ff; --bg:#0c0a12; --panel2:#1b1622; --line:#2a2136; }
  html[data-theme="bitcoin"]   { --accent:#f7931a; }
  html[data-theme="ethereum"]  { --accent:#627eea; }
  html[data-theme="base"]      { --accent:#0052ff; }
  html[data-theme="mono"]      { --accent:#8a8a94; }
  html[data-theme="forest"]    { --accent:#16a34a; }
  html[data-theme="robinhood"] { --accent:#a5d610; --bg:#070707; --panel2:#171717; --line:#262626; }
  html[data-theme="sunset"]    { --accent:#f43f5e; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--text);
         font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif; }
  .bar { border-bottom:1px solid var(--line); padding:12px 16px; font-size:14px; font-weight:700; }
  .bar span { color:var(--dim); font-weight:400; font-size:12.5px; margin-left:6px; }
  .wrap { max-width:600px; margin:0 auto; padding:22px 16px 20px; }
  .tw { display:flex; gap:12px; }
  .rail { width:44px; flex:none; display:flex; flex-direction:column; align-items:center; }
  .av { width:44px; height:44px; border-radius:99px; overflow:hidden; display:flex; align-items:center;
        justify-content:center; background:var(--panel2); font-size:18px; flex:none; }
  .av img { width:100%; height:100%; object-fit:cover; }
  .line { flex:1; width:2px; background:var(--line); margin-top:4px; min-height:12px; }
  .main { flex:1; min-width:0; padding-bottom:14px; }
  .who { display:flex; gap:5px; align-items:baseline; flex-wrap:wrap; }
  .who .nm { font-weight:700; }
  .who .hd { color:var(--dim); }
  .tl { color:var(--link); text-decoration:none; }
  .tl:hover { text-decoration:underline; }
  .body { white-space:pre-wrap; word-wrap:break-word; margin-top:2px; }
  .qt { margin-top:12px; border:1px solid var(--line); border-radius:16px; overflow:hidden;
        display:block; text-decoration:none; color:inherit; background:var(--panel2); }
  .qt .qh { display:flex; align-items:center; gap:6px; padding:10px 12px 0; font-size:13.5px; }
  .qt .qa { width:20px; height:20px; border-radius:99px; background:var(--line); flex:none;
            display:flex; align-items:center; justify-content:center; font-size:11px; }
  .qt .qn { font-weight:700; }
  .qt .qd { color:var(--dim); }
  .qt .qx { padding:4px 12px 10px; font-size:14px; line-height:1.4; white-space:pre-wrap;
            overflow:hidden; display:-webkit-box; -webkit-line-clamp:6; -webkit-box-orient:vertical; }
  .qt .qm { position:relative; }
  .qt .qm img { width:100%; display:block; max-height:400px; object-fit:cover; }
  .qt .qp { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
  .qt .qp i { width:52px; height:52px; border-radius:99px; background:rgba(0,0,0,.65);
              border:2px solid rgba(255,255,255,.9); display:flex; align-items:center;
              justify-content:center; font-style:normal; color:#fff; font-size:19px; padding-left:4px; }
  .lcard { margin-top:12px; border:1px solid var(--line); border-radius:16px; overflow:hidden;
           display:block; text-decoration:none; color:inherit; background:var(--panel2); }
  .lcard .im { width:100%; aspect-ratio:1.91/1; object-fit:cover; display:block; border-bottom:1px solid var(--line); }
  .lcard.small { display:flex; align-items:stretch; }
  .lcard.small .im { width:128px; aspect-ratio:1/1; flex:none; border-bottom:0; border-right:1px solid var(--line); }
  .lcard .meta { padding:10px 12px; min-width:0; }
  .lcard .dm { color:var(--dim); font-size:12.5px; }
  .lcard .ti { font-size:14px; margin-top:1px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
  .lcard .ds { color:var(--dim); font-size:13px; margin-top:2px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
  .media { margin-top:12px; border-radius:16px; overflow:hidden; border:1px solid var(--line);
           display:grid; gap:2px; background:var(--line); }
  .media.n1 { grid-template-columns:1fr; }
  .media.n2 { grid-template-columns:1fr 1fr; aspect-ratio:16/9; }
  .media.n3, .media.n4 { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; aspect-ratio:16/9; }
  .media.n3 .cell:first-child { grid-row:span 2; }
  .cell { position:relative; overflow:hidden; background:var(--panel2); min-height:0; }
  .cell img, .cell video { width:100%; height:100%; object-fit:cover; display:block; }
  .media.n1 .cell img, .media.n1 .cell video { height:auto; max-height:510px; }
  .msg { color:var(--dim); text-align:center; padding:60px 20px; }
  .foot { max-width:600px; margin:0 auto; padding:0 16px 40px; color:var(--dim); font-size:12px; }
  .foot a { color:var(--dim); }
</style>
</head>
<body>${body}
<script>
(async () => {
  for (const el of document.querySelectorAll("[data-card]")) {
    try {
      const r = await fetch("/api/unfurl?url=" + encodeURIComponent(el.dataset.card));
      if (!r.ok) { el.remove(); continue; }
      const m = await r.json();
      const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
      if (m.type === "tweet") {
        el.outerHTML = '<a class="qt" href="' + esc(m.url) + '" target="_blank" rel="noopener noreferrer">' +
          '<div class="qh"><span class="qa">' + esc((m.author || "?").slice(0, 1)) + '</span>' +
          '<span class="qn">' + esc(m.author) + '</span><span class="qd">' + esc(m.handle) + '</span></div>' +
          (m.text ? '<div class="qx">' + esc(m.text) + '</div>' : "") +
          (m.image ? '<div class="qm"><img src="' + esc(m.image) + '" alt="" loading="lazy" onerror="this.parentNode.remove()" />' +
            (m.video ? '<span class="qp"><i>&#9654;</i></span>' : "") + '</div>' : "") + '</a>';
      } else {
        el.outerHTML = '<a class="lcard ' + (m.image && !m.large ? "small" : "") + '" href="' + esc(m.url) +
          '" target="_blank" rel="noopener noreferrer">' +
          (m.image ? '<img class="im" src="' + esc(m.image) + '" alt="" loading="lazy" onerror="this.remove()" />' : "") +
          '<div class="meta"><div class="dm">' + esc(m.domain) + '</div><div class="ti">' +
          esc(m.title || m.domain) + '</div>' +
          (m.desc ? '<div class="ds">' + esc(m.desc) + '</div>' : "") + '</div></a>';
      }
    } catch { el.remove(); }
  }
})();
</script>
<div class="foot">Read-only preview · made with <a href="/postbox">Postbox</a></div>
</body>
</html>`;
}

const notFound = (msg) => page({
  title: "Preview unavailable",
  desc: msg,
  image: "",
  name: "Postbox",
  body: `<div class="wrap"><div class="msg">${esc(msg)}</div></div>`,
});

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const tok = url.searchParams.get("t") || "";

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex");

  if (!UUID.test(tok)) {
    res.statusCode = 404;
    return res.end(notFound("No preview link given."));
  }

  let data = null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/shared_preview`, {
      method: "POST",
      headers: { apikey: SB_ANON, "Content-Type": "application/json", "Content-Profile": "postbox" },
      body: JSON.stringify({ tok }),
    });
    if (r.ok) data = await r.json();
  } catch { /* falls through to the not-found page */ }

  if (!data || !data.content) {
    res.statusCode = 404;
    return res.end(notFound("This preview link is not available. It may have been turned off."));
  }

  const name = data.name || "Preview";
  const segs = segments(data.content);
  const media = Array.isArray(data.media) ? data.media : [];
  const firstImage = (media.find((m) => m.type !== "video") || {}).url || data.avatar_url || "";

  const mark = data.avatar_url
    ? `<span class="av"><img src="${esc(data.avatar_url)}" alt="" /></span>`
    : `<span class="av">${esc(name.slice(0, 1).toUpperCase())}</span>`;

  const thread = segs.map((seg, i) => {
    const mine = media.filter((m) => Math.min(m.seg ?? 0, segs.length - 1) === i).slice(0, 4);
    const cells = mine.map((m) => `<span class="cell">${m.type === "video"
      ? `<video src="${esc(m.url)}" muted playsinline controls></video>`
      : `<img src="${esc(m.url)}" alt="" loading="lazy" />`}</span>`).join("");
    return `<div class="tw">
      <div class="rail">${mark}${i < segs.length - 1 ? `<div class="line"></div>` : ""}</div>
      <div class="main">
        <div class="who"><span class="nm">${esc(name)}</span>${data.handle ? `<span class="hd">${esc(data.handle)}</span>` : ""}</div>
        <div class="body">${linkify(seg)}</div>
        ${cells ? `<div class="media n${mine.length}">${cells}</div>`
          : (lastLink(seg) ? `<div data-card="${esc(lastLink(seg))}"></div>` : "")}
      </div></div>`;
  }).join("");

  // The card shows the post itself. og:site_name already carries the chapter, and
  // the title carries the first line — so the blurb starts after both, no echoes.
  const firstLine = segs[0].split("\n")[0].trim();
  const rest = segs.join("\n").slice(firstLine.length).replace(/\s+/g, " ").trim();
  const title = clip(firstLine || name, 70);
  const count = `${segs.length} tweet${segs.length === 1 ? "" : "s"}`;

  res.statusCode = 200;
  res.end(page({
    title,
    desc: clip(rest || firstLine, 200),
    image: firstImage,
    theme: data.theme,
    name,
    body: `<div class="bar">${esc(name)}<span>${data.handle ? esc(data.handle) + " · " : ""}${count}</span></div>
           <div class="wrap">${thread}</div>`,
  }));
}
