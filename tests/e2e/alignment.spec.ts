import type { Page } from "@playwright/test"
import { STATIC_PAGES } from "../../src/lib/routeTable"
import { api, expect, login, test } from "./fixtures"

/**
 * Layout alignment on wide screens: catches the mistakes found in review
 * (pages outside the page container, tables whose rows do not match their
 * header, form inputs of different heights side by side, field buttons
 * floating away from their field).
 */

const WIDE = { width: 1900, height: 1000 }

async function waitForPage(page: Page) {
  await page.locator("h1, h2").first().waitFor({ timeout: 15_000 })
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(250)
}

async function seedRecords(page: Page) {
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
    sessionStorage.setItem("tyremate.defaultPasswordBannerDismissed", "1")
    return { so: res.so.SoID, invoice: invoice.InvoiceID, customer: customer.CustomerID, location: lot.LocationID }
  `,
  )
}

/** Layout problems on the current page (empty array = aligned). */
async function alignmentProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = []
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"
    }

    // 1. Content lives inside the standard page container.
    const app = document.querySelector(".tm-app")
    if (app) {
      for (const child of Array.from(app.children)) {
        if (child.matches("header, .top-nav-backdrop, .app-modal-backdrop") || !visible(child)) continue
        if (!child.matches(".app-shell") && !child.querySelector(":scope > .app-shell, :scope > * > .app-shell")) {
          problems.push(`content outside the page container: <${child.tagName.toLowerCase()} class="${child.className}">`)
        }
      }
    }

    // 2. Table rows have as many columns as their header.
    const span = (cells: HTMLCollectionOf<HTMLTableCellElement>) =>
      Array.from(cells).reduce((n, c) => n + (c.colSpan || 1), 0)
    document.querySelectorAll("table").forEach((table) => {
      const head = table.tHead?.rows[table.tHead.rows.length - 1]
      if (!head || !visible(table)) return
      const width = span(head.cells)
      for (const body of Array.from(table.tBodies)) {
        for (const row of Array.from(body.rows)) {
          if (row.cells.length > 1 && span(row.cells) !== width) {
            const titles = Array.from(head.cells).map((c) => c.textContent?.trim()).join("|")
            problems.push(`table [${titles}] has a row with ${span(row.cells)} of ${width} columns`)
            return
          }
        }
      }
    })

    // 3. Single-line inputs side by side in a form row share one height.
    document.querySelectorAll(".login-form, .po-form, .walkin-customer-fields").forEach((form) => {
      const controls = Array.from(form.querySelectorAll<HTMLElement>(":scope > .field-label > input.text-input, :scope > .field-label > select.text-input"))
        .filter(visible)
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
      for (const a of controls) {
        for (const b of controls) {
          if (a === b || Math.abs(a.r.top - b.r.top) > 2) continue
          if (Math.abs(a.r.height - b.r.height) > 2) {
            problems.push(`inputs in one row differ in height (${Math.round(a.r.height)} vs ${Math.round(b.r.height)}px)`)
            return
          }
        }
      }
    })

    // 4. A field's companion button sits level with that field's input.
    document.querySelectorAll<HTMLElement>(".form-inline-action").forEach((actions) => {
      const field = actions.previousElementSibling?.querySelector("select, input")
      const button = actions.querySelector("button")
      if (!field || !button || !visible(button)) return
      const f = field.getBoundingClientRect()
      const b = button.getBoundingClientRect()
      const sameRow = Math.abs((f.top + f.bottom) / 2 - (b.top + b.bottom) / 2) <= 6
      if (!sameRow || b.left < f.right || b.left - f.right > 48) {
        problems.push(`"${button.textContent?.trim()}" is not beside its field`)
      }
    })
    return problems
  })
}

test.describe("desktop alignment", () => {
  test("every page is aligned on a wide screen", async ({ page }) => {
    test.setTimeout(300_000)
    await page.setViewportSize(WIDE)
    await login(page)
    const ids = await seedRecords(page)
    const routes = [
      ...[...STATIC_PAGES].filter((r) => !["/login", "/setup", "/reports", "/reports/po"].includes(r)).map((r) => (r === "/" ? "./" : `.${r}/`)),
      `sales-orders/view/?soId=${ids.so}`,
      `invoices/view/?invoiceId=${ids.invoice}`,
      `master-data/customers/edit/?customerId=${ids.customer}`,
      `storage-manager/tyres/location/?locationId=${ids.location}&branchId=1`,
    ]
    const failures: string[] = []
    for (const route of routes) {
      await page.goto(route)
      await waitForPage(page)
      for (const problem of await alignmentProblems(page)) failures.push(`${route}: ${problem}`)
    }
    expect(failures).toEqual([])
  })

  test("sales order form keeps related controls together in both customer modes", async ({ page }) => {
    await page.setViewportSize(WIDE)
    await login(page)
    await page.goto("sales-orders/new/")
    await waitForPage(page)
    expect(await alignmentProblems(page)).toEqual([])

    // Mode toggle starts at the form's left edge, like the fields below it.
    const form = (await page.locator("form.login-form").boundingBox())!
    const toggle = (await page.locator(".customer-mode-tabs").boundingBox())!
    expect(Math.abs(toggle.x - form.x)).toBeLessThanOrEqual(2)

    await page.getByRole("button", { name: "Walk-in Customer" }).click()
    // The selected tab keeps its selected colour while the pointer is over it.
    await page.getByRole("button", { name: "Walk-in Customer" }).hover()
    // (polled: the tab animates its colour for 150ms)
    await expect
      .poll(() => page.locator(".filter-tab-active").evaluate((el) => getComputedStyle(el).backgroundColor))
      .toBe("rgb(37, 99, 235)")
    expect(await alignmentProblems(page)).toEqual([])
  })

  test("the final action row of a form is right-aligned and toolbars stay left", async ({ page }) => {
    await page.setViewportSize(WIDE)
    await login(page)
    for (const route of ["sales-orders/new/", "inquiries/new/", "dag/new/", "invoices/new/"]) {
      await page.goto(route)
      await waitForPage(page)
      const panel = (await page.locator(".table-panel").last().boundingBox())!
      const submitRow = page.locator(".table-panel .login-form > .header-actions:last-child, .form-submit-row").last()
      const lastButton = (await submitRow.locator("button").last().boundingBox())!
      expect(panel.x + panel.width - (lastButton.x + lastButton.width), route).toBeLessThan(40)
    }
  })
})
