import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/manifest.ts",
    "src/server/index.ts",
    "src/client/index.ts",
    "src/admin/index.ts",
    "src/nuxt/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: "es2021",
  external: ["@nestjs/common", "@nestjs/core", "@nestjs/schedule", "typeorm", "rxjs", "reflect-metadata"],
});
