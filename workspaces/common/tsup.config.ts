import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/public-config.ts",
    "src/envconfig.ts",
    "src/ports.ts",
    "src/enums/index.ts",
    "src/issuance/index.ts",
    "src/validation/index.ts",
    "src/console/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: "es2021",
});
