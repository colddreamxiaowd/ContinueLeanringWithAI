/** Accept a Feishu Drive folder URL copied from the browser, or an opaque token. */
export function parseFeishuFolderToken(value) {
  const raw = String(value || "").trim();
  if (/^[A-Za-z0-9_-]{10,200}$/.test(raw)) return raw;
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (!(host === "feishu.cn" || host.endsWith(".feishu.cn") ||
        host === "larksuite.com" || host.endsWith(".larksuite.com"))) return null;
  const match = url.pathname.match(/^\/drive\/folder\/([A-Za-z0-9_-]{10,200})\/?$/i);
  return match ? match[1] : null;
}
