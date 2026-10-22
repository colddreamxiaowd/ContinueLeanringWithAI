const MIME_TYPES = {
  txt: "text/plain; charset=utf-8",
  md: "text/plain; charset=utf-8",
  markdown: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  log: "text/plain; charset=utf-8",
  json: "application/json; charset=utf-8",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  avif: "image/avif",
  heic: "image/heic",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
};

export function extensionOf(name) {
  const trimmed = String(name || "").trim();
  const dot = trimmed.lastIndexOf(".");
  return dot > -1 ? trimmed.slice(dot + 1).toLowerCase() : "";
}

export function previewKind(name, itemType = "file") {
  if (itemType === "folder") return "folder";
  const ext = extensionOf(name);
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff", "avif", "heic"].includes(ext)) return "image";
  if (["txt", "md", "markdown", "csv", "log"].includes(ext)) return "text";
  if (ext === "pdf") return "pdf";
  return "download";
}

export function mimeTypeForName(name) {
  const ext = extensionOf(name);
  // Never serve active SVG/HTML from a private file endpoint as inline content.
  if (ext === "svg" || ext === "html" || ext === "htm" || ext === "xhtml") {
    return "application/octet-stream";
  }
  return MIME_TYPES[ext] || "application/octet-stream";
}

export function safeFileName(name) {
  const value = String(name || "download").replace(/[\r\n"\\/]/g, "_").trim();
  return value.slice(0, 180) || "download";
}
