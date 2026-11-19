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

    // 5. Action cards in one row keep their buttons/links level.
    document.querySelectorAll(".content-grid, .module-grid").forEach((grid) => {
      const actions = Array.from(grid.children)
        .map((card) => card.querySelector<HTMLElement>(":scope > .header-actions:last-child, :scope > .text-link:last-child"))
        .filter((el): el is HTMLElement => !!el && visible(el))
        .map((el) => ({ el, card: el.parentElement!.getBoundingClientRect(), r: el.getBoundingClientRect() }))
      for (const a of actions) {
        for (const b of actions) {
          if (a === b || Math.abs(a.card.top - b.card.top) > 2) continue
          if (Math.abs(a.r.bottom - b.r.bottom) > 2) {
            problems.push(`card actions in one row are not level ("${a.el.textContent?.trim()}" / "${b.el.textContent?.trim()}")`)
            return
          }
        }
      }
    })

    // 6. A list field's "+" button sits next to its label.
    document.querySelectorAll<HTMLElement>(".contractor-tyre-field-header").forEach((header) => {
      const label = header.querySelector("span")
      const button = header.querySelector("button")
      if (!label || !button || !visible(button)) return
      const gap = button.getBoundingClientRect().left - label.getBoundingClientRect().right
      if (gap > 32) problems.push(`"+" for "${label.textContent?.trim()}" is ${Math.round(gap)}px from its label`)
    })

    // 7. Nothing spills out of the side of a card (wide content scrolls inside it).
    const scrollsInside = (el: Element, stop: Element) => {
      for (let p = el.parentElement; p && p !== stop; p = p.parentElement) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) return true
      }
      return false
    }
    document.querySelectorAll(".panel, .table-panel").forEach((card) => {
      if (!visible(card)) return
      const c = card.getBoundingClientRect()
      for (const el of Array.from(card.querySelectorAll("*"))) {
        if (!visible(el) || /(absolute|fixed)/.test(getComputedStyle(el).position)) continue
        const r = el.getBoundingClientRect()
        if ((r.right > c.right + 3 || r.left < c.left - 3) && !scrollsInside(el, card)) {
          problems.push(`"${el.textContent?.trim().slice(0, 30)}" spills out of its card`)
          return
        }
      }
    })

    // 8. Short table values (dates, codes) are not broken across lines.
    document.querySelectorAll("td").forEach((cell) => {
      const text = cell.textContent?.trim() ?? ""
      if (!/^(\d{4}-\d{2}-\d{2}|[A-Z]{2,4}-?\d{3,})$/.test(text) || !visible(cell) || cell.querySelector("input, select")) return
      // Line boxes of the cell's text (element boxes would add padding offsets).
      const tops: number[] = []
      const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const range = document.createRange()
        range.selectNodeContents(node)
        for (const r of Array.from(range.getClientRects())) if (r.width > 0) tops.push(r.top)
      }
      const lines = tops.sort((a, b) => a - b).filter((t, i, all) => i === 0 || t - all[i - 1] > 6).length
      if (lines > 1) problems.push(`table value "${text}" wraps onto ${lines} lines`)
    })
    return problems
  })
}

test.describe("desktop alignment", () => {
  test("every page is aligned on desktop screens", async ({ page }) => {
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
    // Wide desktop, and the narrowest width that still shows the sidebar.
    for (const viewport of [WIDE, { width: 1024, height: 800 }]) {
      await page.setViewportSize(viewport)
      for (const route of routes) {
        await page.goto(route)
        await waitForPage(page)
        for (const problem of await alignmentProblems(page)) failures.push(`${route} @${viewport.width}px: ${problem}`)
      }
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

  test("dialogs keep their form layout and actions consistent wherever they open", async ({ page }) => {
    await page.setViewportSize(WIDE)
    await login(page)
    for (const route of ["sales-orders/new/", "inquiries/new/"]) {
      await page.goto(route)
      await waitForPage(page)
      await page.getByRole("button", { name: /New Customer/ }).first().click()
      const dialog = page.locator(".app-modal")
      await expect(dialog).toBeVisible()
      await dialog.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)))
      const box = (await dialog.boundingBox())!
      const submit = (await dialog.getByRole("button", { name: "Create Customer" }).boundingBox())!
      const cancel = (await dialog.getByRole("button", { name: "Cancel" }).boundingBox())!
      // Actions at the right edge; fields in two columns.
      expect(box.x + box.width - (Math.max(submit.x + submit.width, cancel.x + cancel.width)), route).toBeLessThan(40)
      const code = (await dialog.getByText("Customer Code").boundingBox())!
      const name = (await dialog.getByText("Customer Name").boundingBox())!
      expect(Math.abs(code.y - name.y), route).toBeLessThanOrEqual(2)
      expect(await alignmentProblems(page)).toEqual([])
      await dialog.getByRole("button", { name: "Cancel" }).click()
    }
  })
})
