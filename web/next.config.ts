import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const config: NextConfig = {
  // Static review build; protected APIs arrive in later versions.
  output: "export",
  trailingSlash: true,
  // GitHub Pages project sites are served from /<repo>/; keep local builds at root.
  ...(basePath ? { basePath } : {}),
};

export default config;
