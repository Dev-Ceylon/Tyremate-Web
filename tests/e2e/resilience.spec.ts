import { expect, test } from "./fixtures"

test.describe("worker start-up resilience", () => {
  test("starts the backend without downloading Node polyfills like crypto-browserify", async ({ page }) => {
    const chunks: { url: string; body: string }[] = []
    page.on("response", async (response) => {
      if (/\/_next\/static\/chunks\/.+\.js$/.test(response.url())) {
        chunks.push({ url: response.url(), body: await response.text().catch(() => "") })
      }
    })
    await page.goto("login/")
    await expect(page.getByRole("heading", { name: "Sign in to TyreMate" })).toBeVisible()
    const offenders = chunks.filter((c) => /PRIVATE KEY|asn1\.js|createCipheriv/.test(c.body)).map((c) => c.url)
    expect(offenders).toEqual([])
  })

  test("recovers from a worker chunk that fails to download (stale tab after a redeploy)", async ({ page }) => {
    // Count full document loads (not client-side history updates).
    let documentLoads = 0
    page.on("request", (request) => {
      if (request.resourceType() === "document" && request.frame() === page.mainFrame()) documentLoads++
    })
    // Fail every chunk the worker loads via importScripts.
    await page.route(/\/_next\/static\/chunks\/(?!tyremate-backend)[^/]+\.js$/, async (route) => {
      const isWorker = route.request().frame() === null || route.request().serviceWorker() !== null
      if (isWorker || route.request().resourceType() === "other") return route.fulfill({ status: 404, body: "gone" })
      return route.continue()
    })
    await page.goto("login/")
    // First failure triggers one automatic reload; the second shows the explanation.
    await expect(page.getByRole("button", { name: "Reload page" })).toBeVisible()
    await expect(page.getByText("could not be downloaded")).toBeVisible()
    // Initial load + exactly one automatic reload: no reload loop.
    await page.waitForTimeout(1500)
    expect(documentLoads).toBe(2)

    // Once the files are reachable again, "Reload page" recovers.
    await page.unroute(/\/_next\/static\/chunks\/(?!tyremate-backend)[^/]+\.js$/)
    await page.getByRole("button", { name: "Reload page" }).click()
    await expect(page.getByRole("heading", { name: "Sign in to TyreMate" })).toBeVisible()
  })
})
