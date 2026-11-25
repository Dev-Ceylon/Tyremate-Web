import { beforeEach, describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"

describe("Automated Status Cascade from Sales Orders to Inquiries", () => {
  beforeEach(() => {
    resetBackendModules()
  })

  it("cascades approval and completion from SO to linked inquiry, and reverts on deletion/unlinking", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // 1. Setup Master Data: Customer & Battery Product
    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-CASCADE-01",
      Name: "Cascade Logistics Lanka",
      Phone: "+94770001122",
      Address: "100 Port Road, Colombo",
      Email: "cascade@logistics.lk",
    })
    expect(customer.CustomerID).toBeDefined()

    const battery = await backend.invoke("batteries:create", {
      Brand: "Amaron",
      Model: "Hi-Life 65Ah",
      Series: "Hi-Life",
      Voltage: "12V",
      Capacity: "65Ah",
      Technology: "MF Calcium",
      Application: "Automotive",
      ActualSellingPrice: 45000,
    })
    expect(battery.Id).toBeDefined()

    // 2. Scenario 1: Initial Inquiry Creation (Draft state)
    const inq1 = await backend.invoke("inquiries:create", {
      Category: "battery",
      CustomerID: customer.CustomerID,
      ReminderDate: "2026-12-01",
      Notes: "Test Draft Inquiry 1",
      batteries: [
        {
          BatteryID: battery.Id,
          Price: 45000,
          Discount: 0,
          Qty: 2,
        },
      ],
    })
    expect(inq1.InquiryID).toBeDefined()
    expect(inq1.IsAdminApproved).toBe(0)
    expect(inq1.IsCompleted).toBe(0)
    expect(inq1.ConvertedSOID).toBeNull()

    const fetchedInq1 = await backend.invoke("inquiries:getById", inq1.InquiryID)
    expect(fetchedInq1.IsAdminApproved).toBe(0)
    expect(fetchedInq1.IsCompleted).toBe(0)
    expect(fetchedInq1.ConvertedSOID).toBeNull()

    // 3. Scenario 2: Create Draft SO linked to Inquiry 1
    // At this stage, SO is not approved yet (IsAdminApproved = 0, IsCompleted = 0)
    const so1 = await backend.invoke("so:create", {
      Date: "2026-11-26",
      Category: "battery",
      InquiryID: inq1.InquiryID,
      IsAdminApproved: 0,
      IsCompleted: 0,
    })
    expect(so1.SoID).toBeDefined()

    // Verify Inquiry 1 is linked, but not yet approved or completed
    const inqAfterDraftSO = await backend.invoke("inquiries:getById", inq1.InquiryID)
    expect(inqAfterDraftSO.ConvertedSOID).toBe(so1.SoID)
    expect(inqAfterDraftSO.IsAdminApproved).toBe(0)
    expect(inqAfterDraftSO.IsCompleted).toBe(0)

    // 4. Scenario 3: Admin Approves the SO -> Cascade approval to Inquiry
    await backend.invoke("so:update", so1.SoID, {
      Date: "2026-11-26",
      Category: "battery",
      IsAdminApproved: 1,
      IsCompleted: 0,
    })

    const inqAfterApprovedSO = await backend.invoke("inquiries:getById", inq1.InquiryID)
    expect(inqAfterApprovedSO.IsAdminApproved).toBe(1)
    expect(inqAfterApprovedSO.IsCompleted).toBe(0)
    expect(inqAfterApprovedSO.batteries[0].IsAdminApproved).toBe(1)

    // 5. Scenario 4: Complete the SO -> Cascade completion to Inquiry
    await backend.invoke("so:complete", so1.SoID)

    const inqAfterCompleteSO = await backend.invoke("inquiries:getById", inq1.InquiryID)
    expect(inqAfterCompleteSO.IsAdminApproved).toBe(1)
    expect(inqAfterCompleteSO.IsCompleted).toBe(1)
    expect(inqAfterCompleteSO.ConvertedSOID).toBe(so1.SoID)

    // Check inquiries list includes completion state
    const allInquiries = await backend.invoke("inquiries:getAll")
    const inqListMatch = allInquiries.find((i: any) => i.InquiryID === inq1.InquiryID)
    expect(inqListMatch).toBeDefined()
    expect(inqListMatch.IsCompleted).toBe(1)
    expect(inqListMatch.IsAdminApproved).toBe(1)
    expect(inqListMatch.ConvertedSOID).toBe(so1.SoID)

    // 6. Scenario 5: Delete the SO -> Reverts IsCompleted = 0 and ConvertedSOID = null
    await backend.invoke("so:delete", so1.SoID)

    const inqAfterDeleteSO = await backend.invoke("inquiries:getById", inq1.InquiryID)
    expect(inqAfterDeleteSO.IsCompleted).toBe(0)
    expect(inqAfterDeleteSO.ConvertedSOID).toBeNull()

    // 7. Scenario 6: Create Inquiry 2, and link to an already-completed SO via inquirySo:link
    const inq2 = await backend.invoke("inquiries:create", {
      Category: "battery",
      CustomerID: customer.CustomerID,
      ReminderDate: "2026-12-05",
      Notes: "Test Linking to Completed SO",
      batteries: [
        {
          BatteryID: battery.Id,
          Price: 45000,
          Discount: 0,
          Qty: 1,
        },
      ],
    })
    expect(inq2.IsAdminApproved).toBe(0)
    expect(inq2.IsCompleted).toBe(0)

    // Create a new SO and complete it
    const so2 = await backend.invoke("so:create", {
      Date: "2026-11-26",
      Category: "battery",
      IsAdminApproved: 1,
      IsCompleted: 0,
    })
    await backend.invoke("so:complete", so2.SoID)

    // Now link Inquiry 2 to Completed SO 2
    await backend.invoke("inquirySo:link", inq2.InquiryID, so2.SoID)

    const inq2Linked = await backend.invoke("inquiries:getById", inq2.InquiryID)
    expect(inq2Linked.ConvertedSOID).toBe(so2.SoID)
    expect(inq2Linked.IsAdminApproved).toBe(1)
    expect(inq2Linked.IsCompleted).toBe(1)

    // Unlink Inquiry 2 from SO 2 -> IsCompleted reverts to 0, ConvertedSOID resets
    await backend.invoke("inquirySo:unlink", inq2.InquiryID, so2.SoID)

    const inq2Unlinked = await backend.invoke("inquiries:getById", inq2.InquiryID)
    expect(inq2Unlinked.IsCompleted).toBe(0)
    expect(inq2Unlinked.ConvertedSOID).toBeNull()
  })

  it("auto-approves inquiry lines when SO is created as approved via so:createWithAutoPO", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // 1. Setup Branch & Locations
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-SO-INQ-01",
      BranchName: "AutoPO Test Branch",
    })
    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType = locationTypes[0]

    const batteryLocation = await backend.invoke("batteryLocations:create", {
      LocationCode: "LOC-SO-INQ-01",
      LocationName: "Battery Bay",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 100,
    })

    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-CASCADE-02",
      Name: "AutoPO Freight",
      Phone: "+94770009988",
      Address: "55 Logistics Way",
      Email: "autopo@freight.lk",
    })

    const battery = await backend.invoke("batteries:create", {
      Brand: "Exide",
      Model: "Gold 45Ah",
      Voltage: "12V",
      Capacity: "45Ah",
      Technology: "Lead-Acid",
      Application: "Automotive",
      ActualSellingPrice: 38000,
    })

    const lot = await backend.invoke("batteryStorageManagers:create", {
      BatteryId: battery.Id,
      LocationID: batteryLocation.Id,
      Qty: 5,
      BatchCode: "BAT-INQ-LOT1",
      ExpiryDate: "2028-12-31",
    })

    // 2. Create Draft Inquiry
    const inq = await backend.invoke("inquiries:create", {
      Category: "battery",
      CustomerID: customer.CustomerID,
      ReminderDate: "2026-12-15",
      Notes: "Test AutoPO conversion",
      batteries: [
        {
          BatteryID: battery.Id,
          Price: 38000,
          Discount: 0,
          Qty: 2,
        },
      ],
    })
    expect(inq.IsAdminApproved).toBe(0)
    expect(inq.IsCompleted).toBe(0)

    // 3. Convert Inquiry to SO via so:createWithAutoPO with IsAdminApproved = 1
    const soCreateResult = await backend.invoke("so:createWithAutoPO", {
      Date: "2026-11-26",
      Category: "battery",
      CustomerID: customer.CustomerID,
      InquiryID: inq.InquiryID,
      IsAdminApproved: 1,
      IsCompleted: 0,
      Lines: [
        {
          BatteryID: battery.Id,
          Price: 38000,
          Discount: 0,
          Qty: 2,
          NeedToOrderQty: 0,
          TakeNowQty: 2,
          Allocations: [
            {
              BatteryStorageManagerID: lot.Id,
              BatteryStorageManagerBatchID: lot.Batches?.[0]?.Id,
              Qty: 2,
            },
          ],
        },
      ],
    })
    expect(soCreateResult.so.SoID).toBeDefined()

    // 4. Verify Inquiry was auto-approved upon SO creation
    const inqAfterAutoPO = await backend.invoke("inquiries:getById", inq.InquiryID)
    expect(inqAfterAutoPO.ConvertedSOID).toBe(soCreateResult.so.SoID)
    expect(inqAfterAutoPO.IsAdminApproved).toBe(1)
    expect(inqAfterAutoPO.batteries[0].IsAdminApproved).toBe(1)
    expect(inqAfterAutoPO.IsCompleted).toBe(0)

    // 5. Complete SO -> Inquiry becomes IsCompleted = 1
    await backend.invoke("so:complete", soCreateResult.so.SoID)

    const inqAfterComplete = await backend.invoke("inquiries:getById", inq.InquiryID)
    expect(inqAfterComplete.IsCompleted).toBe(1)
    expect(inqAfterComplete.IsAdminApproved).toBe(1)
  })
})
