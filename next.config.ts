import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Helps Turbopack resolve `next` when the inferred workspace root is wrong.
    // Dev still uses webpack by default (`npm run dev`) to avoid upstream Turbopack HMR panics
    // ("Next.js package not found" on `get_next_server_import_map`). Use `npm run dev:turbo` to try Turbopack.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
