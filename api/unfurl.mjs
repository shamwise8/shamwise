// Link-card metadata for the post preview.
// This fetches URLs supplied by the browser, so it is deliberately paranoid:
// http(s) only, public addresses only, redirects re-checked, capped size and time.
import dns from "node:dns/promises";
import net from "node:net";

const TIMEOUT_MS = 5000;
const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224;
  }
  const s = ip.toLowerCase();
  return s === "::1" || s === "::" || s.startsWith("fc") || s.startsWith("fd") ||
         s.startsWith("fe80") || s.startsWith("::ffff:");
}

async function safeUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.hostname === "localhost" || u.hostname.endsWith(".localhost")) return null;
  let addrs;
  try { addrs = await dns.lookup(u.hostname, { all: true }); } catch { return null; }
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) return null;
  return u;
}

const pick = (html, ...names) => {
  for (const n of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${n}["'][^>]*content=["']([^"']*)["']|` +
      `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${n}["']`, "i");
    const m = html.match(re);
    const v = m && (m[1] ?? m[2]);
    if (v && v.trim()) return v.trim();
  }
  return "";
};

const decode = (s) => String(s)
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

async function fetchMeta(url) {
  let current = url, hops = 0;
  while (hops <= MAX_REDIRECTS) {
    const safe = await safeUrl(current);
    if (!safe) return null;
    const ctl = AbortSignal.timeout(TIMEOUT_MS);
    const r = await fetch(safe.href, {
      redirect: "manual",
      signal: ctl,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PostboxPreview/1.0)", Accept: "text/html" },
    });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
      current = new URL(r.headers.get("location"), safe).href; hops++; continue;
    }
    if (!r.ok) return null;
    if (!(r.headers.get("content-type") || "").includes("text/html")) return null;

    // read at most MAX_BYTES — the tags we want live in <head>
    const reader = r.body.getReader();
    let html = "", got = 0;
    const dec = new TextDecoder();
    while (got < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      got += value.length;
      html += dec.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
    reader.cancel().catch(() => {});

    const title = decode(pick(html, "og:title", "twitter:title") ||
      (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || ""));
    const desc = decode(pick(html, "og:description", "twitter:description", "description"));
    let image = pick(html, "og:image:secure_url", "og:image", "twitter:image");
    if (image) { try { image = new URL(decode(image), safe).href; } catch { image = ""; } }
    const card = pick(html, "twitter:card");
    if (!title && !image) return null;
    return { url: safe.href, domain: safe.hostname.replace(/^www\./, ""), title, desc, image, large: card === "summary_large_image" };
  }
  return null;
}

export default async function handler(req, res) {
  const target = new URL(req.url, `https://${req.headers.host}`).searchParams.get("url") || "";
  res.setHeader("Content-Type", "application/json");
  if (!target) { res.statusCode = 400; return res.end(JSON.stringify({ error: "url required" })); }
  let meta = null;
  try { meta = await fetchMeta(target); } catch { /* returns null below */ }
  if (!meta) {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: "no preview" }));
  }
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
  res.end(JSON.stringify(meta));
}
