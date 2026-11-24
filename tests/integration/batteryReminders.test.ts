import { describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver } from "../helpers/backend"
import { REMINDER_TYPE_CODES } from "../../src/shared/constants/reminderTypeConstants"

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10)

const addDays = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const addMonths = (date: Date, months: number) => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

describe("Battery Shelf-Life, Recharge & Warranty Reminders", () => {
  it("tracks battery shelf-life expiry, recharge cycles, and warranty end-to-end", async () => {
    const backend = await bootBackend(await createSqlJsDriver())
    await backend.login()

    // 1. Create a branch and a storage location
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BAT-BR-REM01",
      BranchName: "Reminder Test Branch",
    })
    expect(branch.Id).toBeDefined()

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultLocationType =
      locationTypes.find((lt: any) => lt.LocationTypeCode?.toLowerCase() === "df") ||
      locationTypes[0]

    const storageLocation = await backend.invoke("storageLocations:create", {
      LocationCode: "WH-BAT-REM",
      LocationName: "Battery Reminder Warehouse",
      BranchId: branch.Id,
      LocationTypeId: defaultLocationType.Id,
      Capacity: 200,
    })
    expect(storageLocation.Id).toBeDefined()

    // 2. Create a battery master record with 12 months warranty
    const battery = await backend.invoke("batteries:create", {
      Brand: "Amaron",
      Model: "Pro 12V 45Ah",
      Series: "Pro",
      Voltage: "12V",
      Capacity: "45Ah",
      Technology: "Maintenance Free Lead-Acid",
      Application: "Automotive",
      WarrantyMonths: 12,
      PurchasedPrice: 15000,
      ActualSellingPrice: 19500,
    })
    expect(battery.Id).toBeDefined()

    const today = new Date()

    // 3. Create lots with batches representing:
    // a. Shelf-life expiring soon (within 30 days)
    const expiryBatchDate = toIsoDate(addDays(today, 10))
    const expiringLot = await backend.invoke("batteryStorageManagers:create", {
      BatteryId: battery.Id,
      LocationID: storageLocation.Id,
      Qty: 10,
      BatchCode: "BAT-EXP-01",
      MfgDate: toIsoDate(addDays(today, -30)),
      ExpiryDate: expiryBatchDate,
    })
    expect(expiringLot.Id).toBeDefined()

    // b. Recharge due soon (periodic maintenance cycle: 90 days from manufacture, 88 days ago -> 2 days left)
    const rechargeMfgDate = toIsoDate(addDays(today, -88))
    const rechargeLot = await backend.invoke("batteryStorageManagers:create", {
      BatteryId: battery.Id,
      LocationID: storageLocation.Id,
      Qty: 8,
      BatchCode: "BAT-RCH-01",
      MfgDate: rechargeMfgDate,
      ExpiryDate: toIsoDate(addDays(today, 600)),
    })
    expect(rechargeLot.Id).toBeDefined()

    // c. Warranty expiring soon (12 months from manufacture: 350 days ago -> ~15 days left)
    const warrantyMfgDate = toIsoDate(addDays(addMonths(today, -12), 15))
    const warrantyLot = await backend.invoke("batteryStorageManagers:create", {
      BatteryId: battery.Id,
      LocationID: storageLocation.Id,
      Qty: 5,
      BatchCode: "BAT-WAR-01",
      MfgDate: warrantyMfgDate,
      ExpiryDate: toIsoDate(addDays(today, 500)),
    })
    expect(warrantyLot.Id).toBeDefined()

    // d. Healthy batch (not expiring, no recharge due, plenty of warranty left)
    const healthyLot = await backend.invoke("batteryStorageManagers:create", {
      BatteryId: battery.Id,
      LocationID: storageLocation.Id,
      Qty: 20,
      BatchCode: "BAT-HEALTHY-01",
      MfgDate: toIsoDate(today),
      ExpiryDate: toIsoDate(addDays(today, 700)),
    })
    expect(healthyLot.Id).toBeDefined()

    // 4. Trigger battery reminders sync
    const syncResult = await backend.invoke("reminders:syncBatteryReminders")
    expect(syncResult).toBeDefined()
    expect(syncResult.createdExpiry).toBe(1)
    expect(syncResult.createdRecharge).toBe(1)
    expect(syncResult.createdWarranty).toBe(1)
    expect(syncResult.totalExpiring).toBe(1)
    expect(syncResult.totalRechargeDue).toBe(1)
    expect(syncResult.totalWarrantyExpiring).toBe(1)

    // 5. Verify pending reminders query
    const pendingReminders = await backend.invoke("reminders:getPending")
    expect(pendingReminders.length).toBeGreaterThanOrEqual(3)

    const expiryReminder = pendingReminders.find(
      (r: any) => r.ReminderTypeCode === REMINDER_TYPE_CODES.BATTERY_EXPIRY
    )
    const rechargeReminder = pendingReminders.find(
      (r: any) => r.ReminderTypeCode === REMINDER_TYPE_CODES.BATTERY_RECHARGE
    )
    const warrantyReminder = pendingReminders.find(
      (r: any) => r.ReminderTypeCode === REMINDER_TYPE_CODES.BATTERY_WARRANTY
    )

    expect(expiryReminder).toBeDefined()
    expect(rechargeReminder).toBeDefined()
    expect(warrantyReminder).toBeDefined()

    // 6. Inspect enriched details for battery expiry reminder
    const expiryDetails = await backend.invoke("reminders:getDetails", expiryReminder.ID)
    expect(expiryDetails).toBeDefined()
    expect(expiryDetails.batteryDetails).toBeDefined()
    expect(expiryDetails.batteryDetails.Brand).toBe("Amaron")
    expect(expiryDetails.batteryDetails.Model).toBe("Pro 12V 45Ah")
    expect(expiryDetails.batteryDetails.Voltage).toBe("12V")
    expect(expiryDetails.batteryDetails.Capacity).toBe("45Ah")
    expect(expiryDetails.batteryDetails.BatchCode).toBe("BAT-EXP-01")
    expect(expiryDetails.batteryDetails.LocationCode).toBe("WH-BAT-REM")
    expect(expiryDetails.batteryDetails.LocationName).toBe("Battery Reminder Warehouse")
    expect(expiryDetails.batteryDetails.BranchCode).toBe("BAT-BR-REM01")
    expect(expiryDetails.batteryDetails.DaysLeft).toBeLessThanOrEqual(30)

    // 7. Inspect enriched details for battery recharge reminder
    const rechargeDetails = await backend.invoke("reminders:getDetails", rechargeReminder.ID)
    expect(rechargeDetails).toBeDefined()
    expect(rechargeDetails.batteryDetails).toBeDefined()
    expect(rechargeDetails.batteryDetails.BatchCode).toBe("BAT-RCH-01")
    expect(rechargeDetails.batteryDetails.Brand).toBe("Amaron")
    expect(rechargeDetails.batteryDetails.DaysLeft).toBeLessThanOrEqual(7)

    // 8. Inspect enriched details for battery warranty reminder
    const warrantyDetails = await backend.invoke("reminders:getDetails", warrantyReminder.ID)
    expect(warrantyDetails).toBeDefined()
    expect(warrantyDetails.batteryDetails).toBeDefined()
    expect(warrantyDetails.batteryDetails.BatchCode).toBe("BAT-WAR-01")
    expect(warrantyDetails.batteryDetails.Brand).toBe("Amaron")
    expect(warrantyDetails.batteryDetails.DaysLeft).toBeLessThanOrEqual(30)

    // 9. Test manually marking a reminder as completed
    const markCompletedResult = await backend.invoke(
      "reminders:markCompleted",
      warrantyReminder.ID,
      true
    )
    expect(markCompletedResult).toBeDefined()

    const pendingAfterComplete = await backend.invoke("reminders:getPending")
    const completedWarranty = pendingAfterComplete.find(
      (r: any) => r.ID === warrantyReminder.ID
    )
    expect(completedWarranty).toBeUndefined()

    // 10. Test auto-completion when batch stock is depleted to 0
    backend.db
      .prepare("UPDATE BatteryStorageManagerBatch SET Qty = 0 WHERE BatteryStorageManagerID = ?")
      .run(rechargeLot.Id)
    backend.db
      .prepare("UPDATE BatteryStorageManager SET Qty = 0 WHERE Id = ?")
      .run(rechargeLot.Id)

    const syncAfterDeplete = await backend.invoke("reminders:syncBatteryReminders")
    expect(syncAfterDeplete.completedCount).toBeGreaterThanOrEqual(1)

    const pendingAfterDeplete = await backend.invoke("reminders:getPending")
    const completedRecharge = pendingAfterDeplete.find(
      (r: any) => r.ID === rechargeReminder.ID
    )
    expect(completedRecharge).toBeUndefined()

    // 11. Test deletion of lot cleans up linked reminders without leaving orphans
    await backend.invoke("batteryStorageManagers:delete", expiringLot.Id)

    const pendingAfterDelete = await backend.invoke("reminders:getPending")
    const deletedExpiry = pendingAfterDelete.find((r: any) => r.ID === expiryReminder.ID)
    expect(deletedExpiry).toBeUndefined()
  })
})
