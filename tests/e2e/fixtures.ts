import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import { test as base, expect, type Page } from "@playwright/test"

const root = path.resolve(__dirname, "../..")

export interface ErrorLog {
  pageErrors: string[]
  consoleErrors: string[]
  cdnRequests: string[]
}

/**
 * Cloudinary is not reachable from CI sandboxes, so the CDN is simulated:
 * requests to res.cloudinary.com are answered with the same files the upload
 * script publishes. Tests can assert which CDN URLs the app requested.
 */
async function simulateCloudinaryCdn(page: Page, log: ErrorLog) {
  await page.route("https://res.cloudinary.com/**", async (route) => {
    const url = route.request().url()
    log.cdnRequests.push(url)
    const match = /\/tyremate\/static\/(.+)$/.exec(new URL(url).pathname)
    let file: string | null = null
    if (match) {
      const id = match[1]
      if (id === "logo.svg" || id === "favicon.svg") file = path.join(root, "public", id)
      const manual = /^manual\/(.+)$/.exec(id)
      if (manual) file = path.join(root, "docs/images", `${manual[1]}.png`)
    }
    if (file && existsSync(file)) {
      await route.fulfill({ status: 200, body: readFileSync(file), contentType: file.endsWith(".svg") ? "image/svg+xml" : "image/png" })
    } else {
      await route.fulfill({ status: 404, body: "not found" })
    }
  })
}

export const test = base.extend<{ errors: ErrorLog }>({
  errors: async ({ page }, use) => {
    const log: ErrorLog = { pageErrors: [], consoleErrors: [], cdnRequests: [] }
    page.on("pageerror", (error) => log.pageErrors.push(error.message))
    page.on("console", (msg) => {
      if (msg.type() !== "error") return
      const text = msg.text()
      // Expected, user-visible failures (e.g. wrong password) are logged by the
      // desktop renderer as IPC errors; network noise is not an app error.
      if (/IPC error on channel|Failed to load resource|net::ERR_/i.test(text)) return
      // Handled errors recorded by the backend error logger ("[channel] Error: ...").
      if (/^\[[\w:.-]+\] /.test(text)) return
      log.consoleErrors.push(text)
    })
    await simulateCloudinaryCdn(page, log)
    await use(log)
  },
})

export { expect }

export async function login(page: Page, username = "admin", password = "1234") {
  await page.goto("login/")
  await expect(page.getByRole("heading", { name: "Sign in to TyreMate" })).toBeVisible()
  await page.locator("#username").fill(username)
  await page.locator("#password").fill(password)
  await page.getByRole("button", { name: "Login" }).click()
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
}

/** Calls the window.api surface (the Electron preload contract) from the page. */
export async function api<T = unknown>(page: Page, script: string): Promise<T> {
  return page.evaluate(`(async () => { ${script} })()`) as Promise<T>
}

export function expectNoAppErrors(errors: ErrorLog) {
  expect(errors.pageErrors, "uncaught page errors").toEqual([])
  expect(errors.consoleErrors, "console errors").toEqual([])
}
