import { beforeEach, describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"

describe("Goods Receipts for Batteries", () => {
  beforeEach(() => {
    resetBackendModules()
  })

  it("handles pending goods receipts, GRN posting, batch reconciliation, and inventory arrival for batteries", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // 1. Setup Master Data
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-GRN-BAT",
      BranchName: "GRN Battery Branch",
    })

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType = locationTypes.find(
      (lt: any) => lt.LocationTypeCode?.toLowerCase() === "df",
    ) || locationTypes[0]

    const batteryLocation = await backend.invoke("batteryLocations:create", {
      LocationCode: "LOC-GRN-01",
      LocationName: "Battery Receiving Bay",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 100,
    })

    const supplier = await backend.invoke("suppliers:create", {
      SupplierCode: "SUP-GRN-01",
      Name: "Global Power Batteries Ltd",
      Address: "100 Industrial Estate",
      City: "Gampaha",
    })

    const battery = await backend.invoke("batteries:create", {
      Brand: "Lucas",
      Model: "LU-12XL7B-B",
      Voltage: "12V",
      Capacity: "7Ah",
      PurchasedPrice: 8000,
      ActualSellingPrice: 10500,
    })

    // 2. Create Battery Purchase Order with Supplier Allocation
    const rawPo = await backend.invoke("po:createStandalone", {
      Category: "battery",
      Date: "2026-11-22",
      Lines: [
        {
          BatteryID: battery.Id,
          Price: 8000,
          Discount: 5,
          Qty: 10,
          Suppliers: [
            {
              SupplierID: supplier.SupplierID,
              Qty: 10,
              IsApproved: null,
            },
          ],
        },
      ],
    })
    expect(rawPo.ID).toBeDefined()

    const createdPo = await backend.invoke("po:getById", rawPo.ID)
    const batteryLine = createdPo.Batteries[0]
    const supplierAllocation = batteryLine.Suppliers[0]

    // 3. Allocate Location to Battery Line
    await backend.invoke("po:allocateLocation", [
      {
        POID: createdPo.ID,
        PoBatteriesID: batteryLine.ID,
        LocationId: batteryLocation.Id,
      },
    ])

    // 4. Approve Supplier Allocation & Move to Arriving
    await backend.invoke("po:updateSupplierApproval", supplierAllocation.ID, true)
    await backend.invoke("po:updateStatus", createdPo.ID, "arr")

    // 5. Query Pending Goods Receipts
    const allPending = await backend.invoke("goodsReceipts:getPending", {})
    expect(allPending.length).toBeGreaterThanOrEqual(1)

    const batteryPending = allPending.find(
      (r: any) => r.POID === createdPo.ID && r.Category === "battery"
    )
    expect(batteryPending).toBeDefined()
    expect(batteryPending.Category).toBe("battery")
    expect(batteryPending.PendingQty).toBe(10)
    expect(batteryPending.AllocatedQty).toBe(10)
    expect(batteryPending.SupplierName).toBe("Global Power Batteries Ltd")
    expect(batteryPending.Brand).toBe("Lucas")
    expect(batteryPending.Model).toBe("LU-12XL7B-B")
    expect(batteryPending.AllocatedLocationName).toBe("Battery Receiving Bay")

    // Filter by Category
    const tyreOnlyPending = await backend.invoke("goodsReceipts:getPending", { Category: "tyre" })
    expect(tyreOnlyPending.some((r: any) => r.POID === createdPo.ID)).toBe(false)

    const batteryOnlyPending = await backend.invoke("goodsReceipts:getPending", { Category: "battery" })
    expect(batteryOnlyPending.some((r: any) => r.POID === createdPo.ID)).toBe(true)

    // 6. Post Goods Receipt with Alphanumeric Batches
    const grnPayload = {
      POID: createdPo.ID,
      PoBatterySupplierID: supplierAllocation.ID,
      ReceiptDate: "2026-11-22",
      DeliveryNoteNumber: "DN-BAT-2026-001",
      DispatchedQty: 10,
      DamagedQty: 0,
      DiscrepancyReason: null,
      Batches: [
        { BatchCode: "LUC-LOT-001", ReceivedQty: 6, AcceptedQty: 6 },
        { BatchCode: "LUC-LOT-002", ReceivedQty: 4, AcceptedQty: 4 },
      ],
    }

    const postedReceipt = await backend.invoke("goodsReceipts:post", grnPayload)
    expect(postedReceipt.ID).toBeDefined()
    expect(postedReceipt.GRNNumber).toMatch(/^GRN-\d{7}$/)
    expect(postedReceipt.AcceptedQty).toBe(10)
    expect(postedReceipt.ReceivedQty).toBe(10)

    // 7. Verify inventory in Battery Storage Manager
    const storageBatches = await backend.invoke(
      "batteryStorageManagers:getBatchesByBatteryId",
      battery.Id
    )
    expect(storageBatches.length).toBe(2)
    const batchCodes = storageBatches.map((b: any) => b.BatchCode)
    expect(batchCodes).toContain("LUC-LOT-001")
    expect(batchCodes).toContain("LUC-LOT-002")

    // 8. Verify Pending Goods Receipts count reduced to 0
    const pendingAfter = await backend.invoke("goodsReceipts:getPending", { POID: createdPo.ID })
    expect(pendingAfter.length).toBe(0)

    // 9. Verify PO status updated to Completed
    const completedPo = await backend.invoke("po:getById", createdPo.ID)
    expect(completedPo.StatusCode).toBe("cmp")

    // 10. Verify Goods Receipts by PO
    const poReceipts = await backend.invoke("goodsReceipts:getByPO", createdPo.ID)
    expect(poReceipts.length).toBe(1)
    expect(poReceipts[0].GRNNumber).toBe(postedReceipt.GRNNumber)
    expect(poReceipts[0].Brand).toBe("Lucas")
    expect(poReceipts[0].Model).toBe("LU-12XL7B-B")
    expect(poReceipts[0].Batches.length).toBe(2)
  })

  it("migrates legacy POGoodsReceiptLines and POGoodsReceiptBatches schemas on existing databases without error", async () => {
    // 1. Boot backend with fresh driver
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // 2. Simulate pre-existing database with strict tyre-only POGoodsReceiptLines (no PoBatteriesID column)
    backend.db.exec(`
      CREATE TABLE POGoodsReceiptLines_legacy (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        GoodsReceiptID INTEGER NOT NULL,
        PoTyresID INTEGER NOT NULL,
        PoTyresSupplierID INTEGER NOT NULL,
        LocationID INTEGER NOT NULL,
        DispatchedQty INTEGER NOT NULL DEFAULT 0,
        ReceivedQty INTEGER NOT NULL,
        AcceptedQty INTEGER NOT NULL,
        DamagedQty INTEGER NOT NULL DEFAULT 0,
        ShortageQty INTEGER NOT NULL DEFAULT 0,
        OverReceiptQty INTEGER NOT NULL DEFAULT 0,
        DiscrepancyReason TEXT
      );
      DROP TABLE POGoodsReceiptLines;
      ALTER TABLE POGoodsReceiptLines_legacy RENAME TO POGoodsReceiptLines;
    `)

    // Verify it lacks PoBatteriesID
    const colsBefore = new Set(
      backend.db.prepare("PRAGMA table_info(POGoodsReceiptLines)").all().map((c: any) => c.name)
    )
    expect(colsBefore.has("PoBatteriesID")).toBe(false)

    // 3. Export DB and reboot backend
    const exportedBytes = driver.export()
    resetBackendModules()

    const reloadedDriver = await createSqlJsDriver(exportedBytes)
    const reloadedBackend = await bootBackend(reloadedDriver)
    await reloadedBackend.login()

    // Verify live migration added PoBatteriesID & PoBatterySupplierID
    const colsAfter = new Set(
      reloadedBackend.db.prepare("PRAGMA table_info(POGoodsReceiptLines)").all().map((c: any) => c.name)
    )
    expect(colsAfter.has("PoBatteriesID")).toBe(true)
    expect(colsAfter.has("PoBatterySupplierID")).toBe(true)
  })
})
