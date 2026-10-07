import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
    restoreMocks: true,

    coverage: {
      provider: "v8",

      reporter: ["text", "json-summary", "html"],

      reportsDirectory: "./coverage",

      thresholds: {
        statements: 70,
        branches: 60,
        functions: 75,
        lines: 70,
      },
    },
  },
});
