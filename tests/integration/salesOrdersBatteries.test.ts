import { beforeEach, describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"

describe("Sales Orders, Delivery & Invoicing for Batteries", () => {
  beforeEach(() => {
    resetBackendModules()
  })

  it("creates battery SO, drains battery inventory, records take-now delivery, generates gate pass & invoice end-to-end", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // 1. Setup Branch & Locations
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-SO-BAT1",
      BranchName: "Main Battery Fulfillment Branch",
    })
    expect(branch.Id).toBeDefined()

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType = locationTypes.find(
      (lt: any) => lt.LocationTypeCode?.toLowerCase() === "df",
    ) || locationTypes[0]

    const batteryLocation = await backend.invoke("batteryLocations:create", {
      LocationCode: "LOC-SO-BAT-01",
      LocationName: "Battery Primary Rack",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 100,
    })
    expect(batteryLocation.Id).toBeDefined()

    // 2. Setup Supplier & Customer
    const supplier = await backend.invoke("suppliers:create", {
      SupplierCode: "SUP-SO-BAT1",
      Name: "Apex Battery Corp",
      Address: "50 Power Grid Rd",
      City: "Colombo",
    })
    expect(supplier.SupplierID).toBeDefined()

    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-SO-01",
      Name: "Lanka Transport Logistics",
      Phone: "+94771234567",
      Address: "12 Logistics Park, Kelaniya",
      Email: "transport@lanka.lk",
    })
    expect(customer.CustomerID).toBeDefined()

    // 3. Setup Battery Master Data
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
      MRP_WithVAT: 18500,
      DiscountOffered: 10,
    })
    expect(battery.Id).toBeDefined()

    await backend.invoke("batterySuppliers:create", {
      BatteryId: battery.Id,
      SupplierID: supplier.SupplierID,
      Price: 13500,
    })

    // 4. Seed Battery Stock in Inventory (10 units)
    const storedLot = await backend.invoke("batteryStorageManagers:create", {
      BatteryId: battery.Id,
      LocationID: batteryLocation.Id,
      Qty: 10,
      BatchCode: "AMR-2026-B1",
      MfgDate: "2026-01-01",
      ExpiryDate: "2028-06-01",
    })
    expect(storedLot.Id).toBeDefined()

    const initialBatches = await backend.invoke(
      "batteryStorageManagers:getBatchesByBatteryId",
      battery.Id,
    )
    expect(initialBatches.length).toBe(1)
    const initialBatch = initialBatches[0]
    expect(initialBatch.Qty).toBe(10)

    // 5. Create Battery Sales Order (Full Fulfillment: Order 4, Take Now 4)
    const soCreateResult = await backend.invoke("so:createWithAutoPO", {
      Date: "2026-11-22",
      Category: "battery",
      CustomerID: customer.CustomerID,
      IsAdminApproved: 1,
      IsCompleted: 1,
      Lines: [
        {
          BatteryID: battery.Id,
          Price: 18500,
          MRP_WithVAT: 18500,
          Discount: 5,
          Qty: 4,
          NeedToOrderQty: 0,
          TakeNowQty: 4,
          Allocations: [
            {
              StorageManagerID: storedLot.Id,
              StorageManagerBatchID: initialBatch.Id,
              Qty: 4,
              TakeNowQty: 4,
            },
          ],
        },
      ],
    })

    expect(soCreateResult.so).toBeDefined()
    expect(soCreateResult.so.Category).toBe("battery")
    expect(soCreateResult.po).toBeNull() // Fully fulfilled, no PO needed
    expect(soCreateResult.delivery).toBeDefined()

    const batterySoId = soCreateResult.so.SoID

    // 6. Verify inventory draining (10 - 4 = 6 remaining)
    const updatedBatches = await backend.invoke(
      "batteryStorageManagers:getBatchesByBatteryId",
      battery.Id,
    )
    expect(updatedBatches[0].Qty).toBe(6)

    const updatedLots = await backend.invoke(
      "batteryStorageManagers:getByBatteryId",
      battery.Id,
    )
    expect(updatedLots[0].Qty).toBe(6)

    // 7. Verify SO Details retrieval for Battery Category
    const fetchedSo = await backend.invoke("so:getById", batterySoId)
    expect(fetchedSo.Category).toBe("battery")
    expect(fetchedSo.Batteries).toBeDefined()
    expect(fetchedSo.Batteries.length).toBe(1)
    expect(fetchedSo.Batteries[0].BatteryID).toBe(battery.Id)
    expect(fetchedSo.Batteries[0].Brand).toBe("Amaron")
    expect(fetchedSo.Batteries[0].Model).toBe("Hi-Life 12V 45Ah")
    expect(fetchedSo.Batteries[0].Capacity).toBe("45Ah")
    expect(fetchedSo.Batteries[0].Voltage).toBe("12V")
    expect(fetchedSo.Batteries[0].Qty).toBe(4)
    expect(fetchedSo.TotalSale).toBe(70300) // (18500 * 4) - 3700
    expect(fetchedSo.TotalDiscount).toBe(3700) // 74000 * 0.05

    // 8. Verify Delivery & Delivery Lines for Battery
    const deliveries = await backend.invoke("so:getDeliveries", batterySoId)
    expect(deliveries.length).toBe(1)
    const delivery = deliveries[0]
    expect(delivery.Lines.length).toBe(1)
    const deliveryLine = delivery.Lines[0]
    expect(deliveryLine.BatteryID).toBe(battery.Id)
    expect(deliveryLine.Brand).toBe("Amaron")
    expect(deliveryLine.Model).toBe("Hi-Life 12V 45Ah")
    expect(deliveryLine.Capacity).toBe("45Ah")
    expect(deliveryLine.Voltage).toBe("12V")
    expect(deliveryLine.Qty).toBe(4)

    // 9. Verify Delivery Progress Calculation for Battery SO
    const progress = await backend.invoke("so:getDeliveryProgress", batterySoId)
    expect(progress.IsFullyDelivered).toBe(true)
    expect(progress.Totals.OrderedQty).toBe(4)
    expect(progress.Totals.DeliveredQty).toBe(4)
    expect(progress.Totals.RemainingToCollect).toBe(0)
    expect(progress.Lines[0].Brand).toBe("Amaron")
    expect(progress.Lines[0].Model).toBe("Hi-Life 12V 45Ah")

    // 10. Issue Gate Pass for Battery Delivery
    const deliveryWithGatePass = await backend.invoke(
      "so:issueDeliveryGatePass",
      batterySoId,
      delivery.ID,
      { overridePaymentIncomplete: true },
    )
    expect(deliveryWithGatePass.GatePassNo).toBeDefined()
    expect(deliveryWithGatePass.GatePassNo.length).toBeGreaterThan(0)

    // 11. Generate Invoice from Battery Delivery
    const invoice = await backend.invoke("invoice:generateFromDelivery", delivery.ID)
    expect(invoice.InvoiceID).toBeDefined()
    expect(invoice.SourceType).toBe("delivery")
    expect(invoice.SourceID).toBe(delivery.ID)
    expect(invoice.Subtotal).toBe(70300)
    expect(invoice.DiscountTotal).toBe(0)
    expect(invoice.Total).toBe(70300)

    // Verify Invoice Lines has battery metadata
    const fetchedInvoice = await backend.invoke("invoice:getById", invoice.InvoiceID)
    expect(fetchedInvoice.Lines.length).toBe(1)
    const invLine = fetchedInvoice.Lines[0]
    expect(invLine.LineType).toBe("battery")
    expect(invLine.BatteryID).toBe(battery.Id)
    expect(invLine.Brand).toBe("Amaron")
    expect(invLine.Model).toBe("Hi-Life 12V 45Ah")
    expect(invLine.Capacity).toBe("45Ah")
    expect(invLine.Voltage).toBe("12V")
    expect(invLine.Qty).toBe(4)
    expect(invLine.UnitPrice).toBe(17575)
    expect(invLine.Discount).toBe(0)
    expect(invLine.LineTotal).toBe(70300)

    // 12. Record Payment on the Battery Invoice
    const paymentResult = await backend.invoke(
      "invoice:recordPayment",
      invoice.InvoiceID,
      {
        Payment: {
          CashPayment: {
            PaymentTypeCode: "csh",
            AmountReceived: 70300,
            BalanceToReturn: 0,
          },
        },
      },
    )
    expect(paymentResult.Status).toBe("paid")
    expect(paymentResult.AmountPaid).toBe(70300)
    expect(paymentResult.BalanceDue).toBe(0)

    // 13. Verify Warehouse Dispatch for Battery SO
    const dispatch = await backend.invoke("so:getWarehouseDispatch", batterySoId)
    expect(dispatch.soId).toBe(batterySoId)
    expect(dispatch.warehouses.length).toBeGreaterThanOrEqual(1)
    expect(dispatch.warehouses[0].lines[0].displayName).toContain("Amaron")
  })

  it("handles battery partial stock with automatic Battery PO creation, take-now partial delivery, and subsequent delivery", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // Setup Branch, Location, Supplier, Customer, Battery
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-SO-BAT2",
      BranchName: "Secondary Fulfillment Branch",
    })
    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType = locationTypes.find(
      (lt: any) => lt.LocationTypeCode?.toLowerCase() === "df",
    ) || locationTypes[0]

    const batteryLocation = await backend.invoke("batteryLocations:create", {
      LocationCode: "LOC-SO-BAT-02",
      LocationName: "Battery Overflow Rack",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 100,
    })

    const supplier = await backend.invoke("suppliers:create", {
      SupplierCode: "SUP-SO-BAT2",
      Name: "Volta Power Supply",
      Address: "88 Energy Blvd",
      City: "Kandy",
    })

    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-SO-02",
      Name: "Central Fleet Services",
      Phone: "+94779876543",
      Address: "32 Kandy Road",
    })

    const battery = await backend.invoke("batteries:create", {
      Brand: "Exide",
      Model: "Matrix Red 12V 65Ah",
      Series: "Matrix Red",
      Voltage: "12V",
      Capacity: "65Ah",
      PurchasedPrice: 20000,
      ActualSellingPrice: 26000,
      MRP_WithVAT: 26000,
      DiscountOffered: 5,
    })

    await backend.invoke("batterySuppliers:create", {
      BatteryId: battery.Id,
      SupplierID: supplier.SupplierID,
      Price: 19500,
    })

    // Stock only 3 units in inventory
    const storedLot = await backend.invoke("batteryStorageManagers:create", {
      BatteryId: battery.Id,
      LocationID: batteryLocation.Id,
      Qty: 3,
      BatchCode: "EX-B2-001",
      MfgDate: "2026-02-01",
      ExpiryDate: "2028-08-01",
    })

    const batches = await backend.invoke("batteryStorageManagers:getBatchesByBatteryId", battery.Id)
    const batch = batches[0]

    // Customer wants 8 units (3 available on hand, 5 must be ordered!)
    const partialSoResult = await backend.invoke("so:createWithAutoPO", {
      Date: "2026-11-22",
      Category: "battery",
      CustomerID: customer.CustomerID,
      IsAdminApproved: 1,
      IsCompleted: 0, // Incomplete because NeedToOrderQty > 0
      Lines: [
        {
          BatteryID: battery.Id,
          Price: 26000,
          MRP_WithVAT: 26000,
          Discount: 0,
          Qty: 8,
          NeedToOrderQty: 5,
          TakeNowQty: 3,
          Allocations: [
            {
              StorageManagerID: storedLot.Id,
              StorageManagerBatchID: batch.Id,
              Qty: 3,
              TakeNowQty: 3,
            },
            {
              StorageManagerID: null,
              StorageManagerBatchID: null,
              Qty: 5,
              TakeNowQty: 0,
            },
          ],
        },
      ],
    })

    expect(partialSoResult.so).toBeDefined()
    expect(partialSoResult.so.Category).toBe("battery")
    expect(partialSoResult.so.IsCompleted).toBe(0)

    // Stock should now be drained to 0
    const availableBatches = await backend.invoke("batteryStorageManagers:getBatchesByBatteryId", battery.Id)
    expect(availableBatches.length).toBe(0)

    const drainedBatches = await backend.invoke("batteryStorageManagers:getBatchesByStorageManagerId", storedLot.Id)
    expect(drainedBatches[0].Qty).toBe(0)

    // Automatic PO MUST have been created for Batteries!
    expect(partialSoResult.po).toBeDefined()
    expect(partialSoResult.po?.Category).toBe("battery")

    const autoPo = await backend.invoke("po:getById", partialSoResult.po.ID)
    expect(autoPo.Category).toBe("battery")
    expect(autoPo.Batteries).toBeDefined()
    expect(autoPo.Batteries.length).toBe(1)
    expect(autoPo.Batteries[0].BatteryID).toBe(battery.Id)
    expect(autoPo.Batteries[0].Qty).toBe(5) // NeedToOrderQty

    // Delivery progress check
    const progress = await backend.invoke("so:getDeliveryProgress", partialSoResult.so.SoID)
    expect(progress.IsFullyDelivered).toBe(false)
    expect(progress.Totals.OrderedQty).toBe(8)
    expect(progress.Totals.DeliveredQty).toBe(3)
    expect(progress.Totals.ToOrderQty).toBe(5)
    expect(progress.Totals.RemainingToCollect).toBe(5)

    // Whole SO invoice generation
    const soInvoice = await backend.invoke("invoice:generateFromSO", partialSoResult.so.SoID)
    expect(soInvoice.InvoiceID).toBeDefined()
    expect(soInvoice.SourceType).toBe("so")
    expect(soInvoice.Total).toBe(208000) // 26000 * 8

    const fetchedSoInvoice = await backend.invoke("invoice:getById", soInvoice.InvoiceID)
    expect(fetchedSoInvoice.Lines[0].LineType).toBe("battery")
    expect(fetchedSoInvoice.Lines[0].BatteryID).toBe(battery.Id)
    expect(fetchedSoInvoice.Lines[0].Qty).toBe(8)
  })

  it("maintains category isolation and preserves tyre sales order flows with zero regression", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // 1. Setup Branch & Tyre Locations & Battery Locations
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-DUAL-01",
      BranchName: "Dual Category Fulfillment Branch",
    })
    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType = locationTypes.find(
      (lt: any) => lt.LocationTypeCode?.toLowerCase() === "df",
    ) || locationTypes[0]

    const tyreLocation = await backend.invoke("storageLocations:create", {
      LocationCode: "LOC-TYRE-01",
      LocationName: "Tyre Bay",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 100,
    })

    const batteryLocation = await backend.invoke("batteryLocations:create", {
      LocationCode: "LOC-BAT-01",
      LocationName: "Battery Bay",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 100,
    })

    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-DUAL-01",
      Name: "Universal Fleet Co",
      Phone: "+94770001111",
      Address: "10 Union Place, Colombo 2",
    })

    // Setup Tyre Master & Stock
    const tyre = await backend.invoke("tyres:create", {
      Brand: "Michelin",
      Size: "205/55R16",
      Pattern: "Primacy 4",
      ActualSellingPrice: 35000,
      MRP_WithVAT: 35000,
      DiscountOffered: 5,
    })

    const tyreLot = await backend.invoke("storageManagers:create", {
      TyreId: tyre.Id,
      LocationID: tyreLocation.Id,
      Qty: 10,
    })

    backend.db
      .prepare("INSERT INTO StorageManagerBatch (StorageManagerID, DOT, Qty) VALUES (?, ?, ?)")
      .run(tyreLot.Id, "2426", 10)

    const tyreBatches = await backend.invoke("storageManagers:getBatchesByTyreId", tyre.Id)
    const tyreBatch = tyreBatches[0]

    // Setup Battery Master & Stock
    const battery = await backend.invoke("batteries:create", {
      Brand: "Yuasa",
      Model: "YTX9-BS",
      Voltage: "12V",
      Capacity: "8Ah",
      ActualSellingPrice: 12000,
      MRP_WithVAT: 12000,
      DiscountOffered: 5,
    })

    const batteryLot = await backend.invoke("batteryStorageManagers:create", {
      BatteryId: battery.Id,
      LocationID: batteryLocation.Id,
      Qty: 10,
      BatchCode: "YU-2026-B1",
      ExpiryDate: "2028-12-01",
    })

    const batteryBatches = await backend.invoke("batteryStorageManagers:getBatchesByBatteryId", battery.Id)
    const batteryBatch = batteryBatches[0]

    // Create 1 Tyre SO
    const tyreSoResult = await backend.invoke("so:createWithAutoPO", {
      Date: "2026-11-22",
      Category: "tyre",
      CustomerID: customer.CustomerID,
      IsAdminApproved: 1,
      IsCompleted: 1,
      Lines: [
        {
          TyreID: tyre.Id,
          Price: 35000,
          MRP_WithVAT: 35000,
          Discount: 0,
          Qty: 2,
          NeedToOrderQty: 0,
          TakeNowQty: 2,
          Allocations: [
            {
              StorageManagerID: tyreLot.Id,
              StorageManagerBatchID: tyreBatch.Id,
              Qty: 2,
              TakeNowQty: 2,
            },
          ],
        },
      ],
    })
    expect(tyreSoResult.so.Category).toBe("tyre")

    // Create 1 Battery SO
    const batterySoResult = await backend.invoke("so:createWithAutoPO", {
      Date: "2026-11-22",
      Category: "battery",
      CustomerID: customer.CustomerID,
      IsAdminApproved: 1,
      IsCompleted: 1,
      Lines: [
        {
          BatteryID: battery.Id,
          Price: 12000,
          MRP_WithVAT: 12000,
          Discount: 0,
          Qty: 3,
          NeedToOrderQty: 0,
          TakeNowQty: 3,
          Allocations: [
            {
              StorageManagerID: batteryLot.Id,
              StorageManagerBatchID: batteryBatch.Id,
              Qty: 3,
              TakeNowQty: 3,
            },
          ],
        },
      ],
    })
    expect(batterySoResult.so.Category).toBe("battery")

    // Test Category Filtering
    const allSos = await backend.invoke("so:getAll")
    expect(allSos.length).toBe(2)

    const tyreSos = await backend.invoke("so:getAll", "tyre")
    expect(tyreSos.length).toBe(1)
    expect(tyreSos[0].SoID).toBe(tyreSoResult.so.SoID)
    expect(tyreSos[0].Category).toBe("tyre")

    const batterySos = await backend.invoke("so:getAll", "battery")
    expect(batterySos.length).toBe(1)
    expect(batterySos[0].SoID).toBe(batterySoResult.so.SoID)
    expect(batterySos[0].Category).toBe("battery")

    // Verify Tyre delivery and invoice generation work with zero regression
    const tyreDelivery = tyreSoResult.delivery
    expect(tyreDelivery).toBeDefined()
    const tyreInvoice = await backend.invoke("invoice:generateFromDelivery", tyreDelivery.ID)
    expect(tyreInvoice.Lines[0].LineType).toBe("tyre")
    expect(tyreInvoice.Lines[0].TyreID).toBe(tyre.Id)

    // Verify Battery delivery and invoice generation
    const batteryDelivery = batterySoResult.delivery
    expect(batteryDelivery).toBeDefined()
    const batteryInvoice = await backend.invoke("invoice:generateFromDelivery", batteryDelivery.ID)
    expect(batteryInvoice.Lines[0].LineType).toBe("battery")
    expect(batteryInvoice.Lines[0].BatteryID).toBe(battery.Id)
  })

  it("distinguishes advance payments from invoice settlement payments on sales orders", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-ADV-01",
      BranchName: "Advance Payment Branch",
    })

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType = locationTypes.find(
      (lt: any) => lt.LocationTypeCode?.toLowerCase() === "df",
    ) || locationTypes[0]

    const batteryLocation = await backend.invoke("batteryLocations:create", {
      LocationCode: "LOC-ADV-01",
      LocationName: "Advance Bay",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 100,
    })

    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-ADV-01",
      Name: "Advance Fleet Services",
      Phone: "+94770002222",
      Address: "50 Galle Road, Colombo 3",
    })

    const battery = await backend.invoke("batteries:create", {
      Brand: "Panasonic",
      Model: "Tough 12V 70Ah",
      Voltage: "12V",
      Capacity: "70Ah",
      ActualSellingPrice: 40000,
      MRP_WithVAT: 40000,
      DiscountOffered: 0,
    })

    // Step 1: Create an SO with NO items taken now (all 2 ordered).
    // Customer pays LKR 30,000 as an ADVANCE deposit upfront!
    const advanceSoResult = await backend.invoke("so:createWithAutoPO", {
      Date: "2026-11-23",
      Category: "battery",
      CustomerID: customer.CustomerID,
      IsAdminApproved: 1,
      IsCompleted: 0,
      Payment: {
        CashPayment: {
          PaymentTypeCode: "csh",
          AmountReceived: 30000,
          BalanceToReturn: 0,
        },
      },
      Lines: [
        {
          BatteryID: battery.Id,
          Price: 40000,
          MRP_WithVAT: 40000,
          Discount: 0,
          Qty: 2,
          NeedToOrderQty: 2,
          TakeNowQty: 0,
          Allocations: [
            {
              StorageManagerID: null,
              StorageManagerBatchID: null,
              Qty: 2,
              TakeNowQty: 0,
            },
          ],
        },
      ],
    })

    const soId = advanceSoResult.so.SoID
    const soWithAdvance = await backend.invoke("so:getById", soId)
    expect(soWithAdvance.Payments.length).toBe(1)
    const advancePayment = soWithAdvance.Payments[0]

    // Verify this is classified as an ADVANCE payment
    expect(advancePayment.IsAdvance).toBe(true)
    expect(advancePayment.Amount).toBe(30000)
    expect(advancePayment.Invoices).toBeUndefined()

    // Step 2: Generate Invoice from the Sales Order.
    // The advance payment of 30,000 should automatically be linked to this 80,000 invoice!
    const invoice = await backend.invoke("invoice:generateFromSO", soId)
    expect(invoice.Total).toBe(80000)
    expect(invoice.AmountPaid).toBe(30000)
    expect(invoice.BalanceDue).toBe(50000)

    // The SO payment now reflects that the advance was applied to the invoice, but remains an advance payment!
    const soAfterInvoice = await backend.invoke("so:getById", soId)
    expect(soAfterInvoice.Payments.length).toBe(1)
    expect(soAfterInvoice.Payments[0].IsAdvance).toBe(true)
    expect(soAfterInvoice.Payments[0].Invoices.length).toBe(1)
    expect(soAfterInvoice.Payments[0].Invoices[0].InvoiceID).toBe(invoice.InvoiceID)

    // Step 3: Pay the remaining 50,000 balance against the invoice directly
    const directInvoicePayment = await backend.invoke(
      "invoice:recordPayment",
      invoice.InvoiceID,
      {
        Payment: {
          CashPayment: {
            PaymentTypeCode: "csh",
            AmountReceived: 50000,
            BalanceToReturn: 0,
          },
        },
      },
    )
    expect(directInvoicePayment.Status).toBe("paid")
    expect(directInvoicePayment.BalanceDue).toBe(0)

    // Step 4: Verify SO Details payments array
    // There are now 2 payments:
    // - Payment 1 (the initial deposit): IsAdvance === true
    // - Payment 2 (the invoice settlement): IsAdvance === false!
    const soFullyPaid = await backend.invoke("so:getById", soId)
    expect(soFullyPaid.Payments.length).toBe(2)

    const p1 = soFullyPaid.Payments.find((p: any) => p.Amount === 30000)
    const p2 = soFullyPaid.Payments.find((p: any) => p.Amount === 50000)

    expect(p1).toBeDefined()
    expect(p1.IsAdvance).toBe(true)

    expect(p2).toBeDefined()
    expect(p2.IsAdvance).toBe(false)
  })
})
