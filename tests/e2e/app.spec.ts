import { STATIC_PAGES } from "../../src/lib/routeTable"
import { api, expect, expectNoAppErrors, login, test } from "./fixtures"

test.describe("application shell", () => {
  test("redirects to login, signs in and shows the dashboard", async ({ page, errors }) => {
    await page.goto("./")
    await expect(page).toHaveURL(/\/tyremate-web\/login\/$/)
    await expect(page.getByText("Database: This browser (local database)")).toBeVisible()
    await page.locator("#username").fill("admin")
    await page.locator("#password").fill("wrong")
    await page.getByRole("button", { name: "Login" }).click()
    await expect(page.getByText("Invalid password")).toBeVisible()

    await login(page)
    await expect(page.getByRole("alert").filter({ hasText: "default password" })).toBeVisible()
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Admin" })).toBeVisible()
    // Brand logo is delivered from Cloudinary.
    expect(errors.cdnRequests.some((u) => u.includes("/dkj22lm1g/image/upload/tyremate/static/logo.svg"))).toBe(true)
    expectNoAppErrors(errors)
  })

  test("every page renders without errors", async ({ page, errors }) => {
    test.setTimeout(240_000)
    await login(page)
    // Data so detail pages have something to show.
    await api(page, `await window.api.admin.seedSampleData({ includeStock: true })`)

    const routes = [...STATIC_PAGES].filter((r) => !["/login", "/setup"].includes(r))
    for (const route of routes) {
      await page.goto(`.${route === "/" ? "/" : `${route}/`}`)
      await expect(page.locator("h1, h2").first(), route).toBeVisible()
      await expect(page.getByText("Something went wrong"), route).toHaveCount(0)
      await expect(page.getByText("Sign in to TyreMate"), route).toHaveCount(0)
      await page.waitForTimeout(150)
    }
    expectNoAppErrors(errors)
  })

  test("a Cashier can use every page their role reaches without being signed out", async ({ page, errors }) => {
    test.setTimeout(240_000)
    await login(page)
    await api(page, `
      await window.api.admin.seedSampleData({ includeStock: true })
      await window.api.admin.createUser({ username: "cashier.sweep", password: "cashier1", roleIds: [3] })
    `)
    await page.getByRole("button", { name: "Sign Out" }).first().click()
    await login(page, "cashier.sweep", "cashier1")
    const routes = [...STATIC_PAGES].filter((r) => !["/login", "/setup"].includes(r))
    for (const route of routes) {
      await page.goto(`.${route === "/" ? "/" : `${route}/`}`)
      await expect(page.locator("h1, h2").first(), route).toBeVisible()
      await expect(page.getByText("Something went wrong"), route).toHaveCount(0)
      await expect(page.getByRole("heading", { name: "Sign in to TyreMate" }), route).toHaveCount(0)
      await page.waitForTimeout(150)
    }
    expect(errors.pageErrors, "uncaught page errors").toEqual([])
  })

  test("keeps data across reloads (IndexedDB) and survives a new tab after the first closes", async ({ page, context, errors }) => {
    await login(page)
    await api(page, `await window.api.customers.createCustomer({ CustomerCode: "PERSIST-1", Name: "Persisted Customer" })`)
    await page.reload()
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
    await page.goto("master-data/customers/")
    await expect(page.getByText("Persisted Customer")).toBeVisible()
    await page.close()

    const second = await context.newPage()
    await second.goto("master-data/customers/")
    // sessionStorage is per tab: the new tab must sign in, data is still there.
    await expect(second.getByRole("heading", { name: "Sign in to TyreMate" })).toBeVisible()
    await login(second)
    await second.goto("master-data/customers/")
    await expect(second.getByText("Persisted Customer")).toBeVisible()
    expectNoAppErrors(errors)
  })

  test("a second tab on the same local database is blocked", async ({ page, context }) => {
    await login(page)
    const other = await context.newPage()
    await other.goto("login/")
    await expect(other.getByText("already open in another tab")).toBeVisible()
    await other.close()
  })
})
