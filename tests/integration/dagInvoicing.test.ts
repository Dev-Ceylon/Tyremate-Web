import { beforeEach, describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"

describe("DAG Invoicing Engine & Payment Parity", () => {
  beforeEach(() => {
    resetBackendModules()
  })

  it("generates DAG invoice for registered customer, verifies lines, idempotency, and records invoice payment", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // 1. Setup Branch & Storage Location
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-DAG-1",
      BranchName: "Main Retreading Branch",
    })
    expect(branch.Id).toBeDefined()

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType =
      locationTypes.find((lt: any) => lt.LocationTypeCode?.toLowerCase() === "df") ||
      locationTypes[0]

    const location = await backend.invoke("storageLocations:create", {
      LocationCode: "LOC-DAG-01",
      LocationName: "DAG Receiving Rack",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 100,
    })
    expect(location.Id).toBeDefined()

    // 2. Setup Contractor
    const contractor = await backend.invoke("contractors:create", {
      ContractorCode: "CONT-001",
      Name: "Bandag Retreaders Ltd",
      Phone: "+94770001122",
      Address: "45 Industrial Zone, Biyagama",
    })
    expect(contractor.ID).toBeDefined()

    // 3. Setup Customer
    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-DAG-01",
      Name: "Perera Freight Logistics",
      Phone: "+94773344556",
      Address: "88 Port Access Rd, Colombo",
      Email: "accounts@pererafreight.lk",
      VatNo: "VAT-987654",
    })
    expect(customer.CustomerID).toBeDefined()

    // 4. Setup Tyre Master
    const tyre = await backend.invoke("tyres:create", {
      Brand: "Bridgestone",
      Size: "295/80R22.5",
      Pattern: "R168",
      DAGCost: 16500,
      PurchasedPrice: 45000,
      ActualSellingPrice: 58000,
    })
    expect(tyre.Id).toBeDefined()

    // 5. Create DAG with 2 tyre serials
    const dagPayload = {
      CustomerID: customer.CustomerID,
      ContractorID: contractor.ID,
      Date: "2026-11-25",
      Comment: "Retread 2 steer tyres with R168 tread",
      Tyres: [
        {
          TyreID: tyre.Id,
          StorageLocationID: location.Id,
          Qty: 2,
          Serials: [
            { SerialNumber: "DAG-SER-101", DAGCost: 16500 },
            { SerialNumber: "DAG-SER-102", DAGCost: 16500 },
          ],
        },
      ],
    }

    const result = await backend.invoke("dag:createWithTyres", dagPayload)
    const createdDag = result.dag || result
    expect(createdDag.ID).toBeDefined()

    // Verify detailed DAG
    const detailedDag = await backend.invoke("dag:getDetailedById", createdDag.ID)
    expect(detailedDag.TotalDAGCost).toBe(33000)
    expect(detailedDag.IsPaymentCompleted).toBe(0)

    // 6. Generate Invoice from DAG
    const invoice = await backend.invoke("invoice:generateFromDAG", createdDag.ID)
    expect(invoice).toBeDefined()
    expect(invoice.InvoiceID).toBeDefined()
    expect(invoice.InvoiceNumber).toMatch(/^INV-\d{4}-\d{5}$/)
    expect(invoice.SourceType).toBe("dag")
    expect(invoice.SourceID).toBe(createdDag.ID)
    expect(invoice.CustomerID).toBe(customer.CustomerID)
    expect(invoice.CustomerName).toBe("Perera Freight Logistics")
    expect(invoice.CustomerVatNo).toBe("VAT-987654")
    expect(invoice.Subtotal).toBe(33000)
    expect(invoice.Total).toBe(33000)
    expect(invoice.AmountPaid).toBe(0)
    expect(invoice.BalanceDue).toBe(33000)
    expect(invoice.Status).toBe("iss") // Issued

    // Verify Lines
    expect(invoice.Lines).toHaveLength(2)
    const serials = invoice.Lines.map((l: any) => l.SerialNo)
    expect(serials).toContain("DAG-SER-101")
    expect(serials).toContain("DAG-SER-102")
    expect(invoice.Lines[0].LineType).toBe("tyre")
    expect(invoice.Lines[0].UnitPrice).toBe(16500)
    expect(invoice.Lines[0].LineTotal).toBe(16500)
    expect(invoice.Lines[0].Brand).toBe("Bridgestone")
    expect(invoice.Lines[0].Size).toBe("295/80R22.5")
    expect(invoice.Lines[0].Description).toContain("DAG Retreading")

    // 7. Verify Idempotency - Generating again returns the same invoice without duplicating
    const invoiceDuplicate = await backend.invoke("invoice:generateFromDAG", createdDag.ID)
    expect(invoiceDuplicate.InvoiceID).toBe(invoice.InvoiceID)
    expect(invoiceDuplicate.InvoiceNumber).toBe(invoice.InvoiceNumber)

    // 8. Record Payment against Invoice
    const paymentResult = await backend.invoke("invoice:recordPayment", invoice.InvoiceID, {
      Payment: {
        CashPayment: {
          Amount: 33000,
          AmountReceived: 33000,
          BalanceToReturn: 0,
        },
      },
    })

    expect(paymentResult.AmountPaid).toBe(33000)
    expect(paymentResult.BalanceDue).toBe(0)
    expect(paymentResult.Status).toBe("paid")

    // Verify that DAG itself has received the payment and updated IsPaymentCompleted
    const updatedDag = await backend.invoke("dag:getDetailedById", createdDag.ID)
    expect(updatedDag.IsPaymentCompleted).toBe(1)
    expect(updatedDag.Payments.length).toBeGreaterThanOrEqual(1)
  })

  it("handles walk-in customers and advance payments on DAG invoices", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-DAG-2",
      BranchName: "Walkin Service Branch",
    })

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType =
      locationTypes.find((lt: any) => lt.LocationTypeCode?.toLowerCase() === "df") ||
      locationTypes[0]

    const location = await backend.invoke("storageLocations:create", {
      LocationCode: "LOC-DAG-02",
      LocationName: "Walkin Bay",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 50,
    })

    const contractor = await backend.invoke("contractors:create", {
      ContractorCode: "CONT-002",
      Name: "Quick Retread Specialists",
      Phone: "+94711112233",
      Address: "10 Industrial Estate",
    })

    const tyre = await backend.invoke("tyres:create", {
      Brand: "Michelin",
      Size: "11R22.5",
      Pattern: "X Multi",
      DAGCost: 20000,
      PurchasedPrice: 50000,
      ActualSellingPrice: 65000,
    })

    // Create DAG for walk-in customer with partial advance cash payment
    const walkinPayload = {
      CustomerName: "Kamal Gunaratne",
      CustomerPhone: "+94778899001",
      CustomerAddress: "22 Flower Rd, Colombo 07",
      VehicleNumber: "WP-CAB-1234",
      ContractorID: contractor.ID,
      Date: "2026-11-25",
      Comment: "Walk-in retread order with advance",
      Payment: {
        CashPayment: {
          Amount: 10000,
          AmountReceived: 10000,
          BalanceToReturn: 0,
        },
      },
      Tyres: [
        {
          TyreID: tyre.Id,
          StorageLocationID: location.Id,
          Qty: 1,
          Serials: [{ SerialNumber: "MIC-DAG-001", DAGCost: 20000 }],
        },
      ],
    }

    const result = await backend.invoke("dag:createWithTyres", walkinPayload)
    const createdDag = result.dag || result
    expect(createdDag.ID).toBeDefined()

    // Generate invoice
    const invoice = await backend.invoke("invoice:generateFromDAG", createdDag.ID)
    expect(invoice.SourceType).toBe("dag")
    expect(invoice.SourceID).toBe(createdDag.ID)
    expect(invoice.CustomerID).toBeNull()
    expect(invoice.WalkinCustomerID).toBeDefined()
    expect(invoice.CustomerName).toBe("Kamal Gunaratne")
    expect(invoice.CustomerPhone).toBe("9477889900")
    expect(invoice.CustomerAddress).toBe("22 Flower Rd, Colombo 07")
    expect(invoice.Total).toBe(20000)
    expect(invoice.AmountPaid).toBe(10000) // Advance applied automatically!
    expect(invoice.BalanceDue).toBe(10000)
    expect(invoice.Status).toBe("par") // Partially paid

    // Settle remainder via cash
    const updatedInvoice = await backend.invoke("invoice:recordPayment", invoice.InvoiceID, {
      Payment: {
        CashPayment: {
          Amount: 10000,
          AmountReceived: 10000,
          BalanceToReturn: 0,
        },
      },
    })

    expect(updatedInvoice.AmountPaid).toBe(20000)
    expect(updatedInvoice.BalanceDue).toBe(0)
    expect(updatedInvoice.Status).toBe("paid")

    const finalDag = await backend.invoke("dag:getDetailedById", createdDag.ID)
    expect(finalDag.IsPaymentCompleted).toBe(1)
  })

  it("synchronizes DAG invoice settlement automatically when DAG tyres are taken with payment", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-DAG-3",
      BranchName: "Sync Test Branch",
    })

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType =
      locationTypes.find((lt: any) => lt.LocationTypeCode?.toLowerCase() === "df") ||
      locationTypes[0]

    const location = await backend.invoke("storageLocations:create", {
      LocationCode: "LOC-DAG-03",
      LocationName: "Sync Rack",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 50,
    })

    const contractor = await backend.invoke("contractors:create", {
      ContractorCode: "CONT-003",
      Name: "Standard Retreaders",
      Phone: "+94719998877",
      Address: "30 Commercial Zone",
    })

    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-DAG-03",
      Name: "Silva Transport Co",
      Phone: "+94775556677",
      Address: "15 Negombo Rd, Peliyagoda",
      Email: "silva@transport.lk",
    })

    const tyre = await backend.invoke("tyres:create", {
      Brand: "Dunlop",
      Size: "10.00R20",
      Pattern: "SP371",
      DAGCost: 18000,
      PurchasedPrice: 42000,
      ActualSellingPrice: 55000,
    })

    // Create DAG with 2 serials (@ 18,000 each = 36,000)
    const result = await backend.invoke("dag:createWithTyres", {
      CustomerID: customer.CustomerID,
      ContractorID: contractor.ID,
      Date: "2026-11-25",
      Comment: "Test DAG take payment synchronization",
      Tyres: [
        {
          TyreID: tyre.Id,
          StorageLocationID: location.Id,
          Qty: 2,
          Serials: [
            { SerialNumber: "DUN-DAG-001", DAGCost: 18000 },
            { SerialNumber: "DUN-DAG-002", DAGCost: 18000 },
          ],
        },
      ],
    })

    const createdDag = result.dag || result
    expect(createdDag.ID).toBeDefined()

    // 1. Generate Invoice before any takes are performed
    const invoice = await backend.invoke("invoice:generateFromDAG", createdDag.ID)
    expect(invoice.Total).toBe(36000)
    expect(invoice.AmountPaid).toBe(0)
    expect(invoice.BalanceDue).toBe(36000)
    expect(invoice.Status).toBe("iss")

    // Fetch serial IDs
    const detailed = await backend.invoke("dag:getDetailedById", createdDag.ID)
    const serial1 = detailed.Tyres[0].Serials.find((s: any) => s.SerialNumber === "DUN-DAG-001")
    expect(serial1).toBeDefined()

    // 2. Perform a take on serial 1 with cash payment of 18,000
    await backend.invoke("dag:sellTyres", createdDag.ID, {
      SerialIds: [serial1.ID],
      Payment: {
        CashPayment: {
          AmountReceived: 18000,
          BalanceToReturn: 0,
        },
      },
    })

    // 3. Verify the existing invoice is automatically updated to partially paid!
    const recheckedInvoice = await backend.invoke("invoice:getById", invoice.InvoiceID)
    expect(recheckedInvoice.AmountPaid).toBe(18000)
    expect(recheckedInvoice.BalanceDue).toBe(18000)
    expect(recheckedInvoice.Status).toBe("par")

    // 4. Now take serial 2 with cash payment of 18,000
    const serial2 = detailed.Tyres[0].Serials.find((s: any) => s.SerialNumber === "DUN-DAG-002")
    await backend.invoke("dag:sellTyres", createdDag.ID, {
      SerialIds: [serial2.ID],
      Payment: {
        CashPayment: {
          AmountReceived: 18000,
          BalanceToReturn: 0,
        },
      },
    })

    // 5. Verify the invoice is now fully paid!
    const finalInvoice = await backend.invoke("invoice:getById", invoice.InvoiceID)
    expect(finalInvoice.AmountPaid).toBe(36000)
    expect(finalInvoice.BalanceDue).toBe(0)
    expect(finalInvoice.Status).toBe("paid")
  })
})
