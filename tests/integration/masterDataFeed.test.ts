import { describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"

describe("master data feed and admin sample data seeder", () => {
  it("reliably seeds master data catalogues, tyre opening stock, and battery opening stock with full idempotency", async () => {
    resetBackendModules()
    const backend = await bootBackend(await createSqlJsDriver())
    await backend.login()

    // 1. Initial invocation: Seed master data and opening stock
    const result1 = await backend.invoke("admin:seedSampleData", { includeStock: true })
    expect(result1.master).toBeDefined()
    expect(result1.stock).toBeDefined()
    expect(result1.master.stats.branches).toBeGreaterThan(0)
    expect(result1.master.stats.tyres).toBeGreaterThan(0)
    expect(result1.master.stats.batteries).toBeGreaterThan(0)
    expect(result1.master.stats.storageLocations).toBeGreaterThan(0)
    expect(result1.master.stats.batteryLocations).toBeGreaterThan(0)
    expect(result1.stock.stats.stockLots).toBeGreaterThan(0)
    expect(result1.stock.stats.stockQty).toBeGreaterThan(0)

    // Verify master records exist in the database
    const branches = await backend.invoke("branches:getAll")
    expect(branches.length).toBeGreaterThanOrEqual(4)

    const suppliers = await backend.invoke("suppliers:getAll")
    expect(suppliers.length).toBeGreaterThanOrEqual(5)

    const customers = await backend.invoke("customers:getAll")
    expect(customers.length).toBeGreaterThanOrEqual(5)

    const tyres = await backend.invoke("tyres:getAll")
    expect(tyres.length).toBeGreaterThanOrEqual(10)

    const batteries = await backend.invoke("batteries:getAll")
    expect(batteries.length).toBeGreaterThanOrEqual(14)

    const batteryLocations = await backend.invoke("batteryLocations:getAll")
    expect(batteryLocations.some((loc: any) => loc.LocationCode === "KAN-BAT")).toBe(true)

    // Verify Tyre stock lots and batches
    const tyreStorageLots = await backend.invoke("storageManagers:getAll")
    expect(tyreStorageLots.length).toBeGreaterThanOrEqual(10)
    const totalTyreQty = tyreStorageLots.reduce((acc: number, lot: any) => acc + lot.Qty, 0)
    expect(totalTyreQty).toBeGreaterThanOrEqual(100)

    // Verify Battery stock lots and batches
    const batteryStorageLots = await backend.invoke("batteryStorageManagers:getAll")
    expect(batteryStorageLots.length).toBeGreaterThanOrEqual(14)
    const totalBatteryQty = batteryStorageLots.reduce((acc: number, lot: any) => acc + lot.Qty, 0)
    expect(totalBatteryQty).toBeGreaterThanOrEqual(140)

    // Inspect batches for one battery lot
    const sampleBatteryLot = batteryStorageLots[0]
    const batteryBatches = await backend.invoke(
      "batteryStorageManagers:getBatchesByStorageManagerId",
      sampleBatteryLot.Id,
    )
    expect(batteryBatches.length).toBeGreaterThan(0)
    expect(batteryBatches[0].BatchCode).toMatch(/^BAT-/)
    expect(batteryBatches[0].Qty).toBe(10)

    // 2. Second invocation: Idempotency check with force: true
    // Should NOT duplicate stock lots or crash due to capacity limits
    const result2 = await backend.invoke("admin:seedSampleData", { includeStock: true })
    expect(result2.master).toBeDefined()
    expect(result2.stock).toBeDefined()
    expect(result2.stock.stats.stockLots).toBe(0)
    expect(result2.stock.stats.stockQty).toBe(0)

    // Verify stock counts have not doubled
    const tyreStorageLotsAfter = await backend.invoke("storageManagers:getAll")
    expect(tyreStorageLotsAfter.length).toBe(tyreStorageLots.length)

    const batteryStorageLotsAfter = await backend.invoke("batteryStorageManagers:getAll")
    expect(batteryStorageLotsAfter.length).toBe(batteryStorageLots.length)
  })
})
