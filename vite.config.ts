import { builtinModules } from "node:module";
import path from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "dist",
    lib: {
      entry: path.resolve(import.meta.dirname, "./src/index.ts"),
      fileName: () => "index.mjs",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map((module) => `node:${module}`),
      ],
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
});
