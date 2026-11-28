import { beforeEach, describe, expect, it } from "vitest"
import { bootBackend, createSqlJsDriver, resetBackendModules } from "../helpers/backend"
import {
  buildDAGPaymentReceiptPrintData,
  buildDAGPaymentSummaryReceiptPrintData,
} from "../../src/features/dag/services/dagPaymentReceiptPrintService"
import { buildInvoicePrintData } from "../../src/features/invoice/services/invoicePrintService"
import { getInvoiceSourceLink, SOURCE_LABELS } from "../../src/features/invoice/components/InvoiceTable"

const printTemplateService = require("../../backend/apps/electron/services/PrintTemplateService")

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

  it("hydrates payment receipt metadata (Invoices, IsAdvance, PR numbers) and renders official receipt templates", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-DAG-4",
      BranchName: "Receipt Test Branch",
    })

    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType =
      locationTypes.find((lt: any) => lt.LocationTypeCode?.toLowerCase() === "df") ||
      locationTypes[0]

    const location = await backend.invoke("storageLocations:create", {
      LocationCode: "LOC-DAG-04",
      LocationName: "Receipt Rack",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 50,
    })

    const contractor = await backend.invoke("contractors:create", {
      ContractorCode: "CONT-004",
      Name: "Apex Retreading Hub",
      Phone: "+94712223344",
      Address: "50 Apex Blvd, Katuwana",
    })

    const tyre = await backend.invoke("tyres:create", {
      Brand: "Pirelli",
      Size: "315/80R22.5",
      Pattern: "FH01",
      DAGCost: 22000,
      PurchasedPrice: 55000,
      ActualSellingPrice: 72000,
    })

    // Create DAG with upfront advance cash payment of 5,000 and 2 tyre serials (cost 11,000 each = 22,000)
    const createResult = await backend.invoke("dag:createWithTyres", {
      CustomerName: "Bandara Express",
      CustomerPhone: "+94771239876",
      CustomerAddress: "77 High Level Rd, Maharagama",
      VehicleNumber: "WP-ND-8899",
      ContractorID: contractor.ID,
      Date: "2026-11-25",
      Comment: "Advance payment and tyre collection receipt test",
      Payment: {
        CashPayment: {
          AmountReceived: 5000,
          BalanceToReturn: 0,
        },
      },
      Tyres: [
        {
          TyreID: tyre.Id,
          StorageLocationID: location.Id,
          Qty: 2,
          Serials: [
            { SerialNumber: "PIR-DAG-777", DAGCost: 11000 },
            { SerialNumber: "PIR-DAG-888", DAGCost: 11000 },
          ],
        },
      ],
    })

    const dag = createResult.dag || createResult
    expect(dag.ID).toBeDefined()

    // Generate invoice so the advance payment is linked to an official INV number
    const invoice = await backend.invoke("invoice:generateFromDAG", dag.ID)
    expect(invoice.InvoiceNumber).toBeDefined()

    // Fetch detailed DAG and inspect advance payment
    let detailed = await backend.invoke("dag:getDetailedById", dag.ID)
    expect(detailed.Payments).toHaveLength(1)
    const advancePayment = detailed.Payments[0]

    expect(advancePayment.PaymentID).toBeDefined()
    expect(advancePayment.IsAdvance).toBe(1)
    expect(advancePayment.Amount).toBe(5000)
    expect(advancePayment.Invoices).toBeDefined()
    expect(advancePayment.Invoices.length).toBeGreaterThanOrEqual(1)
    expect(advancePayment.Invoices[0].InvoiceNumber).toBe(invoice.InvoiceNumber)

    // Verify DAG payment receipt print data generation
    const receiptData = buildDAGPaymentReceiptPrintData(detailed, advancePayment)
    expect(receiptData.receiptNumber).toBe(`PR-${advancePayment.PaymentID}`)
    expect(receiptData.dagNumber).toBe(String(dag.ID))
    expect(receiptData.customerName).toBe("Bandara Express")
    expect(receiptData.vehicleNumber).toBe("WP-ND-8899")
    expect(receiptData.receivedAmount).toBe("LKR 5,000.00")
    expect(receiptData.invoiceReferences).toBe(invoice.InvoiceNumber)
    expect(receiptData.tenderNote).toContain("Advance payment received against DAG retreading order")

    // Render receipt template via PrintTemplateService
    const renderedReceiptHtml = printTemplateService.render("dag-payment-receipt.html", receiptData)
    expect(renderedReceiptHtml).toContain(`PR-${advancePayment.PaymentID}`)
    expect(renderedReceiptHtml).toContain("Bandara Express")
    expect(renderedReceiptHtml).toContain(invoice.InvoiceNumber)
    expect(renderedReceiptHtml).toContain("LKR 5,000.00")

    // Now collect tyre serial 1 with 11,000 take payment
    const serial = detailed.Tyres[0].Serials.find((s: any) => s.SerialNumber === "PIR-DAG-777")
    await backend.invoke("dag:sellTyres", dag.ID, {
      SerialIds: [serial.ID],
      Payment: {
        CashPayment: {
          AmountReceived: 11000,
          BalanceToReturn: 0,
        },
      },
    })

    // Fetch detailed DAG after take
    detailed = await backend.invoke("dag:getDetailedById", dag.ID)
    expect(detailed.Payments).toHaveLength(2)
    const takePayment = detailed.Payments.find((p: any) => p.PaymentID !== advancePayment.PaymentID)
    expect(takePayment).toBeDefined()
    expect(takePayment.IsAdvance).toBe(0)
    expect(takePayment.SaleLines).toHaveLength(1)
    expect(takePayment.SaleLines[0].SerialNumber).toBe("PIR-DAG-777")

    // Verify take payment receipt print data includes collected serial
    const takeReceiptData = buildDAGPaymentReceiptPrintData(detailed, takePayment)
    expect(takeReceiptData.receiptNumber).toBe(`PR-${takePayment.PaymentID}`)
    expect(takeReceiptData.receivedAmount).toBe("LKR 11,000.00")
    expect(takeReceiptData.takenSerials).toContain("PIR-DAG-777")
    expect(takeReceiptData.tenderNote).toContain("Payment received for DAG retreading")

    // Render summary receipt data
    const summaryData = buildDAGPaymentSummaryReceiptPrintData(detailed)
    expect(summaryData.summaryNumber).toBe(`DAG-${dag.ID}-PAYMENTS`)
    expect(summaryData.paymentCount).toBe("2")
    expect(summaryData.totalCost).toBe("LKR 22,000.00")
    expect(summaryData.settledTotal).toBe("LKR 16,000.00")
    expect(summaryData.balanceDue).toBe("LKR 6,000.00")
    expect(summaryData.payments).toHaveLength(2)

    const renderedSummaryHtml = printTemplateService.render(
      "dag-payment-summary-receipt.html",
      summaryData
    )
    expect(renderedSummaryHtml).toContain(`CONSOLIDATED DAG PAYMENT RECEIPT`)
    expect(renderedSummaryHtml).toContain(`DAG #${dag.ID}`)
    expect(renderedSummaryHtml).toContain(`PR-${advancePayment.PaymentID}`)
    expect(renderedSummaryHtml).toContain(`PR-${takePayment.PaymentID}`)
    expect(renderedSummaryHtml).toContain(`PIR-DAG-777`)
  })

  it("resolves invoice via invoice:getBySource, auto-invoicing on advance creation, and auto-invoicing on take", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // 1. Setup Branch & Storage Location
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-SRC-1",
      BranchName: "Auto Invoicing Branch",
    })
    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const defaultType = locationTypes[0]

    const location = await backend.invoke("storageLocations:create", {
      LocationCode: "LOC-SRC-01",
      LocationName: "Source Test Location",
      BranchId: branch.Id,
      LocationTypeId: defaultType.Id,
      Capacity: 100,
    })

    const contractor = await backend.invoke("contractors:create", {
      ContractorCode: "CONT-SRC",
      Name: "Quick Tread Workshop",
      Phone: "+94770009988",
      Address: "Kandy Road, Kelaniya",
    })

    const tyre = await backend.invoke("tyres:create", {
      Brand: "Dunlop",
      Size: "11R22.5",
      Pattern: "SP344",
      DAGCost: 14000,
      PurchasedPrice: 38000,
      ActualSellingPrice: 48000,
    })

    // Test invoice:getBySource returns null for non-existent source
    const nonExistent = await backend.invoke("invoice:getBySource", "dag", 999999)
    expect(nonExistent).toBeNull()

    // A. Test Auto-Invoicing on DAG creation with Advance Payment
    const createdWithAdvance = await backend.invoke("dag:createWithTyres", {
      Date: "2026-11-25",
      ContractorID: contractor.ID,
      Comment: "Advance auto-invoice test",
      WalkinCustomer: {
        CustomerName: "Kamal Auto Spares",
        CustomerPhone: "+94771122334",
        CustomerAddress: "Negombo Rd, Peliyagoda",
      },
      Tyres: [
        {
          TyreID: tyre.Id,
          StorageLocationID: location.Id,
          Qty: 2,
          Serials: [
            { SerialNumber: "ADV-SER-001", DAGCost: 14000 },
            { SerialNumber: "ADV-SER-002", DAGCost: 14000 },
          ],
        },
      ],
      Payment: {
        CashPayment: {
          AmountReceived: 8000,
          BalanceToReturn: 0,
        },
      },
    })

    const dag1 = createdWithAdvance.dag || createdWithAdvance
    expect(dag1.ID).toBeDefined()

    // Query invoice by source via invoice:getBySource
    const autoInvoice1 = await backend.invoke("invoice:getBySource", "dag", dag1.ID)
    expect(autoInvoice1).toBeDefined()
    expect(autoInvoice1.InvoiceID).toBeDefined()
    expect(autoInvoice1.InvoiceNumber).toMatch(/^INV-\d{4}-\d{5}$/)
    expect(autoInvoice1.SourceType).toBe("dag")
    expect(autoInvoice1.SourceID).toBe(dag1.ID)
    expect(autoInvoice1.CustomerName).toBe("Kamal Auto Spares")
    expect(autoInvoice1.Total).toBe(28000)
    expect(autoInvoice1.AmountPaid).toBe(8000)
    expect(autoInvoice1.BalanceDue).toBe(20000)
    expect(autoInvoice1.Status).toBe("par") // Partially paid
    expect(autoInvoice1.Lines).toHaveLength(2)
    expect(autoInvoice1.PaymentLinks).toHaveLength(1)
    expect(autoInvoice1.PaymentLinks[0].AmountApplied).toBe(8000)

    // B. Test Auto-Invoicing on Tyre Take when DAG was created WITHOUT advance payment
    const createdNoAdvance = await backend.invoke("dag:createWithTyres", {
      Date: "2026-11-25",
      ContractorID: contractor.ID,
      Comment: "No advance DAG - invoice on take",
      WalkinCustomer: {
        CustomerName: "Sunil Transport Service",
        CustomerPhone: "+94778899001",
        CustomerAddress: "High Level Rd, Nugegoda",
      },
      Tyres: [
        {
          TyreID: tyre.Id,
          StorageLocationID: location.Id,
          Qty: 2,
          Serials: [
            { SerialNumber: "TAKE-SER-001", DAGCost: 14000 },
            { SerialNumber: "TAKE-SER-002", DAGCost: 14000 },
          ],
        },
      ],
    })

    const dag2 = createdNoAdvance.dag || createdNoAdvance
    expect(dag2.ID).toBeDefined()

    // Verify initially NO invoice exists
    const beforeTakeInvoice = await backend.invoke("invoice:getBySource", "dag", dag2.ID)
    expect(beforeTakeInvoice).toBeNull()

    // Collect first serial with 14,000 cash payment
    const detailedDag2 = await backend.invoke("dag:getDetailedById", dag2.ID)
    const serial1 = detailedDag2.Tyres[0].Serials.find((s: any) => s.SerialNumber === "TAKE-SER-001")
    const serial2 = detailedDag2.Tyres[0].Serials.find((s: any) => s.SerialNumber === "TAKE-SER-002")

    const takeResult1 = await backend.invoke("dag:sellTyres", dag2.ID, {
      SerialIds: [serial1.ID],
      Payment: {
        CashPayment: {
          AmountReceived: 14000,
          BalanceToReturn: 0,
        },
      },
    })
    expect(takeResult1.completed).toBe(false)
    expect(takeResult1.soldCount).toBe(1)

    // Verify invoice was automatically created on first take!
    const takeInvoice1 = await backend.invoke("invoice:getBySource", "dag", dag2.ID)
    expect(takeInvoice1).toBeDefined()
    expect(takeInvoice1.InvoiceNumber).toMatch(/^INV-\d{4}-\d{5}$/)
    expect(takeInvoice1.Total).toBe(28000)
    expect(takeInvoice1.AmountPaid).toBe(14000)
    expect(takeInvoice1.BalanceDue).toBe(14000)
    expect(takeInvoice1.Status).toBe("par")
    expect(takeInvoice1.PaymentLinks).toHaveLength(1)

    // Collect second serial to complete the DAG
    const takeResult2 = await backend.invoke("dag:sellTyres", dag2.ID, {
      SerialIds: [serial2.ID],
      Payment: {
        CashPayment: {
          AmountReceived: 14000,
          BalanceToReturn: 0,
        },
      },
    })
    expect(takeResult2.completed).toBe(true)
    expect(takeResult2.soldCount).toBe(1)

    // Verify invoice is now fully settled and marked "paid"
    const finalInvoice = await backend.invoke("invoice:getBySource", "dag", dag2.ID)
    expect(finalInvoice.InvoiceID).toBe(takeInvoice1.InvoiceID) // Same invoice, idempotent
    expect(finalInvoice.Total).toBe(28000)
    expect(finalInvoice.AmountPaid).toBe(28000)
    expect(finalInvoice.BalanceDue).toBe(0)
    expect(finalInvoice.Status).toBe("paid")
    expect(finalInvoice.PaymentLinks).toHaveLength(2)
  })

  it("verifies central invoices module parity, source navigation links, and invoice details print data for DAG", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    // 1. Setup Branch, Location, Contractor, Customer, Tyre
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-INV-1",
      BranchName: "Invoicing Main Branch",
    })
    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const location = await backend.invoke("storageLocations:create", {
      LocationCode: "LOC-INV-01",
      LocationName: "Invoicing Test Rack",
      BranchId: branch.Id,
      LocationTypeId: locationTypes[0].Id,
      Capacity: 50,
    })
    const contractor = await backend.invoke("contractors:create", {
      ContractorCode: "CONT-INV",
      Name: "Apex Retreads",
      Phone: "+94771122334",
      Address: "Peliyagoda Industrial Park",
    })
    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-INV-01",
      Name: "Dharmadasa Haulage Ltd",
      Phone: "+94775566778",
      Address: "Kandy Road, Kiribathgoda",
      Email: "accounts@dharmadasa.lk",
      VatNo: "VAT-55443322",
    })
    const tyre = await backend.invoke("tyres:create", {
      Brand: "Goodyear",
      Size: "12R22.5",
      Pattern: "KMAX S",
      DAGCost: 18500,
      PurchasedPrice: 42000,
      ActualSellingPrice: 54000,
    })

    // 2. Create DAG with 2 tyres and advance payment
    const result = await backend.invoke("dag:createWithTyres", {
      CustomerID: customer.CustomerID,
      ContractorID: contractor.ID,
      Date: "2026-11-25",
      Comment: "Retread 2 steer tyres",
      Tyres: [
        {
          TyreID: tyre.Id,
          StorageLocationID: location.Id,
          Qty: 2,
          Serials: [
            { SerialNumber: "GY-DAG-01", DAGCost: 18500 },
            { SerialNumber: "GY-DAG-02", DAGCost: 18500 },
          ],
        },
      ],
      Payment: {
        CashPayment: {
          AmountReceived: 10000,
          BalanceToReturn: 0,
        },
      },
    })
    const dag = result.dag || result

    // 3. Central Invoices Module Query: invoice:getAll
    const allInvoices = await backend.invoke("invoice:getAll")
    const dagInvoice = allInvoices.find((inv: any) => inv.SourceType === "dag" && inv.SourceID === dag.ID)
    expect(dagInvoice).toBeDefined()
    expect(dagInvoice.InvoiceNumber).toMatch(/^INV-\d{4}-\d{5}$/)
    expect(dagInvoice.CustomerName).toBe("Dharmadasa Haulage Ltd")
    expect(dagInvoice.Total).toBe(37000)
    expect(dagInvoice.AmountPaid).toBe(10000)
    expect(dagInvoice.BalanceDue).toBe(27000)
    expect(dagInvoice.Status).toBe("par")

    // 4. Test Navigation Link Generator
    expect(getInvoiceSourceLink("dag", dag.ID)).toBe(`/dag/${dag.ID}`)
    expect(getInvoiceSourceLink("so", 42)).toBe("/sales-orders/42")
    expect(getInvoiceSourceLink("other_service", 99)).toBe("/other-service/99")
    expect(getInvoiceSourceLink("direct", null)).toBeNull()
    expect(SOURCE_LABELS.dag).toBe("DAG Retreading")

    // 5. Query detailed invoice
    const detailedInvoice = await backend.invoke("invoice:getById", dagInvoice.InvoiceID)
    expect(detailedInvoice.Lines).toHaveLength(2)
    expect(detailedInvoice.Lines[0].Description).toContain("DAG Retreading Goodyear 12R22.5")
    const serials = detailedInvoice.Lines.map((l: any) => l.SerialNo)
    expect(serials).toContain("GY-DAG-01")
    expect(serials).toContain("GY-DAG-02")

    // 6. Test Invoice Print Data Builder
    const printData = buildInvoicePrintData(detailedInvoice)
    expect(printData.invoiceNumber).toBe(dagInvoice.InvoiceNumber)
    expect(printData.customerName).toBe("Dharmadasa Haulage Ltd")
    expect(printData.customerVatNo).toBe("VAT-55443322")
    expect(printData.sourceType).toBe("DAG Retreading")
    expect(printData.sourceId).toBe(String(dag.ID))
    expect(printData.lines).toHaveLength(2)
    const printDescriptions = printData.lines.map((l: any) => l.description).join(" ")
    expect(printDescriptions).toContain("GY-DAG-01")
    expect(printDescriptions).toContain("GY-DAG-02")

    // 7. Test rendering invoice-details.html print template
    const renderedInvoiceHtml = printTemplateService.render("invoice-details.html", printData)
    expect(renderedInvoiceHtml).toContain(dagInvoice.InvoiceNumber)
    expect(renderedInvoiceHtml).toContain("Dharmadasa Haulage Ltd")
    expect(renderedInvoiceHtml).toContain("DAG Retreading")
    expect(renderedInvoiceHtml).toContain(`#${dag.ID}`)
    expect(renderedInvoiceHtml).toContain("GY-DAG-01")
  })

  it("executes the full end-to-end lifecycle: advance payment, contractor approval, gate pass, cost revision, partial takes with cheque and bank transfer, collection, and settlement", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    const bankDetailsRepo = require("../../backend/packages/repositories/bankDetailsRepository")
    const bank = bankDetailsRepo.createBankDetails({
      BankName: "Commercial Bank",
      AccountNumber: "1234567890",
      AccountName: "TyreMate Operations",
      Branch: "Colombo City",
    })

    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-LC-1",
      BranchName: "Lifecycle Test Branch",
    })
    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const location = await backend.invoke("storageLocations:create", {
      LocationCode: "LOC-LC-01",
      LocationName: "Lifecycle Test Rack",
      BranchId: branch.Id,
      LocationTypeId: locationTypes[0].Id,
      Capacity: 50,
    })
    const contractor = await backend.invoke("contractors:create", {
      ContractorCode: "CONT-LC",
      Name: "Dunlop Retreaders",
      Phone: "+94770003344",
      Address: "Katuwana Industrial Estate",
    })
    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-LC-01",
      Name: "Ceylon Haulage Express",
      Phone: "+94771234567",
      Address: "Peliyagoda Hub",
      Email: "ceylon.haulage@example.com",
      VatNo: "VAT-889977",
    })
    const tyre = await backend.invoke("tyres:create", {
      Brand: "Bridgestone",
      Size: "295/80R22.5",
      Pattern: "R168",
      DAGCost: 20000,
      PurchasedPrice: 45000,
      ActualSellingPrice: 58000,
    })

    // 1. Create DAG with advance cash payment
    const createRes = await backend.invoke("dag:createWithTyres", {
      CustomerID: customer.CustomerID,
      ContractorID: contractor.ID,
      Date: "2026-11-25",
      Comment: "Full lifecycle retreading run",
      Tyres: [
        {
          TyreID: tyre.Id,
          StorageLocationID: location.Id,
          Qty: 2,
          Serials: [
            { SerialNumber: "LC-SN-01", DAGCost: 20000 },
            { SerialNumber: "LC-SN-02", DAGCost: 20000 },
          ],
        },
      ],
      Payment: {
        CashPayment: {
          AmountReceived: 10000,
          BalanceToReturn: 0,
        },
      },
    })
    const dag = createRes.dag || createRes
    expect(dag.ID).toBeDefined()

    // Verify auto-invoice generated in partial state
    let inv = await backend.invoke("invoice:getBySource", "dag", dag.ID)
    expect(inv).toBeDefined()
    expect(inv.Total).toBe(40000)
    expect(inv.AmountPaid).toBe(10000)
    expect(inv.BalanceDue).toBe(30000)
    expect(inv.Status).toBe("par")

    // 2. Contractor Approval workflow
    await backend.invoke("dag:assignContractor", dag.ID, { ContractorID: contractor.ID })
    const approvals = await backend.invoke("dag:getContractorApprovals", dag.ID)
    expect(approvals.length).toBeGreaterThan(0)
    const pendingApproval = approvals[0]
    await backend.invoke("dag:updateContractorApproval", pendingApproval.ID, "approved")

    // 3. Issue Gate Pass
    const gpResult = await backend.invoke("dag:issueGatePass", dag.ID)
    expect(gpResult).toBeDefined()
    const dagAfterGp = await backend.invoke("dag:getDetailedById", dag.ID)
    expect(dagAfterGp.StatusCode).toBe("gpi")

    // 4. Update serial cost on second tyre: 20,000 -> 25,000
    const serial2 = dagAfterGp.Tyres[0].Serials.find((s: any) => s.SerialNumber === "LC-SN-02")
    const serial1 = dagAfterGp.Tyres[0].Serials.find((s: any) => s.SerialNumber === "LC-SN-01")
    expect(serial2).toBeDefined()
    expect(serial1).toBeDefined()

    await backend.invoke("dag:updateTyreSerialCost", serial2.ID, 25000)

    const dagAfterCostRevision = await backend.invoke("dag:getDetailedById", dag.ID)
    expect(dagAfterCostRevision.TotalDAGCost).toBe(45000)

    // 5. Partial take: Customer takes serial 1 (cost 20,000) paying with Cheque
    const take1Result = await backend.invoke("dag:sellTyres", dag.ID, {
      SerialIds: [serial1.ID],
      Payment: {
        ChequePayment: {
          ChequeNumber: "CHQ-889900",
          BankName: "Commercial Bank",
          ChequeDate: "2026-12-01",
          Amount: 20000,
        },
      },
    })
    expect(take1Result.success).toBe(true)
    expect(take1Result.soldCount).toBe(1)
    expect(take1Result.completed).toBe(false)

    // Cheque is pending clearance: invoice settled amount is still 10,000
    const detailedAfterTake1 = await backend.invoke("dag:getDetailedById", dag.ID)
    const chequePayment = detailedAfterTake1.Payments.find(
      (p: any) => p.PaymentTypeCode === "chq" || p.ChequeNumber === "CHQ-889900"
    )
    expect(chequePayment).toBeDefined()
    expect(chequePayment.Collected).toBe(0)

    let invAfterTake1 = await backend.invoke("invoice:getBySource", "dag", dag.ID)
    expect(invAfterTake1.AmountPaid).toBe(10000)
    expect(invAfterTake1.BalanceDue).toBe(30000)

    // 6. Cheque Collection & Clearance
    const collectRes = await backend.invoke("dag:completeChequePayment", dag.ID, chequePayment.PaymentID)
    expect(collectRes.success).toBe(true)

    // Verify invoice settlement is synchronized
    let invAfterClearance = await backend.invoke("invoice:getBySource", "dag", dag.ID)
    expect(invAfterClearance.AmountPaid).toBe(30000)
    expect(invAfterClearance.BalanceDue).toBe(10000)

    // 7. Final take: Customer takes serial 2 (cost 25,000) paying with Bank Transfer
    const take2Result = await backend.invoke("dag:sellTyres", dag.ID, {
      SerialIds: [serial2.ID],
      Payment: {
        BankTransferPayment: {
          BankDetailsID: bank.ID || bank.Id,
          Amount: 25000,
        },
      },
    })
    expect(take2Result.success).toBe(true)
    expect(take2Result.soldCount).toBe(1)
    expect(take2Result.completed).toBe(true)

    // Verify DAG is completed and payment is completed
    const finalDag = await backend.invoke("dag:getDetailedById", dag.ID)
    expect(finalDag.IsPaymentCompleted).toBe(1)
    expect(finalDag.StatusCode).toBe("cmp")

    // Verify invoice is fully settled to paid
    let finalInv = await backend.invoke("invoice:getBySource", "dag", dag.ID)
    expect(finalInv.Total).toBe(40000)
    expect(finalInv.AmountPaid).toBe(40000)
    expect(finalInv.BalanceDue).toBe(0)
    expect(finalInv.Status).toBe("paid")

    // 8. Consolidated Payment Summary Receipt
    const summaryData = buildDAGPaymentSummaryReceiptPrintData(finalDag)
    expect(summaryData.dagNumber).toBe(String(dag.ID))
    expect(summaryData.summaryNumber).toBe(`DAG-${dag.ID}-PAYMENTS`)
    expect(summaryData.paymentCount).toBe("3")
    expect(summaryData.settledTotal).toBe("LKR 55,000.00")
    expect(summaryData.balanceDue).toBe("LKR 0.00")
    expect(summaryData.payments).toHaveLength(3)

    const renderedSummary = printTemplateService.render("dag-payment-summary-receipt.html", summaryData)
    expect(renderedSummary).toContain(`DAG #${dag.ID}`)
    expect(renderedSummary).toContain("Ceylon Haulage Express")
    expect(renderedSummary).toContain("CHQ-889900")
    expect(renderedSummary).toContain("Commercial Bank")
  })

  it("handles invoice reversals: credit note generation, cancellation, and blocks payment on cancelled invoices", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)
    await backend.login()

    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-REV-1",
      BranchName: "Reversal Branch",
    })
    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const location = await backend.invoke("storageLocations:create", {
      LocationCode: "LOC-REV-01",
      LocationName: "Reversal Rack",
      BranchId: branch.Id,
      LocationTypeId: locationTypes[0].Id,
      Capacity: 50,
    })
    const contractor = await backend.invoke("contractors:create", {
      ContractorCode: "CONT-REV",
      Name: "Reversal Contractor",
      Phone: "+94770005566",
      Address: "Reversal Zone",
    })
    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-REV-01",
      Name: "Perera Freight",
      Phone: "+94774433221",
      Address: "Negombo Road",
    })
    const tyre = await backend.invoke("tyres:create", {
      Brand: "Yokohama",
      Size: "11R22.5",
      Pattern: "704R",
      DAGCost: 22000,
    })

    const createRes = await backend.invoke("dag:createWithTyres", {
      CustomerID: customer.CustomerID,
      ContractorID: contractor.ID,
      Date: "2026-11-25",
      Comment: "Cancellation test DAG",
      Tyres: [
        {
          TyreID: tyre.Id,
          StorageLocationID: location.Id,
          Qty: 1,
          Serials: [{ SerialNumber: "REV-SN-01", DAGCost: 22000 }],
        },
      ],
      Payment: {
        CashPayment: {
          AmountReceived: 5000,
          BalanceToReturn: 0,
        },
      },
    })
    const dag = createRes.dag || createRes
    const inv = await backend.invoke("invoice:getBySource", "dag", dag.ID)
    expect(inv).toBeDefined()
    expect(inv.Total).toBe(22000)

    // 1. Generate Credit Note
    const creditNote = await backend.invoke("invoice:createCreditNote", inv.InvoiceID, {
      InvoiceDate: "2026-11-25",
      Notes: "Customer requested return / adjustment on DAG retreading",
    })
    expect(creditNote).toBeDefined()
    expect(creditNote.IsCreditNote).toBe(1)
    expect(creditNote.CreditNoteOf).toBe(inv.InvoiceID)
    expect(creditNote.Total).toBe(22000)

    // Cannot credit a credit note
    await expect(
      backend.invoke("invoice:createCreditNote", creditNote.InvoiceID, {
        InvoiceDate: "2026-11-25",
        Notes: "Invalid credit note of credit note",
      }),
    ).rejects.toThrow(/Cannot raise a credit note against another credit note/)

    // Cannot record payment against a credit note
    await expect(
      backend.invoke("invoice:recordPayment", creditNote.InvoiceID, {
        Payment: {
          CashPayment: {
            AmountReceived: 5000,
            BalanceToReturn: 0,
          },
        },
      }),
    ).rejects.toThrow(/Cannot record a payment against a credit note/)

    // 2. Cancel Invoice
    const cancelledInv = await backend.invoke("invoice:cancel", inv.InvoiceID, {
      Reason: "Customer voided DAG order before processing",
    })
    expect(cancelledInv.Status).toBe("can")

    // Cannot record payment against a cancelled invoice
    await expect(
      backend.invoke("invoice:recordPayment", inv.InvoiceID, {
        Payment: {
          CashPayment: {
            AmountReceived: 5000,
            BalanceToReturn: 0,
          },
        },
      }),
    ).rejects.toThrow(/Cannot record a payment against a cancelled invoice/)

    // Cannot raise credit note against cancelled invoice
    await expect(
      backend.invoke("invoice:createCreditNote", inv.InvoiceID, {
        InvoiceDate: "2026-11-25",
        Notes: "Should fail",
      }),
    ).rejects.toThrow(/Cannot credit a cancelled invoice/)
  })

  it("enforces strict RBAC: non-admin users without invoice and DAG permissions are blocked with ForbiddenError", async () => {
    const driver = await createSqlJsDriver()
    const backend = await bootBackend(driver)

    // Seed master data as admin first
    await backend.login("admin", "1234")
    const branch = await backend.invoke("branches:create", {
      BranchCode: "BR-RBAC-1",
      BranchName: "RBAC Branch",
    })
    const locationTypes = await backend.invoke("storageLocationTypes:getAll")
    const location = await backend.invoke("storageLocations:create", {
      LocationCode: "LOC-RBAC-01",
      LocationName: "RBAC Rack",
      BranchId: branch.Id,
      LocationTypeId: locationTypes[0].Id,
      Capacity: 50,
    })

    const customer = await backend.invoke("customers:create", {
      CustomerCode: "CUST-RBAC-01",
      Name: "RBAC Test Customer",
    })
    const contractor = await backend.invoke("contractors:create", {
      ContractorCode: "CONT-RBAC",
      Name: "RBAC Contractor",
    })
    const tyre = await backend.invoke("tyres:create", {
      Brand: "Dunlop",
      Size: "10.00R20",
      Pattern: "SP571",
      DAGCost: 15000,
    })

    // Create a DAG as admin with advance payment so an invoice exists
    const createRes = await backend.invoke("dag:createWithTyres", {
      CustomerID: customer.CustomerID,
      ContractorID: contractor.ID,
      Date: "2026-11-25",
      Tyres: [
        {
          TyreID: tyre.Id,
          StorageLocationID: location.Id,
          Qty: 1,
          Serials: [{ SerialNumber: "RBAC-SN-01", DAGCost: 15000 }],
        },
      ],
      Payment: {
        CashPayment: {
          AmountReceived: 5000,
          BalanceToReturn: 0,
        },
      },
    })
    const dag = createRes.dag || createRes
    const inv = await backend.invoke("invoice:getBySource", "dag", dag.ID)
    expect(inv).toBeDefined()
    expect(inv.InvoiceID).toBeDefined()

    // Switch session to salesrep (who has only inquiry permissions)
    await backend.login("salesrep", "1234")

    // 1. SalesRep CANNOT create DAG
    await expect(
      backend.invoke("dag:createWithTyres", {
        CustomerID: customer.CustomerID,
        ContractorID: contractor.ID,
        Date: "2026-11-25",
        Tyres: [{ TyreID: tyre.Id, StorageLocationID: location.Id, Qty: 1 }],
      }),
    ).rejects.toThrow(/do not have permission.*\(dag\.create\)/)

    // 2. SalesRep CANNOT view DAG
    await expect(backend.invoke("dag:getAll")).rejects.toThrow(/do not have permission.*\(dag\.view\)/)
    await expect(backend.invoke("dag:getById", dag.ID)).rejects.toThrow(/do not have permission.*\(dag\.view\)/)

    // 3. SalesRep CANNOT view Invoices
    await expect(backend.invoke("invoice:getAll")).rejects.toThrow(/do not have permission.*\(invoice\.view\)/)
    await expect(backend.invoke("invoice:getById", inv.InvoiceID)).rejects.toThrow(/do not have permission.*\(invoice\.view\)/)

    // 4. SalesRep CANNOT create or cancel Invoices
    await expect(
      backend.invoke("invoice:cancel", inv.InvoiceID, { Reason: "Hacking" }),
    ).rejects.toThrow(/do not have permission.*\(invoice\.edit\)/)

    await expect(
      backend.invoke("invoice:createCreditNote", inv.InvoiceID, {}),
    ).rejects.toThrow(/do not have permission.*\(invoice\.create\)/)
  })
})
