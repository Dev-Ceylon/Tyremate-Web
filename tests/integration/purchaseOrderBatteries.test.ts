import { describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver } from "../helpers/backend"

describe("Purchase Orders for Batteries & Category Separation", () => {
  it("creates, allocates, batches, and fulfills battery purchase orders end-to-end without tyre regressions", async () => {
    const backend = await bootBackend(await createSqlJsDriver())
    await backend.login()

    // 1. Create a Branch and Storage Location for Batteries
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BAT-PO-BR1",
      BranchName: "Main Warehouse Branch",
    })
    expect(branch.Id).toBeDefined()

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultLocationType = locationTypes.find(
      (lt: any) => lt.LocationTypeCode?.toLowerCase() === "df",
    ) || locationTypes[0]

    const storageLocation = await backend.invoke("storageLocations:create", {
      LocationCode: "LOC-BAT-01",
      LocationName: "Battery Bay 1",
      BranchId: branch.Id,
      LocationTypeId: defaultLocationType.Id,
      Capacity: 100,
    })
    expect(storageLocation.Id).toBeDefined()

    // 2. Create a Supplier
    const supplier = await backend.invoke("suppliers:create", {
      SupplierCode: "SUP-BAT-01",
      Name: "Apex Battery Industries",
      Address: "45 Industrial Zone",
      City: "Colombo",
    })
    expect(supplier.SupplierID).toBeDefined()

    // 3. Create a Battery in Master Data
    const battery = await backend.invoke("batteries:create", {
      Brand: "Amaron",
      Model: "Hi-Life 12V 45Ah",
      Series: "Hi-Life",
      Voltage: "12V",
      Capacity: "45Ah",
      Technology: "MF Calcium",
      Application: "Automotive",
      WarrantyMonths: 24,
      PurchasedPrice: 14000,
      ActualSellingPrice: 18500,
    })
    expect(battery.Id).toBeDefined()

    // Link Supplier to Battery
    await backend.invoke("batterySuppliers:create", {
      BatteryId: battery.Id,
      SupplierID: supplier.SupplierID,
      Price: 13500,
    })

    // 4. Create a Standalone Battery Purchase Order
    const createdPo = await backend.invoke("po:createStandalone", {
      Category: "battery",
      Date: "2026-11-21",
      IsAdminApproved: true,
      IsSupplierApproved: false,
      Lines: [
        {
          BatteryID: battery.Id,
          Price: 13500,
          Discount: 5,
          Qty: 10,
          Suppliers: [
            {
              SupplierID: supplier.SupplierID,
              Qty: 10,
              Price: 13500,
              Discount: 5,
            },
          ],
        },
      ],
    })

    expect(createdPo.ID).toBeDefined()

    // 5. Fetch by ID and verify battery schema integrity
    const fetchedPo = await backend.invoke("po:getById", createdPo.ID)
    expect(fetchedPo.Category).toBe("battery")
    expect(fetchedPo.Batteries).toBeDefined()
    expect(fetchedPo.Batteries.length).toBe(1)

    const batteryLine = fetchedPo.Batteries[0]
    expect(batteryLine.BatteryID).toBe(battery.Id)
    expect(batteryLine.Brand).toBe("Amaron")
    expect(batteryLine.Qty).toBe(10)
    expect(batteryLine.Suppliers.length).toBe(1)
    expect(batteryLine.Suppliers[0].SupplierID).toBe(supplier.SupplierID)
    expect(fetchedPo.isStoragesAllocated).toBe(false)

    // 6. Test Category Filtering
    const allPos = await backend.invoke("po:getAll")
    expect(allPos.some((p: any) => p.ID === createdPo.ID)).toBe(true)

    const batteryPos = await backend.invoke("po:getAll", "battery")
    expect(batteryPos.some((p: any) => p.ID === createdPo.ID)).toBe(true)

    const tyrePos = await backend.invoke("po:getAll", "tyre")
    expect(tyrePos.some((p: any) => p.ID === createdPo.ID)).toBe(false)

    const pendingBatteryCount = await backend.invoke("po:getPendingPOCount", "battery")
    expect(pendingBatteryCount.Count).toBeGreaterThanOrEqual(1)

    // 7. Allocate Location to Battery Line
    const allocationResult = await backend.invoke("po:allocateLocation", [
      {
        POID: createdPo.ID,
        PoBatteriesID: batteryLine.ID,
        LocationId: storageLocation.Id,
      },
    ])
    expect(allocationResult.length).toBe(1)

    const poAfterAllocation = await backend.invoke("po:getById", createdPo.ID)
    expect(poAfterAllocation.isStoragesAllocated).toBe(true)

    // 8. Manage Batches for Battery Line
    const batches = [
      { DOT: "BAT-LOT-001", Qty: 6 },
      { DOT: "BAT-LOT-002", Qty: 4 },
    ]
    const savedBatches = await backend.invoke("poTyres:saveBatches", batteryLine.ID, batches)
    expect(savedBatches.length).toBe(2)

    const retrievedBatches = await backend.invoke("poTyres:getBatches", batteryLine.ID)
    expect(retrievedBatches.length).toBe(2)
    expect(retrievedBatches[0].BatchCode).toBe("BAT-LOT-001")
    expect(retrievedBatches[0].Qty).toBe(6)
    expect(retrievedBatches[1].BatchCode).toBe("BAT-LOT-002")
    expect(retrievedBatches[1].Qty).toBe(4)

    // 9. Supplier Approval & Status Updates
    const supplierAllocationId = batteryLine.Suppliers[0].ID
    await backend.invoke("po:updateSupplierApproval", supplierAllocationId, true)

    const poAfterApproval = await backend.invoke("po:getById", createdPo.ID)
    expect(poAfterApproval.SupplierFeedback).toBe(true)

    // Move to ARRIVING then ARRIVED
    await backend.invoke("po:updateStatus", createdPo.ID, "arr")
    await backend.invoke("po:updateStatus", createdPo.ID, "arv")

    const poArrived = await backend.invoke("po:getById", createdPo.ID)
    expect(poArrived.StatusCode).toBe("arv")

    // 10. Verify Arrival in Battery Storage Manager
    const batteryStorageBatches = await backend.invoke(
      "batteryStorageManagers:getBatchesByBatteryId",
      battery.Id,
    )
    expect(batteryStorageBatches.length).toBe(2)
    const totalStored = batteryStorageBatches.reduce((acc: number, b: any) => acc + b.Qty, 0)
    expect(totalStored).toBe(10)

    const branchLocations = await backend.invoke(
      "batteryStorageManagers:getLocationsByBranch",
      branch.Id,
    )
    const allocatedBay = branchLocations.find((l: any) => l.Id === storageLocation.Id)
    expect(allocatedBay.UsedCapacity).toBe(10)
    expect(allocatedBay.RemainingCapacity).toBe(90)

    // 11. Test Tyre PO (Zero Regression)
    const tyre = await backend.invoke("tyres:create", {
      Brand: "Dunlop",
      Size: "195/65R15",
      Pattern: "SP Touring",
      PlyRating: "4PR",
    })
    expect(tyre.Id).toBeDefined()

    const tyrePo = await backend.invoke("po:createStandalone", {
      Category: "tyre",
      Date: "2026-11-21",
      Lines: [
        {
          TyreID: tyre.Id,
          Price: 15000,
          Discount: 0,
          Qty: 4,
          Suppliers: [],
        },
      ],
    })
    expect(tyrePo.ID).toBeDefined()

    const fetchedTyrePo = await backend.invoke("po:getById", tyrePo.ID)
    expect(fetchedTyrePo.Category).toBe("tyre")
    expect(fetchedTyrePo.Tyres).toBeDefined()
    expect(fetchedTyrePo.Tyres.length).toBe(1)
    expect(fetchedTyrePo.Tyres[0].TyreID).toBe(tyre.Id)

    const tyreOnlyList = await backend.invoke("po:getAll", "tyre")
    expect(tyreOnlyList.some((p: any) => p.ID === tyrePo.ID)).toBe(true)
    expect(tyreOnlyList.some((p: any) => p.ID === createdPo.ID)).toBe(false)

    // 12. Test Updating and Deleting a Draft Battery PO
    const draftBatteryPo = await backend.invoke("po:createStandalone", {
      Category: "battery",
      Date: "2026-11-21",
      Lines: [
        {
          BatteryID: battery.Id,
          Price: 12000,
          Discount: 0,
          Qty: 2,
          Suppliers: [],
        },
      ],
    })
    expect(draftBatteryPo.ID).toBeDefined()

    await backend.invoke("po:updateStandalone", draftBatteryPo.ID, {
      Category: "battery",
      Date: "2026-11-22",
      Lines: [
        {
          BatteryID: battery.Id,
          Price: 12500,
          Discount: 2,
          Qty: 5,
          Suppliers: [],
        },
      ],
    })

    const updatedDraft = await backend.invoke("po:getById", draftBatteryPo.ID)
    expect(updatedDraft.Date).toBe("2026-11-22")
    expect(updatedDraft.Batteries[0].Qty).toBe(5)
    expect(updatedDraft.Batteries[0].Price).toBe(12500)

    const deleteResult = await backend.invoke("po:delete", draftBatteryPo.ID)
    expect(deleteResult.success).toBe(true)

    await expect(backend.invoke("po:getById", draftBatteryPo.ID)).rejects.toThrow("PO not found")
  })
})
