import Database from "better-sqlite3"
import { startHranaServer, type RunningHrana } from "../helpers/hrana"
import { api, expect, expectNoAppErrors, login, test } from "./fixtures"

let server: RunningHrana

test.beforeEach(async () => {
  server = await startHranaServer("e2e-token")
})
test.afterEach(() => server?.stop())

function readRemote<T>(sql: string): T {
  const db = new Database(server.dbFile, { readonly: true })
  try {
    return db.prepare(sql).all() as T
  } finally {
    db.close()
  }
}

test.describe("shared remote database (Turso / libSQL)", () => {
  test("is configured from the setup page and used for all data", async ({ page, errors }) => {
    await page.goto("login/")
    await page.getByRole("link", { name: "Database settings" }).click()
    await expect(page.getByRole("heading", { name: "Database settings" })).toBeVisible()

    await page.getByLabel(/Shared remote database/).check()
    await page.getByLabel("Database URL").fill(server.url)
    await page.getByLabel("Auth token").fill("wrong-token")
    await page.getByRole("button", { name: "Test connection" }).click()
    await expect(page.getByText("Database rejected the credentials")).toBeVisible()

    await page.getByLabel("Auth token").fill("e2e-token")
    await page.getByRole("button", { name: "Test connection" }).click()
    await expect(page.getByTestId("db-test-result")).toContainText("Not installed yet")

    await page.getByRole("button", { name: "Save & connect" }).click()
    await expect(page.getByTestId("db-status")).toHaveText("Connected")
    await page.getByRole("link", { name: "Continue to sign in" }).click()
    await expect(page.getByText(/Database: Remote libSQL · 127\.0\.0\.1/)).toBeVisible()

    await login(page)
    await api(page, `await window.api.customers.createCustomer({ CustomerCode: "", Name: "Remote Customer" })`)
    // The row is in the server's database file, not in the browser.
    expect(readRemote<{ Name: string }[]>("SELECT Name FROM CustomerM")).toEqual([{ Name: "Remote Customer" }])

    // A second browser (fresh context) joins with a connection code and sees the same data.
    await page.goto("admin/")
    await page.getByText("Connection code (set up other devices quickly)").click()
    await page.getByRole("button", { name: "Generate code for these settings" }).click()
    const code = await page.getByLabel("Generated connection code").inputValue()
    expect(code.startsWith("TM1.")).toBe(true)

    const other = await page.context().browser()!.newContext()
    const otherPage = await other.newPage()
    await otherPage.goto(page.url().replace(/admin\/.*$/, "setup/"))
    await otherPage.getByText("Connection code (set up other devices quickly)").click()
    await otherPage.getByLabel("Paste a connection code").fill(code)
    await otherPage.getByRole("button", { name: "Load code" }).click()
    await otherPage.getByRole("button", { name: "Save & connect" }).click()
    await expect(otherPage.getByTestId("db-status")).toHaveText("Connected")
    await otherPage.goto(page.url().replace(/admin\/.*$/, "login/"))
    await otherPage.locator("#username").fill("admin")
    await otherPage.locator("#password").fill("1234")
    await otherPage.getByRole("button", { name: "Login" }).click()
    await expect(otherPage.getByRole("heading", { name: "Dashboard" })).toBeVisible()
    await otherPage.goto(page.url().replace(/admin\/.*$/, "master-data/customers/"))
    await expect(otherPage.getByText("Remote Customer")).toBeVisible()
    await other.close()
    expectNoAppErrors(errors)
  })

  test("pushes the local database to a remote server and switches to it", async ({ page, errors }) => {
    await login(page)
    await api(page, `await window.api.admin.seedSampleData({ includeStock: true })`)
    await page.goto("admin/")
    await page.getByLabel("Target database URL").fill(server.url)
    await page.getByLabel("Target auth token").fill("e2e-token")
    await page.getByRole("button", { name: "Copy data to remote database" }).click()
    await page.getByRole("button", { name: "Copy data", exact: true }).click()
    await expect(page.getByText("Data copied")).toBeVisible()
    await page.getByRole("button", { name: "Switch now" }).click()

    await expect(page.getByRole("heading", { name: "Sign in to TyreMate" })).toBeVisible()
    await expect(page.getByText(/Database: Remote libSQL/)).toBeVisible()
    await login(page)
    await page.goto("master-data/customers/")
    await expect(page.getByText("Kandy City Cabs")).toBeVisible()
    expect(readRemote<{ c: number }[]>("SELECT COUNT(*) AS c FROM CustomerM")[0].c).toBe(5)
    expectNoAppErrors(errors)
  })

  test("explains when the remote database is unreachable and allows fixing it", async ({ page }) => {
    await page.goto("setup/")
    await page.getByLabel(/Shared remote database/).check()
    await page.getByLabel("Database URL").fill(server.url)
    await page.getByLabel("Auth token").fill("e2e-token")
    await page.getByRole("button", { name: "Save & connect" }).click()
    await expect(page.getByTestId("db-status")).toHaveText("Connected")
    server.stop()
    await page.goto("login/")
    await expect(page.getByRole("heading", { name: "Cannot open the database" })).toBeVisible()
    await expect(page.getByText("Could not reach the database server")).toBeVisible()
    await page.getByRole("link", { name: "Database settings" }).click()
    await page.getByLabel(/This browser \(local\)/).check()
    await page.getByRole("button", { name: "Save & connect" }).click()
    await expect(page.getByTestId("db-status")).toHaveText("Connected")
  })
})
