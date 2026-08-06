import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/public-config.ts",
    "src/envconfig.ts",
    "src/ports.ts",
    "src/timezone.ts",
    "src/enums/index.ts",
    "src/issuance/index.ts",
    "src/validation/index.ts",
    "src/sanitize.ts",
    "src/console/index.ts",
    "src/build.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: "es2021",
});
