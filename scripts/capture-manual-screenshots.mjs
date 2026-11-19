#!/usr/bin/env node
/**
 * Re-captures the user-manual screenshots (docs/images/*.png) from the web
 * app, so the manual always shows the current interface.
 *
 * Needs a static build (npm run build:pages) and Playwright with Chromium.
 * usage: node scripts/capture-manual-screenshots.mjs [outDir=out]
 *
 * Sample records (customers, tyres, stock, orders, inquiries, a DAG, a PO,
 * an invoice) are created in a fresh in-browser database first.
 */
import { spawn } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const require = createRequire(import.meta.url)
const { chromium } = require("playwright")

const OUT_DIR = process.argv[2] || "out"
const PORT = 4471
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/tyremate-web"
const BASE = `http://127.0.0.1:${PORT}${BASE_PATH}`
const VIEWPORT = { width: 1440, height: 900 }

const SHOTS = [
  ["01_login", "/login/", { loggedOut: true }],
  ["02_dashboard", "/"],
  ["03_inquiry_list", "/inquiries/"],
  ["04_inquiry_create", "/inquiries/new/"],
  ["05_sales_order_list", "/sales-orders/"],
  ["06_sales_order_create_registered", "/sales-orders/new/", { prepare: "soRegistered" }],
  ["07_sales_order_create_walkin", "/sales-orders/new/", { prepare: "walkin" }],
  ["08_dag_list", "/dag/"],
  ["09_dag_create_registered", "/dag/new/", { prepare: "selectCustomer" }],
  ["10_dag_create_walkin", "/dag/new/", { prepare: "walkin" }],
  ["12_purchase_order_list", "/purchase-orders/"],
  ["13_purchase_order_create", "/purchase-orders/new/", { prepare: "selectTyre" }],
  ["14_goods_receipt_pending", "/goods-receipts/"],
  ["15_gatepass_dag", "/gatepass/dag/"],
  ["16_gatepass_so", "/gatepass/so/"],
  ["17_storage_manager", "/storage-manager/tyres/"],
  ["18_stock_snapshot", "/stock-snapshot/"],
  ["19_master_data_hub", "/master-data/"],
  ["20_customers_list", "/master-data/customers/"],
  ["21_tyres_list", "/master-data/tyres/"],
  ["22_sales_reports", "/reports/sales/"],
  ["23_cashflow_reports", "/reports/cash-flow/"],
  ["24_invoices_list", "/invoices/"],
]

async function seed(page) {
  return page.evaluate(async () => {
    const api = window.api
    const log = []
    const attempt = async (label, fn) => {
      try {
        return await fn()
      } catch (error) {
        log.push(`${label}: ${error?.message ?? error}`)
        return null
      }
    }
    const today = new Date()
    const day = (offset) => new Date(today.getTime() + offset * 86400000).toISOString().slice(0, 10)

    await api.admin.seedSampleData({ includeStock: true })
    const customers = await api.customers.getCustomers()
    const lots = (await api.storageManagers.getStorageManagers()).filter((l) => l.Qty >= 4)
    const suppliers = await api.suppliers.getSuppliers()

    // Sales orders (with invoices for the first ones) spread over recent days.
    for (let i = 0; i < Math.min(4, lots.length, customers.length); i++) {
      const lot = lots[i]
      const qty = 2
      const price = 30000 + i * 4500
      const so = await attempt(`SO ${i}`, () =>
        api.so.createSOWithAutoPO({
          Date: day(-i * 3),
          CustomerID: customers[i].CustomerID,
          Lines: [{ TyreID: lot.TyreId, Price: price, Discount: i % 2 ? 5 : 0, NeedToOrderQty: 0, TakeNowQty: qty,
                    Allocations: [{ StorageManagerID: lot.Id, Qty: qty, TakeNowQty: qty }] }],
          Payment: { CashPayment: { PaymentTypeCode: "csh", AmountReceived: price * qty, BalanceToReturn: 0 }, ChequePayment: null, BankTransferPayment: null },
        }),
      )
      if (so && i < 3) {
        const delivery = (await api.so.getDeliveries(so.so.SoID))[0]
        if (delivery) await attempt(`invoice ${i}`, () => api.invoices.generateFromDelivery(delivery.ID))
      }
    }

    // Inquiries.
    for (let i = 0; i < 3 && i < lots.length; i++) {
      await attempt(`inquiry ${i}`, () =>
        api.inquiries.createInquiry({
          ReminderDate: day(i + 1),
          CustomerID: customers[(i + 1) % customers.length].CustomerID,
          Notes: ["Fleet replacement quote", "Needs price before Friday", "Retread feasibility check"][i],
          IsAdminApproved: 0,
          ConvertedSOID: null,
          tyres: [{ TyreID: lots[i].TyreId, Price: 31000 + i * 2000, Discount: 0, Qty: 4 + i, IsAdminApproved: 0 }],
        }),
      )
    }

    // Purchase order.
    if (lots.length && suppliers.length) {
      await attempt("purchase order", () =>
        api.po.createStandalonePO({
          Date: day(-1),
          Lines: [{ TyreID: lots[0].TyreId, Price: 26000, Discount: 0, Qty: 10,
                    Suppliers: [{ SupplierID: suppliers[0].SupplierID, Qty: 10, Price: 26000, Discount: 0, ExpectedDeliveryDate: day(5) }] }],
        }),
      )
    }

    // DAG intake.
    if (lots.length > 1) {
      await attempt("DAG", () =>
        api.dag.createDAGWithTyres({
          CustomerID: customers[0].CustomerID,
          Date: day(0),
          Comment: "Casing inspection requested",
          Tyres: [{ DAGID: 0, TyreID: lots[1].TyreId, StorageLocationID: lots[1].LocationID, Qty: 2,
                    Serials: [{ SerialNumber: "DG-24081", DAGCost: 0 }, { SerialNumber: "DG-24082", DAGCost: 0 }] }],
        }),
      )
    }
    sessionStorage.setItem("tyremate.defaultPasswordBannerDismissed", "1")
    return log
  })
}

async function prepare(page, kind) {
  if (kind === "walkin") {
    await page.getByRole("button", { name: "Walk-in Customer" }).click()
  }
  if (kind === "selectCustomer" || kind === "soRegistered") {
    const select = page.locator("form select").first()
    const value = await select.evaluate((el) => el.options[1]?.value)
    if (value) await select.selectOption(value)
  }
  if (kind === "soRegistered" || kind === "selectTyre") {
    const tyre = page.locator("table select").first()
    const value = await tyre.evaluate((el) => Array.from(el.options).find((o) => o.value)?.value).catch(() => null)
    if (value) await tyre.selectOption(value)
  }
  await page.waitForTimeout(400)
}

async function main() {
  const server = spawn(process.execPath, [join(root, "tests/helpers/pagesServer.mjs"), OUT_DIR, String(PORT), BASE_PATH], { stdio: "ignore" })
  await new Promise((r) => setTimeout(r, 600))
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 })
    // Brand assets and manual images come from the bundle, not the CDN.
    await page.route("https://res.cloudinary.com/**", (route) => route.fulfill({ status: 404, body: "" }))
    await page.goto(`${BASE}/login/`)
    await page.locator("h1").waitFor()
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(root, "docs/images/01_login.png") })
    await page.fill("#username", "admin")
    await page.fill("#password", "1234")
    await page.click(".login-submit")
    await page.locator('h1:text-is("Dashboard")').waitFor()
    const problems = await seed(page)
    for (const p of problems) console.warn(`seed: ${p}`)

    for (const [name, route, options = {}] of SHOTS) {
      if (options.loggedOut) continue
      await page.goto(`${BASE}${route}`)
      await page.locator("h1, h2").first().waitFor({ timeout: 15000 })
      await page.waitForLoadState("networkidle")
      if (options.prepare) await prepare(page, options.prepare)
      await page.mouse.move(0, VIEWPORT.height - 1)
      await page.waitForTimeout(700)
      await page.screenshot({ path: join(root, "docs/images", `${name}.png`) })
      console.log(`captured ${name}`)
    }
  } finally {
    await browser.close()
    server.kill()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
