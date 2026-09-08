import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["xlsx"],
  // This app lives inside a parent folder that has its own (unrelated)
  // lockfile — pin Turbopack's root so it doesn't try to trace upward.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
