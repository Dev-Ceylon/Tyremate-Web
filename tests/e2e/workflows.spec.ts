import { readFileSync } from "node:fs"
import { api, expect, expectNoAppErrors, login, test } from "./fixtures"

test.describe("business workflows in the browser", () => {
  test("creates and edits a supplier through the forms (route-relative navigation)", async ({ page, errors }) => {
    await login(page)
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Master Data" }).click()
    await expect(page).toHaveURL(/\/master-data\/$/)
    await page.goto("master-data/suppliers/")
    await page.locator('a.primary-action[href$="/master-data/suppliers/new/"]').click()
    await expect(page).toHaveURL(/\/master-data\/suppliers\/new\/$/)

    await page.locator("label", { hasText: "Supplier Name" }).locator("input").first().fill("Web Tyre Imports")
    await page.locator("label", { hasText: "TIN No" }).locator("input").fill("TIN-WEB-1")
    await page.getByRole("button", { name: "Save Supplier" }).click()
    // navigate("..") from the form returns to the list.
    await expect(page).toHaveURL(/\/master-data\/suppliers\/$/)
    const row = page.getByRole("row", { name: /Web Tyre Imports/ })
    await expect(row).toBeVisible()

    // navigate(`${id}/edit`) -> /master-data/suppliers/edit/?supplierId=<id>
    await row.getByRole("button", { name: "Edit" }).click()
    await expect(page).toHaveURL(/\/master-data\/suppliers\/edit\/\?supplierId=\d+$/)
    const name = page.locator("label", { hasText: "Supplier Name" }).locator("input").first()
    await expect(name).toHaveValue("Web Tyre Imports")
    await name.fill("Web Tyre Imports Ltd")
    await page.getByRole("button", { name: "Save Supplier" }).click()
    await expect(page).toHaveURL(/\/master-data\/suppliers\/$/)
    await expect(page.getByRole("row", { name: /Web Tyre Imports Ltd/ })).toBeVisible()
    expectNoAppErrors(errors)
  })

  test("sells from stock, then opens the order and invoice via deep links", async ({ page, errors }) => {
    await login(page)
    const ids = await api<{ soId: number; invoiceId: number }>(
      page,
      `
      await window.api.admin.seedSampleData({ includeStock: true })
      const customers = await window.api.customers.getCustomers()
      const lots = await window.api.storageManagers.getStorageManagers()
      const lot = lots.find((l) => l.Qty >= 2)
      const res = await window.api.so.createSOWithAutoPO({
        Date: new Date().toISOString().slice(0, 10),
        CustomerID: customers[0].CustomerID,
        Lines: [{ TyreID: lot.TyreId, Price: 30000, Discount: 0, NeedToOrderQty: 0, TakeNowQty: 2,
                  Allocations: [{ StorageManagerID: lot.Id, Qty: 2, TakeNowQty: 2 }] }],
        Payment: { CashPayment: { PaymentTypeCode: "csh", AmountReceived: 60000, BalanceToReturn: 0 }, ChequePayment: null, BankTransferPayment: null },
      })
      const soId = res.so.SoID
      const deliveries = await window.api.so.getDeliveries(soId)
      const invoice = await window.api.invoices.generateFromDelivery(deliveries[0].ID)
      return { soId, invoiceId: invoice.InvoiceID }
    `,
    )

    await page.goto(`sales-orders/view/?soId=${ids.soId}`)
    await expect(page.getByText(`SO-${ids.soId}-GP-0001`).first()).toBeVisible()
    await page.goto("sales-orders/")
    await expect(page.getByText("Kandy City Cabs").first()).toBeVisible()

    await page.goto(`invoices/view/?invoiceId=${ids.invoiceId}`)
    await expect(page.getByText("INV-").first()).toBeVisible()

    // Today's sales on the dashboard reflects the order.
    await page.goto("./")
    await expect(
      page
        .getByText("Rs. 60,000.00")
        .or(page.getByText("Rs 60,000.00"))
        .or(page.getByText("Rs 60000.00"))
        .or(page.getByText("$60,000.00"))
        .first(),
    ).toBeVisible()
    expectNoAppErrors(errors)
  })

  test("logs a customer inquiry through the form and updates it", async ({ page, errors }) => {
    await login(page)
    await api(page, "await window.api.admin.seedSampleData({ includeStock: true })")
    await page.goto("inquiries/new/")
    const customer = page.locator("form select").first()
    await customer.selectOption({ index: 1 })
    const customerName = (await customer.locator("option:checked").textContent())!.split(" - ").pop()!.trim()
    await page.locator("table select").first().selectOption({ index: 1 })
    await page.getByLabel("Notes").fill("Fleet replacement quote")
    await page.getByRole("button", { name: "Create Inquiry" }).click()
    await expect(page).toHaveURL(/\/inquiries\/$/)
    const row = page.getByRole("row", { name: new RegExp(customerName) })
    await expect(row).toContainText("Fleet replacement quote")

    // Updating and approving go through the same service code path.
    const updated = await api<{ Notes: string; IsAdminApproved: number }>(
      page,
      `const [inq] = await window.api.inquiries.getInquiries()
       const id = inq.ID ?? inq.InquiryID
       await window.api.inquiries.updateInquiry(id, { Notes: "Quote sent" })
       return await window.api.inquiries.updateInquiryStatus(id, true)`,
    )
    expect(updated.Notes).toBe("Quote sent")
    expect(updated.IsAdminApproved).toBe(1)
    expectNoAppErrors(errors)
  })

  test("unknown URLs fall back to the dashboard", async ({ page }) => {
    await login(page)
    await page.goto("this/does/not/exist/")
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
  })

  test("exports the sales report as a CSV download", async ({ page, errors }) => {
    await login(page)
    await page.goto("reports/sales/")
    const downloadPromise = page.waitForEvent("download")
    await page.getByRole("button", { name: /Export CSV/ }).click()
    const menuItem = page.getByRole("menuitem").or(page.locator(".report-dropdown-item")).first()
    if (await menuItem.isVisible().catch(() => false)) await menuItem.click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.csv$/)
    const content = readFileSync((await download.path())!, "utf-8")
    expect(content.charCodeAt(0)).toBe(0xfeff) // UTF-8 BOM for Excel, as on desktop
    expect(content).toContain("Transaction ID")
    expectNoAppErrors(errors)
  })

  test("prints documents through the browser print dialog", async ({ page, errors }) => {
    await login(page)
    await page.evaluate(() => {
      ;(window as unknown as { __printed: string[] }).__printed = []
      new MutationObserver((records) => {
        for (const r of records)
          r.addedNodes.forEach((n) => {
            if (n instanceof HTMLIFrameElement) {
              const frame = n
              setTimeout(() => {
                frame.contentWindow!.print = () => {
                  ;(window as unknown as { __printed: string[] }).__printed.push(frame.contentDocument!.body.innerText)
                }
              }, 0)
            }
          })
      }).observe(document.body, { childList: true })
    })
    const printers = await api<{ name: string }[]>(page, `return window.api.printer.getAll()`)
    expect(printers[0].name).toBe("browser-default")
    const result = await api<{ success: boolean }>(page, `return window.api.printer.testPrint("browser-default")`)
    expect(result.success).toBe(true)
    await expect.poll(() => page.evaluate(() => (window as unknown as { __printed: string[] }).__printed.join("\n"))).toContain(
      "browser-default",
    )
    expectNoAppErrors(errors)
  })

  test("uploads an encrypted payment receipt to Cloudinary and reads it back", async ({ page, errors }) => {
    const uploads: { preset: string | null; folder: string | null; bytes: Buffer }[] = []
    const stored = new Map<string, Buffer>()
    await page.route("https://api.cloudinary.com/v1_1/dkj22lm1g/raw/upload", async (route) => {
      const body = route.request().postDataBuffer()!
      const text = body.toString("latin1")
      const field = (name: string) => new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`).exec(text)?.[1] ?? null
      const fileMatch = /filename="([^"]+)"\r\nContent-Type: [^\r]+\r\n\r\n/.exec(text)!
      const start = fileMatch.index + fileMatch[0].length
      const end = text.indexOf("\r\n--", start)
      const bytes = body.subarray(start, end)
      const url = `https://res.cloudinary.com/dkj22lm1g/raw/upload/v1/tyremate/receipts/${fileMatch[1]}`
      uploads.push({ preset: field("upload_preset"), folder: field("folder"), bytes })
      stored.set(url, bytes)
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ secure_url: url }) })
    })
    await page.route("https://res.cloudinary.com/dkj22lm1g/raw/upload/**", async (route) => {
      const bytes = stored.get(route.request().url())
      await route.fulfill(bytes ? { status: 200, body: bytes } : { status: 404, body: "" })
    })

    await login(page)
    await page.goto("admin/?tab=storage")
    await page.getByLabel("Unsigned upload preset").fill("tyremate_receipts")
    await page.getByRole("button", { name: "Save settings" }).click()
    await expect(page.getByText("Cloudinary (dkj22lm1g)").first()).toBeVisible()

    const result = await api<{ meta: Record<string, string>; preview: string; read: string }>(
      page,
      `
      const bytes = new Uint8Array([137,80,78,71,13,10,26,10, ...new TextEncoder().encode("BROWSER-RECEIPT")])
      const file = new File([bytes], "bank-slip.png", { type: "image/png" })
      const saved = await window.api.paymentReceipt.saveFromPath(window.api.getPathForFile(file))
      const { previewDataUrl, ...meta } = saved
      const { dataUrl } = await window.api.paymentReceipt.read(meta)
      return { meta, preview: previewDataUrl, read: dataUrl }
    `,
    )
    expect(result.meta.ReceiptPath).toMatch(/^https:\/\/res\.cloudinary\.com\/dkj22lm1g\/raw\/upload\/.+\.png\.enc$/)
    expect(result.read).toBe(result.preview)
    expect(Buffer.from(result.preview.split(",")[1], "base64").toString("latin1")).toContain("BROWSER-RECEIPT")
    expect(uploads).toHaveLength(1)
    expect(uploads[0].preset).toBe("tyremate_receipts")
    expect(uploads[0].folder).toBe("tyremate/receipts")
    expect(uploads[0].bytes.toString("latin1")).not.toContain("BROWSER-RECEIPT")
    expectNoAppErrors(errors)
  })

  test("help page shows the manual with screenshots from Cloudinary", async ({ page, errors }) => {
    await login(page)
    await page.getByRole("link", { name: "Help" }).click()
    await expect(page.getByRole("heading", { name: "User manual", exact: true })).toBeVisible()
    const img = page.getByRole("img", { name: "TyreMate Login Screen" })
    await img.scrollIntoViewIfNeeded()
    await expect(img).toHaveAttribute("src", /res\.cloudinary\.com\/dkj22lm1g\/image\/upload\/f_auto,q_auto,w_1600,c_limit\/tyremate\/static\/manual\/v2\/01_login/)
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(100)

    // Diagrams from the manual are drawn, not left as source.
    await expect(page.locator('.tm-manual-diagram[data-rendered="true"] svg')).toHaveCount(3, { timeout: 20_000 })

    // Contents navigation jumps to a chapter and records it in the URL.
    const contents = page.getByRole("navigation", { name: "Manual contents" })
    await contents.getByRole("link", { name: /Sales Orders & Customer Dispatch/ }).click()
    await expect(page).toHaveURL(/#chapter-4$/)
    await expect(page.getByRole("heading", { name: "Sales Orders & Customer Dispatch" })).toBeInViewport()

    // Search narrows the manual to matching sections and highlights matches.
    await page.getByPlaceholder("Search the manual…").fill("gate pass")
    await expect(page.locator("#tm-help-search-status")).toContainText(/\d+ match/)
    await expect(page.locator("mark.tm-manual-hit").first()).toBeVisible()
    await expect(page.getByRole("heading", { name: "Customer Inquiry Management" })).toBeHidden()
    await page.getByPlaceholder("Search the manual…").fill("no-such-words")
    await expect(page.getByRole("heading", { name: /No results/ })).toBeVisible()
    await page.getByRole("button", { name: "Clear search" }).first().click()
    await expect(page.getByRole("heading", { name: "Customer Inquiry Management" })).toBeVisible()

    // Screenshots open enlarged and close with Escape.
    await img.click()
    await expect(page.locator("dialog.tm-help-zoom")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.locator("dialog.tm-help-zoom")).toBeHidden()
    expectNoAppErrors(errors)
  })
})
