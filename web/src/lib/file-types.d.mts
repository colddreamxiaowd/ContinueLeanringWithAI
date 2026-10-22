export function extensionOf(name: string): string;
export type PreviewKind = "folder" | "image" | "text" | "pdf" | "download";
export function previewKind(name: string, itemType?: string): PreviewKind;
export function mimeTypeForName(name: string): string;
export function safeFileName(name: string): string;
