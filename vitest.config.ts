import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    pool: "forks",
    poolOptions: { forks: { singleFork: false } },
    isolate: true,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    globalSetup: ["tests/helpers/globalSetup.ts"],
  },
})
