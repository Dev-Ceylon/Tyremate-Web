import { describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"

/**
 * Sales created within the same second share a timestamp. The transactions
 * report (and its CSV export) must still list them in a stable order, or the
 * output depends on timing (this made the differential test flaky in CI).
 */
describe("sales report ordering", () => {
  it("breaks timestamp ties by id so same-second orders have a fixed order", async () => {
    resetBackendModules()
    const backend = await bootBackend(await createSqlJsDriver())
    await backend.login()
    await backend.invoke("admin:seedSampleData", { includeStock: true })
    const customer = (await backend.invoke("customers:getAll"))[0]
    const lot = (await backend.invoke("storageManagers:getAll")).find((l: { Qty: number }) => l.Qty >= 2)
    for (const price of [10000, 20000, 30000]) {
      await backend.invoke("so:createWithAutoPO", {
        Date: "2026-11-19",
        CustomerID: customer.CustomerID,
        Lines: [{ TyreID: lot.TyreId, Price: price, Discount: 0, NeedToOrderQty: 0, TakeNowQty: 0,
                  Allocations: [{ StorageManagerID: lot.Id, Qty: 1, TakeNowQty: 0 }] }],
      })
    }
    // Force the tie: every order created in the same second.
    backend.db.prepare("UPDATE SO SET CreatedDateTime = '2026-11-19 10:00:00', Date = '2026-11-19'").run()

    const params = { preset: "custom", fromDate: "2026-01-01", toDate: "2026-12-31" }
    const page = await backend.invoke("reports:getTransactions", params)
    expect(page.transactions.map((t: { id: string }) => t.id)).toEqual(["SO-3", "SO-2", "SO-1"])

    const csv = await backend.invoke("reports:exportToCsv", params)
    const ids = csv.csvContent.split("\r\n").slice(1).filter(Boolean).map((line: string) => line.split(",")[0])
    expect(ids).toEqual(["SO-3", "SO-2", "SO-1"])
  })
})
