import { defineConfig, devices } from "@playwright/test"

/**
 * E2E tests run against the production static export, built with the same
 * base path GitHub Pages uses (`npm run test:e2e` builds first).
 */
export const BASE_PATH = process.env.E2E_BASE_PATH ?? "/tyremate-web"
const PORT = Number(process.env.E2E_PORT ?? 4321)

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE_PATH}/`,
    trace: "off",
    viewport: { width: 1366, height: 900 },
    acceptDownloads: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } } }],
  webServer: {
    command: `node tests/helpers/pagesServer.mjs out ${PORT} ${BASE_PATH}`,
    url: `http://127.0.0.1:${PORT}${BASE_PATH}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
