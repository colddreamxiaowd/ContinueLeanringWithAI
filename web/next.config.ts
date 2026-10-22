import type { NextConfig } from "next";

const config: NextConfig = {
  // V1 has only static, demonstrative material. Protected APIs arrive in later versions.
  output: "export",
  trailingSlash: true,
};

export default config;
