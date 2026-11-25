import { describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"

describe("battery reports and analytics", () => {
  it("generates battery overview, time series, brand split, and transactions ledger", async () => {
    resetBackendModules()
    const backend = await bootBackend(await createSqlJsDriver())
    await backend.login()
    await backend.invoke("admin:seedSampleData", { includeStock: true })

    const customer = (await backend.invoke("customers:getAll"))[0]
    const batteries = backend.db.prepare("SELECT * FROM BatteryM LIMIT 3").all() as Array<{
      Id: number
      Brand: string
      Model: string
      ActualSellingPrice: number
    }>
    expect(batteries.length).toBeGreaterThan(0)

    const battery1 = batteries[0]

    // Create a sales order with battery lines
    const soResult = backend.db
      .prepare(
        "INSERT INTO SO (Date, CreatedDateTime, Category, IsCompleted, IsPaymentCompleted, IsAdminApproved) VALUES ('2026-11-20', '2026-11-20 12:00:00', 'battery', 1, 1, 1)"
      )
      .run()
    const soId = Number(soResult.lastInsertRowid)

    backend.db
      .prepare("INSERT INTO SoCustomer (SoID, CustomerID) VALUES (?, ?)")
      .run(soId, customer.CustomerID)

    backend.db
      .prepare(
        "INSERT INTO SoBatteries (SoID, BatteryID, Price, Discount, Qty, IsAdminApproved) VALUES (?, ?, ?, ?, ?, 1)"
      )
      .run(soId, battery1.Id, 5000, 10, 2)

    // 1. Overview Test
    const overview = await backend.invoke("reports:getBatteryOverview", {
      preset: "custom",
      fromDate: "2026-11-01",
      toDate: "2026-11-30",
    })

    expect(overview).toBeDefined()
    expect(overview.summary.sales.totalOrders).toBeGreaterThanOrEqual(1)
    expect(overview.summary.sales.totalUnitsSold).toBeGreaterThanOrEqual(2)
    // 5000 * 2 * 0.9 = 9000
    expect(overview.summary.sales.netRevenue).toBe(9000)
    expect(overview.summary.inventory.currentStockUnits).toBeGreaterThan(0)
    expect(overview.brandBreakdown.length).toBeGreaterThan(0)
    expect(overview.brandBreakdown.some((b: { brand: string }) => b.brand === battery1.Brand)).toBe(true)

    // 2. Transactions Test
    const transactions = await backend.invoke("reports:getBatteryTransactions", {
      preset: "custom",
      fromDate: "2026-11-01",
      toDate: "2026-11-30",
      type: "SALE",
    })

    expect(transactions.items.length).toBeGreaterThanOrEqual(1)
    const tx = transactions.items.find((t: { orderId: number }) => t.orderId === soId)
    expect(tx).toBeDefined()
    expect(tx.refNo).toBe(`SO-${soId}`)
    expect(tx.brand).toBe(battery1.Brand)
    expect(tx.qty).toBe(2)
    expect(tx.netAmount).toBe(9000)

    // 3. CSV Export Test
    const csvExport = await backend.invoke("reports:exportBatteryToCsv", {
      exportType: "transactions",
      preset: "custom",
      fromDate: "2026-11-01",
      toDate: "2026-11-30",
    })

    expect(csvExport.filename).toContain("Battery_Transactions_")
    expect(csvExport.csvContent).toContain("SO-")
    expect(csvExport.csvContent).toContain(battery1.Brand)

    // 4. Summary CSV Export Test
    const summaryCsv = await backend.invoke("reports:exportBatteryToCsv", {
      exportType: "summary",
      preset: "custom",
      fromDate: "2026-11-01",
      toDate: "2026-11-30",
    })

    expect(summaryCsv.filename).toContain("Battery_Overview_")
    expect(summaryCsv.csvContent).toContain("BATTERY PERFORMANCE & INVENTORY REPORT")
    expect(summaryCsv.csvContent).toContain("Total Net Revenue")
  })

  it("enforces reports.view permission check on battery reporting channels", async () => {
    resetBackendModules()
    const backend = await bootBackend(await createSqlJsDriver())
    // Login as a user without reports.view (e.g., role without reports.view or unauthorized)
    await backend.login("guest_user", "wrong_pass").catch(() => {})

    // Anonymous / unauthorized call should reject
    await expect(backend.invoke("reports:getBatteryOverview")).rejects.toThrow()
  })
})
