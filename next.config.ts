import type { NextConfig } from "next";
import "./src/env";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tiktoken"],
};

export default nextConfig;
