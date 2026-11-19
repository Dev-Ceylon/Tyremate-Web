import { readFileSync } from "node:fs"
import { api, expect, expectNoAppErrors, login, test } from "./fixtures"

test.describe("admin panel", () => {
  test("shows the database status and schema", async ({ page, errors }) => {
    await login(page)
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Admin" }).click()
    await expect(page.getByRole("heading", { name: "Admin panel" })).toBeVisible()
    await expect(page.getByTestId("db-status")).toHaveText("Connected")
    await expect(page.getByTestId("schema-migrations")).toContainText(/^(\d+) \/ \1 applied/)
    expectNoAppErrors(errors)
  })

  test("backs up, restores and exports SQL", async ({ page, errors }) => {
    await login(page)
    await api(page, `await window.api.customers.createCustomer({ CustomerCode: "", Name: "Before Backup" })`)
    await page.goto("admin/")

    const backupDownload = page.waitForEvent("download")
    await page.getByRole("button", { name: "Download .sqlite backup" }).click()
    const backup = await backupDownload
    expect(backup.suggestedFilename()).toMatch(/^tyremate-.*\.sqlite$/)
    const backupPath = (await backup.path())!
    expect(readFileSync(backupPath).subarray(0, 16).toString("latin1")).toBe("SQLite format 3\u0000")

    const sqlDownload = page.waitForEvent("download")
    await page.getByRole("button", { name: "Export .sql" }).click()
    const sql = readFileSync((await (await sqlDownload).path())!, "utf-8")
    expect(sql).toContain('CREATE TABLE')
    expect(sql).toContain("Before Backup")

    // Change data after the backup, then restore the backup.
    await api(page, `await window.api.customers.createCustomer({ CustomerCode: "", Name: "After Backup" })`)
    page.once("filechooser", (chooser) => chooser.setFiles(backupPath))
    await page.getByRole("button", { name: "Restore from file…" }).click()
    await page.getByRole("button", { name: "Replace database" }).click()
    // Restoring requires signing in again.
    await expect(page.getByRole("heading", { name: "Sign in to TyreMate" })).toBeVisible()
    await login(page)
    await page.goto("master-data/customers/")
    await expect(page.getByText("Before Backup")).toBeVisible()
    await expect(page.getByText("After Backup")).toHaveCount(0)
    expectNoAppErrors(errors)
  })

  test("rejects a file that is not a TyreMate database", async ({ page }) => {
    await login(page)
    await page.goto("admin/")
    page.once("filechooser", (chooser) =>
      chooser.setFiles({ name: "notes.sqlite", mimeType: "application/octet-stream", buffer: Buffer.from("hello") }),
    )
    await page.getByRole("button", { name: "Restore from file…" }).click()
    await page.getByRole("button", { name: "Replace database" }).click()
    await expect(page.getByText("not a SQLite database")).toBeVisible()
  })

  test("manages users, roles and passwords", async ({ page, errors }) => {
    await login(page)
    await page.goto("admin/?tab=users")
    await expect(page.getByRole("tab", { name: "Users" })).toHaveAttribute("aria-selected", "true")
    await page.getByRole("button", { name: "New user" }).click()
    const dialog = page.locator(".app-modal").or(page.getByRole("dialog")).first()
    await dialog.getByLabel("Username").fill("cashier.web")
    await dialog.getByLabel("Display name").fill("Web Cashier")
    await dialog.getByLabel("Password").fill("cashpass1")
    await dialog.getByRole("button", { name: "Save" }).click()
    const row = page.getByRole("row", { name: /cashier\.web/ })
    await expect(row).toContainText("Cashier")
    await expect(row).toContainText("Active")

    await row.getByRole("button", { name: "Reset password" }).click()
    await dialog.getByLabel("New password").fill("cashpass2")
    await dialog.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Password reset")).toBeVisible()

    // Sign in as the cashier: no admin access, no default-password banner.
    await page.getByRole("button", { name: "Sign Out" }).first().click()
    await login(page, "cashier.web", "cashpass2")
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Admin" })).toHaveCount(0)
    await expect(page.getByText("You are using the default password")).toHaveCount(0)
    await page.goto("admin/")
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
    expectNoAppErrors(errors)
  })

  test("changes the default admin password", async ({ page, errors }) => {
    await login(page)
    await page.getByRole("link", { name: "Change password" }).click()
    await page.getByLabel("Current password").fill("1234")
    await page.getByLabel("New password", { exact: true }).fill("better-pass")
    await page.getByLabel("Repeat new password").fill("better-pass")
    await page.getByRole("button", { name: "Change password" }).click()
    await expect(page.getByText("Password changed")).toBeVisible()
    await expect(page.getByText("You are using the default password")).toHaveCount(0)
    await page.getByRole("button", { name: "Sign Out" }).first().click()
    await page.locator("#username").fill("admin")
    await page.locator("#password").fill("1234")
    await page.getByRole("button", { name: "Login" }).click()
    await expect(page.getByText("Invalid password")).toBeVisible()
    await login(page, "admin", "better-pass")
    expectNoAppErrors(errors)
  })

  test("loads sample data and erases the local database", async ({ page, errors }) => {
    await login(page)
    await page.goto("admin/")
    await page.getByLabel("Include opening stock").check()
    await page.getByRole("button", { name: "Load sample master data" }).click()
    await page.getByRole("button", { name: "Load sample data" }).click()
    await expect(page.getByText("Sample data loaded")).toBeVisible()
    await page.goto("master-data/customers/")
    await expect(page.getByText("Kandy City Cabs")).toBeVisible()

    await page.goto("admin/")
    await page.getByRole("button", { name: "Erase local database" }).click()
    await page.getByRole("button", { name: "Erase local data", exact: true }).click()
    await login(page)
    await page.goto("master-data/customers/")
    await expect(page.getByText("Kandy City Cabs")).toHaveCount(0)
    expectNoAppErrors(errors)
  })
})
