import { beforeEach, describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"

describe("Inquiries for Batteries & Cross-Module Linking", () => {
  beforeEach(() => {
    resetBackendModules()
  })

  it("creates battery inquiry, calculates stock availability & need-to-order qty, and manages approval status", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // 1. Setup Branch & Locations
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-INQ-BAT1",
      BranchName: "Colombo Battery Center",
    })
    expect(branch.Id).toBeDefined()

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType = locationTypes.find(
      (lt: any) => lt.LocationTypeCode?.toLowerCase() === "df",
    ) || locationTypes[0]

    const batteryLocation = await backend.invoke("batteryLocations:create", {
      LocationCode: "LOC-INQ-BAT1",
      LocationName: "Inquiry Battery Bay",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 50,
    })
    expect(batteryLocation.Id).toBeDefined()

    // 2. Setup Customer & Battery Products
    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-INQ-01",
      Name: "Ceylon Freight Ltd",
      Phone: "+94712223344",
      Address: "88 Port Access Rd, Colombo",
      Email: "freight@ceylon.lk",
    })
    expect(customer.CustomerID).toBeDefined()

    const batteryA = await backend.invoke("batteries:create", {
      Brand: "Exide",
      Model: "Matrix Red 65Ah",
      Voltage: "12V",
      Capacity: "65Ah",
      Technology: "MF Calcium",
      Application: "Automotive",
      ActualSellingPrice: 42000,
    })
    expect(batteryA.Id).toBeDefined()

    const batteryB = await backend.invoke("batteries:create", {
      Brand: "Amaron",
      Model: "PRO 90Ah",
      Voltage: "12V",
      Capacity: "90Ah",
      Technology: "Silver Alloy",
      Application: "Heavy Commercial",
      ActualSellingPrice: 65000,
    })
    expect(batteryB.Id).toBeDefined()

    // 3. Put 4 units of Battery A in stock, 0 units of Battery B in stock
    await backend.invoke("batteryStorageManagers:create", {
      BatteryId: batteryA.Id,
      LocationID: batteryLocation.Id,
      Qty: 4,
      BatchCode: "EX-INQ-BATCH-01",
      MfgDate: "2026-01-10",
      ExpiryDate: "2028-01-10",
    })

    // 4. Create Battery Inquiry: 6 units of Battery A (need 2 more), 3 units of Battery B (need 3 more)
    const inqPayload = {
      Category: "battery",
      CustomerID: customer.CustomerID,
      ReminderDate: "2026-12-01",
      Notes: "Customer requesting quote for fleet replacement",
      batteries: [
        {
          BatteryID: batteryA.Id,
          Price: 42000,
          Discount: 5,
          Qty: 6,
        },
        {
          BatteryID: batteryB.Id,
          Price: 65000,
          Discount: 0,
          Qty: 3,
        },
      ],
    }

    const createdInq = await backend.invoke("inquiries:create", inqPayload)
    expect(createdInq.InquiryID).toBeDefined()
    expect(createdInq.Category).toBe("battery")
    expect(createdInq.IsAdminApproved).toBe(0)

    // Verify stock availability & to-order breakdown
    expect(createdInq.batteries).toHaveLength(2)

    const lineA = createdInq.batteries.find((b: any) => b.BatteryID === batteryA.Id)
    expect(lineA).toBeDefined()
    expect(lineA.Brand).toBe("Exide")
    expect(lineA.Model).toBe("Matrix Red 65Ah")
    expect(lineA.AvailableQuantity).toBe(4)
    expect(lineA.NeedToOrderQty).toBe(2) // 6 ordered - 4 available

    const lineB = createdInq.batteries.find((b: any) => b.BatteryID === batteryB.Id)
    expect(lineB).toBeDefined()
    expect(lineB.Brand).toBe("Amaron")
    expect(lineB.Model).toBe("PRO 90Ah")
    expect(lineB.AvailableQuantity).toBe(0)
    expect(lineB.NeedToOrderQty).toBe(3) // 3 ordered - 0 available

    // 5. Approve inquiry and verify status cascade to battery lines
    const approved = await backend.invoke("inquiries:updateStatus", createdInq.InquiryID, 1)
    expect(approved.IsAdminApproved).toBe(1)
    expect(approved.batteries.every((b: any) => b.IsAdminApproved === 1)).toBe(true)
  })

  it("maintains category isolation between tyre and battery inquiries", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // 1. Create a Tyre Product
    const tyre = await backend.invoke("tyres:create", {
      Brand: "Dunlop",
      Pattern: "SP TOURING",
      Size: "195/65R15",
      ActualSellingPrice: 28000,
    })

    // 2. Create a Battery Product
    const battery = await backend.invoke("batteries:create", {
      Brand: "Lucas",
      Model: "Max 35Ah",
      Voltage: "12V",
      Capacity: "35Ah",
      ActualSellingPrice: 25000,
    })

    // 3. Create Tyre Inquiry with Walkin Customer
    const tyreInq = await backend.invoke("inquiries:create", {
      Category: "tyre",
      ReminderDate: "2026-12-05",
      WalkinCustomer: {
        CustomerName: "Kamal Perera",
        CustomerPhone: "0771122334",
        CustomerAddress: "Nugegoda",
      },
      tyres: [
        {
          TyreID: tyre.Id,
          Price: 28000,
          Discount: 0,
          Qty: 4,
        },
      ],
    })
    expect(tyreInq.Category).toBe("tyre")
    expect(tyreInq.tyres).toHaveLength(1)
    expect(tyreInq.batteries).toHaveLength(0)
    expect(tyreInq.Customer.IsWalkinCustomer).toBe(true)

    // 4. Create Battery Inquiry
    const batteryInq = await backend.invoke("inquiries:create", {
      Category: "battery",
      ReminderDate: "2026-12-06",
      WalkinCustomer: {
        CustomerName: "Nimal Silva",
        CustomerPhone: "0779988776",
        CustomerAddress: "Dehiwala",
      },
      batteries: [
        {
          BatteryID: battery.Id,
          Price: 25000,
          Discount: 2,
          Qty: 2,
        },
      ],
    })
    expect(batteryInq.Category).toBe("battery")
    expect(batteryInq.batteries).toHaveLength(1)
    expect(batteryInq.tyres).toHaveLength(0)

    // 5. Query all inquiries and check categories
    const all = await backend.invoke("inquiries:getAll")
    const retrievedTyreInq = all.find((i: any) => i.InquiryID === tyreInq.InquiryID)
    const retrievedBatteryInq = all.find((i: any) => i.InquiryID === batteryInq.InquiryID)

    expect(retrievedTyreInq.Category).toBe("tyre")
    expect(retrievedBatteryInq.Category).toBe("battery")
  })

  it("converts battery inquiry to battery sales order and raises purchase order end-to-end", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // 1. Setup Branch & Location
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-CONV-01",
      BranchName: "Conversion Branch",
    })

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType = locationTypes.find(
      (lt: any) => lt.LocationTypeCode?.toLowerCase() === "df",
    ) || locationTypes[0]

    const batteryLocation = await backend.invoke("batteryLocations:create", {
      LocationCode: "LOC-CONV-01",
      LocationName: "Battery Stock Rack",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 100,
    })

    // 2. Setup Supplier & Customer
    const supplier = await backend.invoke("suppliers:create", {
      SupplierCode: "SUP-CONV-01",
      Name: "PowerMax Supplier",
    })

    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-CONV-01",
      Name: "City Taxis Co",
    })

    // 3. Setup Battery Product & Stock (3 in stock)
    const battery = await backend.invoke("batteries:create", {
      Brand: "Amaron",
      Model: "Go 45Ah",
      Voltage: "12V",
      Capacity: "45Ah",
      ActualSellingPrice: 38000,
    })

    const lot = await backend.invoke("batteryStorageManagers:create", {
      BatteryId: battery.Id,
      LocationID: batteryLocation.Id,
      Qty: 3,
      BatchCode: "BAT-CONV-001",
      ExpiryDate: "2027-12-31",
    })

    // 4. Create Battery Inquiry: 5 units requested (3 available, 2 need to order)
    const inq = await backend.invoke("inquiries:create", {
      Category: "battery",
      CustomerID: customer.CustomerID,
      ReminderDate: "2026-12-10",
      Notes: "5 taxi batteries requested",
      batteries: [
        {
          BatteryID: battery.Id,
          Price: 38000,
          Discount: 0,
          Qty: 5,
        },
      ],
    })
    expect(inq.batteries[0].NeedToOrderQty).toBe(2)

    // 5. Raise Battery Purchase Order referencing this Inquiry
    const poPayload = {
      Category: "battery",
      Date: "2026-11-23",
      InquiryID: inq.InquiryID,
      Lines: [
        {
          BatteryID: battery.Id,
          Price: 30000,
          Discount: 0,
          Qty: 2,
          Suppliers: [
            {
              SupplierID: supplier.SupplierID,
              Qty: 2,
              Price: 30000,
              Discount: 0,
            },
          ],
        },
      ],
    }

    const createdPO = await backend.invoke("po:createStandalone", poPayload)
    expect(createdPO.ID).toBeDefined()
    expect(createdPO.Category).toBe("battery")

    // Verify PO is linked to Inquiry
    const linkedPos = await backend.invoke("inquiryPo:getByInquiryId", inq.InquiryID)
    expect(linkedPos).toHaveLength(1)
    expect(linkedPos[0].ID).toBe(createdPO.ID)
    expect(linkedPos[0].Category).toBe("battery")

    // 6. Convert Battery Inquiry to Sales Order (take 3 from stock, 2 auto-PO)
    const soPayload = {
      Category: "battery",
      CustomerID: customer.CustomerID,
      Date: "2026-11-23",
      InquiryID: inq.InquiryID,
      Lines: [
        {
          BatteryID: battery.Id,
          Price: 38000,
          Discount: 0,
          Qty: 5,
          NeedToOrderQty: 2,
          TakeNowQty: 3,
          Allocations: [
            {
              BatteryStorageManagerID: lot.Id,
              BatteryStorageManagerBatchID: lot.Batches?.[0]?.Id,
              Qty: 3,
            },
          ],
        },
      ],
    }

    const soCreateResult = await backend.invoke("so:createWithAutoPO", soPayload)
    const createdSO = soCreateResult.so
    expect(createdSO.SoID).toBeDefined()
    expect(createdSO.Category).toBe("battery")

    // Verify SO is linked to Inquiry
    const linkedSos = await backend.invoke("inquirySo:getByInquiryId", inq.InquiryID)
    expect(linkedSos).toHaveLength(1)
    expect(linkedSos[0].SoID).toBe(createdSO.SoID)
    expect(linkedSos[0].Category).toBe("battery")

    // Verify Inquiry detail reflects the conversion
    const updatedInq = await backend.invoke("inquiries:getById", inq.InquiryID)
    expect(updatedInq.ConvertedSOID).toBe(createdSO.SoID)
    expect(updatedInq.LinkedPOs).toHaveLength(1)
    expect(updatedInq.LinkedSOs).toHaveLength(1)
  })
})
