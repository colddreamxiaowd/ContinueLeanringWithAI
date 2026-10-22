import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const config: NextConfig = {
  // Full-stack Next.js runtime: protected API routes and account sessions require a server host such as Vercel.
  trailingSlash: true,
  // GitHub Pages project sites are served from /<repo>/; keep local builds at root.
  ...(basePath ? { basePath } : {}),
};

export default config;
