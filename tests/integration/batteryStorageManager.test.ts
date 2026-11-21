import { describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver } from "../helpers/backend"

describe("Battery Storage Manager & Batch Tracking", () => {
  it("manages battery inventory, warehouse batches, and capacity checks end-to-end", async () => {
    const backend = await bootBackend(await createSqlJsDriver())
    await backend.login()

    // 1. Create a branch and a storage location
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BAT-BR01",
      BranchName: "Colombo Main Branch",
    })
    expect(branch.Id).toBeDefined()

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultLocationType = locationTypes.find(
      (lt: any) => lt.LocationTypeCode?.toLowerCase() === "df",
    ) || locationTypes[0]

    const storageLocation = await backend.invoke("storageLocations:create", {
      LocationCode: "WH-BAT-A1",
      LocationName: "Battery Warehouse Rack A1",
      BranchId: branch.Id,
      LocationTypeId: defaultLocationType.Id,
      Capacity: 100,
    })
    expect(storageLocation.Id).toBeDefined()

    // Verify locations query for branch
    const locations = await backend.invoke(
      "batteryStorageManagers:getLocationsByBranch",
      branch.Id,
    )
    expect(locations.length).toBe(1)
    const testLocation = locations[0]
    expect(testLocation.Capacity).toBe(100)
    expect(testLocation.UsedCapacity).toBe(0)
    expect(testLocation.RemainingCapacity).toBe(100)

    // 2. Create a test battery in master data
    const battery = await backend.invoke("batteries:create", {
      Brand: "Exide",
      Model: "Matrix Red 12V 5Ah",
      Series: "Matrix",
      Voltage: "12V",
      Capacity: "5Ah",
      Technology: "Lead-Acid Maintenance Free",
      Application: "Motorcycle",
      WarrantyMonths: 24,
      PurchasedPrice: 4200,
      ActualSellingPrice: 5800,
    })
    expect(battery.Id).toBeDefined()

    // 3. Store batteries with batch details in the location
    const storedQty = 15
    const batchCode = "EX-2026-B01"
    const mfgDate = "2026-01-15"
    const expiryDate = "2028-01-15"

    const createdLot = await backend.invoke("batteryStorageManagers:create", {
      BatteryId: battery.Id,
      LocationID: testLocation.Id,
      Qty: storedQty,
      BatchCode: batchCode,
      MfgDate: mfgDate,
      ExpiryDate: expiryDate,
    })
    expect(createdLot.Id).toBeDefined()
    expect(createdLot.Qty).toBe(storedQty)
    expect(createdLot.BatteryId).toBe(battery.Id)
    expect(createdLot.LocationID).toBe(testLocation.Id)

    // 4. Verify stored lot retrieval by location
    const locationLots = await backend.invoke(
      "batteryStorageManagers:getByLocation",
      testLocation.Id,
    )
    const matchingLot = locationLots.find((l: any) => l.Id === createdLot.Id)
    expect(matchingLot).toBeDefined()
    expect(matchingLot.Brand).toBe("Exide")
    expect(matchingLot.Model).toBe("Matrix Red 12V 5Ah")
    expect(matchingLot.Capacity).toBe("5Ah")
    expect(matchingLot.Voltage).toBe("12V")
    expect(matchingLot.SourceCode).toBe("manual")

    // 5. Verify batch lots retrieval and expiry calculations
    const batches = await backend.invoke(
      "batteryStorageManagers:getBatchesByLocation",
      testLocation.Id,
    )
    const matchingBatch = batches.find(
      (b: any) => b.BatteryStorageManagerID === createdLot.Id,
    )
    expect(matchingBatch).toBeDefined()
    expect(matchingBatch.BatchCode).toBe(batchCode)
    expect(matchingBatch.Qty).toBe(storedQty)
    expect(matchingBatch.MfgDate).toBe(mfgDate)
    expect(matchingBatch.ExpiryDate).toBe(expiryDate)
    expect(matchingBatch.DaysLeft).toBeGreaterThan(0)

    // 6. Verify location capacity reflects the added batteries
    const updatedLocation = await backend.invoke(
      "batteryStorageManagers:getLocationById",
      testLocation.Id,
    )
    expect(updatedLocation.UsedCapacity).toBe(storedQty)
    expect(updatedLocation.RemainingCapacity).toBe(100 - storedQty)

    // 7. Verify capacity overflow protection
    const excessiveQty = updatedLocation.RemainingCapacity + 10
    await expect(
      backend.invoke("batteryStorageManagers:create", {
        BatteryId: battery.Id,
        LocationID: testLocation.Id,
        Qty: excessiveQty,
      }),
    ).rejects.toThrow(/exceeds storage location capacity/i)

    // 8. Test updating stored quantity
    const nextQty = 20
    const updatedLot = await backend.invoke("batteryStorageManagers:update", createdLot.Id, {
      BatteryId: battery.Id,
      LocationID: testLocation.Id,
      Qty: nextQty,
    })
    expect(updatedLot.Qty).toBe(nextQty)

    const locationAfterUpdate = await backend.invoke(
      "batteryStorageManagers:getLocationById",
      testLocation.Id,
    )
    expect(locationAfterUpdate.UsedCapacity).toBe(nextQty)

    // 9. Test adding an additional batch to the lot
    const secondBatch = await backend.invoke("batteryStorageManagers:createBatch", createdLot.Id, {
      BatchCode: "EX-2026-B02",
      MfgDate: "2026-03-01",
      ExpiryDate: "2028-03-01",
      Qty: 5,
    })
    expect(secondBatch.Id).toBeDefined()
    expect(secondBatch.BatchCode).toBe("EX-2026-B02")
    expect(secondBatch.Qty).toBe(5)

    const lotBatches = await backend.invoke(
      "batteryStorageManagers:getBatchesByStorageManagerId",
      createdLot.Id,
    )
    expect(lotBatches.length).toBe(2)

    // 10. Test updating and deleting the batch
    const updatedBatch = await backend.invoke(
      "batteryStorageManagers:updateBatch",
      secondBatch.Id,
      {
        BatchCode: "EX-2026-B02-REV",
        MfgDate: "2026-03-01",
        ExpiryDate: "2028-03-01",
        Qty: 4,
      },
    )
    expect(updatedBatch.BatchCode).toBe("EX-2026-B02-REV")
    expect(updatedBatch.Qty).toBe(4)

    const deleteBatchResult = await backend.invoke(
      "batteryStorageManagers:deleteBatch",
      secondBatch.Id,
    )
    expect(deleteBatchResult.success).toBe(true)

    // 11. Test deleting the storage lot and verifying cascade batch deletion and capacity release
    const deleteResult = await backend.invoke(
      "batteryStorageManagers:delete",
      createdLot.Id,
    )
    expect(deleteResult.success).toBe(true)

    const finalLocation = await backend.invoke(
      "batteryStorageManagers:getLocationById",
      testLocation.Id,
    )
    expect(finalLocation.UsedCapacity).toBe(0)
    expect(finalLocation.RemainingCapacity).toBe(100)

    const batchesAfterDelete = await backend.invoke(
      "batteryStorageManagers:getBatchesByLocation",
      testLocation.Id,
    )
    const lingeringBatch = batchesAfterDelete.find(
      (b: any) => b.BatteryStorageManagerID === createdLot.Id,
    )
    expect(lingeringBatch).toBeUndefined()
  })
})
