import type { Page } from "@playwright/test"
import { STATIC_PAGES } from "../../src/lib/routeTable"
import { api, expect, login, test } from "./fixtures"

/**
 * Device responsiveness: every screen must fit phone, tablet and laptop
 * widths without horizontal page scrolling (wide tables scroll inside their
 * own container), and the navigation must be usable on touch devices.
 */

const PHONE = { width: 360, height: 780 }
const SMALL_PHONE = { width: 320, height: 640 }
const TABLET = { width: 768, height: 1024 }
const LAPTOP = { width: 1280, height: 800 }

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const overflow = document.documentElement.scrollWidth - vw
    const offenders: string[] = []
    if (overflow > 0) {
      const scrolls = (el: Element) => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          const s = getComputedStyle(p)
          if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth) return true
        }
        return false
      }
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.right <= vw + 1 || getComputedStyle(el).visibility === "hidden") continue
        if (el.parentElement && el.parentElement.getBoundingClientRect().right > vw + 1) continue
        if (scrolls(el)) continue
        offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 2).join(".")} (${Math.round(r.width)}px)`)
      }
    }
    return { overflow, offenders: offenders.slice(0, 5) }
  })
}

async function waitForPage(page: Page) {
  await page.locator("h1, h2").first().waitFor({ timeout: 15_000 })
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(250)
}

async function seedDetailRecords(page: Page) {
  return api<{ so: number; invoice: number; customer: number; location: number }>(
    page,
    `
    await window.api.admin.seedSampleData({ includeStock: true })
    const customer = (await window.api.customers.getCustomers())[0]
    const lot = (await window.api.storageManagers.getStorageManagers()).find((l) => l.Qty >= 2)
    const res = await window.api.so.createSOWithAutoPO({
      Date: new Date().toISOString().slice(0, 10), CustomerID: customer.CustomerID,
      Lines: [{ TyreID: lot.TyreId, Price: 30000, Discount: 0, NeedToOrderQty: 0, TakeNowQty: 2,
                Allocations: [{ StorageManagerID: lot.Id, Qty: 2, TakeNowQty: 2 }] }],
      Payment: { CashPayment: { PaymentTypeCode: "csh", AmountReceived: 60000, BalanceToReturn: 0 }, ChequePayment: null, BankTransferPayment: null },
    })
    const delivery = (await window.api.so.getDeliveries(res.so.SoID))[0]
    const invoice = await window.api.invoices.generateFromDelivery(delivery.ID)
    return { so: res.so.SoID, invoice: invoice.InvoiceID, customer: customer.CustomerID, location: lot.LocationID }
  `,
  )
}

test.describe("responsive layout", () => {
  test("sign-in and database setup fit small screens", async ({ page }) => {
    for (const viewport of [SMALL_PHONE, PHONE, TABLET]) {
      await page.setViewportSize(viewport)
      for (const route of ["login/", "setup/"]) {
        await page.goto(route)
        await waitForPage(page)
        const result = await horizontalOverflow(page)
        expect(result, `${route} @${viewport.width}px`).toEqual({ overflow: 0, offenders: [] })
      }
    }
  })

  test("every application page fits phone, tablet and laptop widths", async ({ page }) => {
    test.setTimeout(600_000)
    await login(page)
    const ids = await seedDetailRecords(page)
    const routes = [
      ...[...STATIC_PAGES].filter((r) => !["/login", "/setup", "/reports", "/reports/po"].includes(r)).map((r) => (r === "/" ? "./" : `.${r}/`)),
      `sales-orders/view/?soId=${ids.so}`,
      `invoices/view/?invoiceId=${ids.invoice}`,
      `master-data/customers/edit/?customerId=${ids.customer}`,
      `storage-manager/tyres/location/?locationId=${ids.location}&branchId=1`,
    ]
    const failures: string[] = []
    for (const viewport of [PHONE, TABLET, LAPTOP]) {
      await page.setViewportSize(viewport)
      for (const route of routes) {
        await page.goto(route)
        await waitForPage(page)
        const { overflow, offenders } = await horizontalOverflow(page)
        if (overflow > 0) failures.push(`${route} @${viewport.width}px overflows by ${overflow}px: ${offenders.join(", ")}`)
      }
    }
    expect(failures).toEqual([])
  })

  test("phone navigation uses an accessible slide-in menu", async ({ page }) => {
    await page.setViewportSize(PHONE)
    await login(page)
    const nav = page.getByRole("navigation", { name: "Main navigation" })
    const toggle = page.getByRole("button", { name: "Open menu" })

    // Closed: links are not reachable (hidden from keyboard and screen readers).
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await expect(nav.getByRole("link", { name: "Invoices" })).toBeHidden()

    // Open, then use a grouped (dropdown) item inside the drawer.
    await toggle.click()
    await expect(page.locator(".top-nav-menu-toggle")).toHaveAttribute("aria-expanded", "true")
    await expect(nav.getByRole("link", { name: "Invoices" })).toBeVisible()
    await expect(page.locator("body")).toHaveClass(/tm-menu-open/)
    await nav.getByRole("button", { name: "Customer Sales" }).click()
    await nav.getByRole("menuitem", { name: "Inquiries" }).click()
    await expect(page).toHaveURL(/\/inquiries\/$/)
    // Navigating closes the drawer and restores page scrolling.
    await expect(nav.getByRole("link", { name: "Invoices" })).toBeHidden()
    await expect(page.locator("body")).not.toHaveClass(/tm-menu-open/)

    // Escape and the backdrop also close it.
    await page.getByRole("button", { name: "Open menu" }).click()
    await page.keyboard.press("Escape")
    await expect(nav.getByRole("link", { name: "Invoices" })).toBeHidden()
    await page.getByRole("button", { name: "Open menu" }).click()
    await page.locator(".top-nav-backdrop").click({ position: { x: 10, y: 400 } })
    await expect(nav.getByRole("link", { name: "Invoices" })).toBeHidden()

    // Sign out is reachable from the drawer on phones.
    await page.getByRole("button", { name: "Open menu" }).click()
    await nav.getByRole("button", { name: "Sign Out" }).click()
    await expect(page.getByRole("heading", { name: "Sign in to TyreMate" })).toBeVisible()
  })

  test("laptop navigation stays inline without a menu button", async ({ page }) => {
    await page.setViewportSize(LAPTOP)
    await login(page)
    await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden()
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Invoices" })).toBeVisible()
  })

  test("dialogs fit on a phone screen", async ({ page }) => {
    await page.setViewportSize(PHONE)
    await login(page)
    for (const name of ["Notifications", "Printers"]) {
      await page.getByRole("button", { name }).click()
      const dialog = page.locator(".app-modal")
      await expect(dialog).toBeVisible()
      // Let the bottom-sheet entrance animation finish before measuring.
      await dialog.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)))
      const box = (await dialog.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(PHONE.width + 0.5)
      expect(box.y + box.height).toBeLessThanOrEqual(PHONE.height + 0.5)
      await page.locator(".app-modal-close").click()
      await expect(dialog).toBeHidden()
    }
  })
})
