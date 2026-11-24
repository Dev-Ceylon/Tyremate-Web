import { describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver } from "../helpers/backend"

describe("Battery Locations Master Data & Inventory Control", () => {
  it("creates, retrieves, updates, suggests, and manages battery locations with full validation", async () => {
    const backend = await bootBackend(await createSqlJsDriver())
    await backend.login()

    // 1. Create a branch and find location type
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BAT-LOC-BR1",
      BranchName: "Kandy Central Branch",
    })
    expect(branch.Id).toBeDefined()

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType =
      locationTypes.find(
        (lt: any) => lt.LocationTypeCode?.toLowerCase() === "df"
      ) || locationTypes[0]
    expect(defaultType.Id).toBeDefined()

    // 2. Create a battery location
    const createdLocation = await backend.invoke("batteryLocations:create", {
      LocationCode: "KAN-BAT-BAY1",
      LocationName: "Kandy Primary Battery Bay",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 250,
    })

    expect(createdLocation.Id).toBeDefined()
    expect(createdLocation.LocationCode).toBe("KAN-BAT-BAY1")
    expect(createdLocation.LocationName).toBe("Kandy Primary Battery Bay")
    expect(createdLocation.BranchId).toBe(branch.Id)
    expect(createdLocation.Capacity).toBe(250)

    // 3. Verify getAll and getByBranch
    const allLocations = await backend.invoke("batteryLocations:getAll")
    expect(allLocations.some((loc: any) => loc.Id === createdLocation.Id)).toBe(true)

    const branchLocations = await backend.invoke("batteryLocations:getByBranch", branch.Id)
    expect(branchLocations.some((loc: any) => loc.Id === createdLocation.Id)).toBe(true)

    // 4. Verify getById
    const fetchedById = await backend.invoke("batteryLocations:getById", createdLocation.Id)
    expect(fetchedById.LocationCode).toBe("KAN-BAT-BAY1")
    expect(fetchedById.Capacity).toBe(250)

    // 5. Test duplicate code validation
    await expect(
      backend.invoke("batteryLocations:create", {
        LocationCode: "KAN-BAT-BAY1",
        LocationName: "Duplicate Bay",
        BranchId: branch.Id,
        LocationTypeId: defaultType.Id,
        Capacity: 100,
      })
    ).rejects.toThrow(/already exists/)

    // 6. Test update
    const updatedLocation = await backend.invoke(
      "batteryLocations:update",
      createdLocation.Id,
      {
        LocationCode: "KAN-BAT-BAY1-MOD",
        LocationName: "Kandy Charging & Storage Bay",
        BranchId: branch.Id,
        LocationTypeId: defaultType.Id,
        Capacity: 300,
      }
    )
    expect(updatedLocation.LocationCode).toBe("KAN-BAT-BAY1-MOD")
    expect(updatedLocation.Capacity).toBe(300)

    // 7. Test suggest
    const suggestions = await backend.invoke(
      "batteryLocations:suggest",
      "LocationName",
      "Charging"
    )
    expect(suggestions).toContain("Kandy Charging & Storage Bay")

    // 8. Test deletion guard when stock is present
    const battery = await backend.invoke("batteries:create", {
      Brand: "Exide",
      Model: "Matrix 12V 35Ah",
      Voltage: "12V",
      Capacity: "35Ah",
      Application: "Automotive",
      PurchasedPrice: 12000,
      ActualSellingPrice: 15500,
    })

    // Add stock to this battery location
    const storageManager = await backend.invoke(
      "batteryStorageManagers:create",
      {
        BatteryId: battery.Id,
        LocationID: createdLocation.Id,
        Qty: 5,
      }
    )
    expect(storageManager.Id).toBeDefined()

    // Deletion should be blocked while stock exists
    await expect(
      backend.invoke("batteryLocations:delete", createdLocation.Id)
    ).rejects.toThrow(/existing stock/)

    // Remove inventory record
    await backend.invoke("batteryStorageManagers:delete", storageManager.Id)

    // Now delete succeeds
    const deleteResult = await backend.invoke(
      "batteryLocations:delete",
      createdLocation.Id
    )
    expect(deleteResult.success).toBe(true)

    // Verify it is gone
    await expect(
      backend.invoke("batteryLocations:getById", createdLocation.Id)
    ).rejects.toThrow(/not found/)
  })
})
