import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    globals: true,
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**"],
      exclude: [
        "src/__tests__/**",
        "src/**/*.d.ts",
        "src/**/*.test.*",
        "src/**/*.spec.*",
      ],
      thresholds: {
        global: {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
