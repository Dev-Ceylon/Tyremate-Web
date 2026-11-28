import { describe, expect, it } from "vitest"
import {
  buildDAGPaymentReceiptPrintData,
  buildDAGPaymentSummaryReceiptPrintData,
} from "../../src/features/dag/services/dagPaymentReceiptPrintService"
import { buildInvoicePrintData } from "../../src/features/invoice/services/invoicePrintService"
import {
  getInvoiceSourceLink,
  SOURCE_LABELS,
} from "../../src/features/invoice/components/InvoiceTable"
import type { DagDetailedRecord, DagPaymentDetail } from "../../src/features/dag/models/dag"
import type { InvoiceDetailedRecord } from "../../src/features/invoice/models/invoice"

describe("DAG Invoicing & Payment Receipts Unit Tests", () => {
  const mockDag: DagDetailedRecord = {
    ID: 100,
    CustomerID: 5,
    CustomerName: "Lanka Freight Logistics",
    CustomerCode: "CUST-005",
    TotalDAGCost: 45000,
    ContractorID: 1,
    ContractorName: "Bandag Retreaders",
    StatusID: 2,
    StatusCode: "GP_ISSUED",
    StatusName: "Gate Pass Issued",
    Comment: "Regular fleet retreading",
    Date: "2026-11-25",
    DeliveryDate: "2026-12-05",
    IsPaymentCompleted: 0,
    Customer: {
      IsWalkinCustomer: false,
      CustomerID: 5,
      CustomerName: "Lanka Freight Logistics",
      CustomerCode: "CUST-005",
    },
    Tyres: [
      {
        ID: 1,
        DAGID: 100,
        TyreID: 10,
        StorageLocationID: 1,
        TyreCode: "TY-01",
        TyreName: "Bridgestone 295/80R22.5 R168",
        Qty: 2,
        Serials: [
          { ID: 101, SerialNumber: "BS-001", DAGCost: 22500, SoldAt: null },
          { ID: 102, SerialNumber: "BS-002", DAGCost: 22500, SoldAt: null },
        ],
      },
    ],
    Payments: [],
  }

  describe("DAG Payment Receipt Print Data Builder", () => {
    it("formats an Advance Cash Payment receipt with official PR number and vehicle info", () => {
      const cashAdvancePayment: DagPaymentDetail = {
        PaymentID: 201,
        PaymentTypeCode: "csh",
        PaymentTypeName: "Cash",
        Amount: 15000,
        CreatedAt: "2026-11-25T10:00:00Z",
        IsAdvance: 1,
        Invoices: [
          { InvoiceID: 50, InvoiceNumber: "INV-2026-00010" },
        ],
      }

      const printData = buildDAGPaymentReceiptPrintData(mockDag, cashAdvancePayment)

      expect(printData.receiptNumber).toBe("PR-201")
      expect(printData.customerName).toBe("Lanka Freight Logistics")
      expect(printData.customerCode).toBe("CUST-005")
      expect(printData.customerPhone).toBe("")
      expect(printData.customerAddress).toBe("")
      expect(printData.paymentMethod).toBe("Cash")
      expect(printData.receivedAmount).toBe("LKR 15,000.00")
      expect(printData.invoiceReferences).toBe("INV-2026-00010")
      expect(printData.tenderNote).toBe("Advance payment received against DAG retreading order. Thank you.")
      expect(printData.takenSerials).toBe("")
    })

    it("formats a Take Cheque Payment receipt with cheque number, bank name, and collected serials", () => {
      const chequeTakePayment: DagPaymentDetail = {
        PaymentID: 202,
        PaymentTypeCode: "chq",
        PaymentTypeName: "Cheque",
        Amount: 22500,
        ChequeNumber: "CHQ-778899",
        ReferenceNumber: "CHQ-778899",
        BankName: "Commercial Bank",
        ChequeDate: "2026-12-01",
        PaymentDate: "2026-12-01",
        Collected: 0,
        IsAdvance: 0,
        SaleLines: [
          {
            ID: 1,
            DAGSaleID: 10,
            DAGTyresID: 1,
            DAGTyresSerialID: 101,
            Amount: 22500,
            SerialNumber: "BS-001",
            TyreCode: "TY-01",
            TyreName: "Bridgestone 295/80R22.5",
          },
        ],
        Invoices: [
          { InvoiceID: 50, InvoiceNumber: "INV-2026-00010" },
        ],
      }

      const printData = buildDAGPaymentReceiptPrintData(mockDag, chequeTakePayment)

      expect(printData.receiptNumber).toBe("PR-202")
      expect(printData.paymentMethod).toBe("Cheque")
      expect(printData.receivedAmount).toBe("LKR 22,500.00")
      expect(printData.referenceNumber).toBe("CHQ-778899")
      expect(printData.bankName).toBe("Commercial Bank")
      expect(printData.takenSerials).toBe("BS-001 (TY-01 Bridgestone 295/80R22.5)")
      expect(printData.tenderNote).toContain("Cheque received subject to bank clearance")
    })

    it("formats a Bank Transfer payment receipt with bank name and account reference", () => {
      const bankTransferPayment: DagPaymentDetail = {
        PaymentID: 203,
        PaymentTypeCode: "btr",
        PaymentTypeName: "Bank Transfer",
        Amount: 30000,
        BankName: "Hatton National Bank",
        ReferenceNumber: "HNB-REF-4455",
        IsAdvance: 0,
        SaleLines: [
          {
            ID: 2,
            DAGSaleID: 11,
            DAGTyresID: 1,
            DAGTyresSerialID: 102,
            Amount: 22500,
            SerialNumber: "BS-002",
            TyreCode: "TY-01",
            TyreName: "Bridgestone 295/80R22.5",
          },
        ],
      }

      const printData = buildDAGPaymentReceiptPrintData(mockDag, bankTransferPayment)

      expect(printData.receiptNumber).toBe("PR-203")
      expect(printData.paymentMethod).toBe("Bank Transfer")
      expect(printData.receivedAmount).toBe("LKR 30,000.00")
      expect(printData.bankName).toBe("Hatton National Bank")
      expect(printData.referenceNumber).toBe("HNB-REF-4455")
      expect(printData.takenSerials).toBe("BS-002 (TY-01 Bridgestone 295/80R22.5)")
    })

    it("handles walk-in customers cleanly without crashing on missing account details", () => {
      const walkinDag: DagDetailedRecord = {
        ...mockDag,
        ID: 105,
        CustomerID: null,
        CustomerName: "Kamal Perera",
        Customer: {
          IsWalkinCustomer: true,
          CustomerName: "Kamal Perera",
          CustomerPhone: "+94719876543",
          CustomerAddress: "Kandy Road, Kelaniya",
          VehicleNumber: "WP-CAB-1234",
        },
      }

      const cashPayment: DagPaymentDetail = {
        PaymentID: 204,
        PaymentTypeCode: "csh",
        PaymentTypeName: "Cash",
        Amount: 10000,
        IsAdvance: 1,
      }

      const printData = buildDAGPaymentReceiptPrintData(walkinDag, cashPayment)
      expect(printData.customerName).toBe("Kamal Perera")
      expect(printData.customerPhone).toBe("+94719876543")
      expect(printData.customerAddress).toBe("Kandy Road, Kelaniya")
      expect(printData.vehicleNumber).toBe("WP-CAB-1234")
    })
  })

  describe("DAG Consolidated Payment Summary Print Data Builder", () => {
    it("aggregates multiple payments into a consolidated receipt with balances", () => {
      const multiPaymentDag: DagDetailedRecord = {
        ...mockDag,
        ID: 110,
        TotalDAGCost: 45000,
        Payments: [
          {
            PaymentID: 1,
            PaymentTypeCode: "csh",
            PaymentTypeName: "Cash",
            Amount: 15000,
            CreatedAt: "2026-11-25T09:00:00Z",
            IsAdvance: 1,
          },
          {
            PaymentID: 2,
            PaymentTypeCode: "chq",
            PaymentTypeName: "Cheque",
            Amount: 20000,
            CreatedAt: "2026-11-25T11:00:00Z",
            ChequeNumber: "CHQ-1122",
            BankName: "BOC",
            Collected: 1,
            IsAdvance: 0,
            SaleLines: [
              {
                ID: 1,
                DAGSaleID: 10,
                DAGTyresID: 1,
                DAGTyresSerialID: 101,
                Amount: 22500,
                SerialNumber: "BS-001",
                TyreCode: "TY-01",
                TyreName: "Bridgestone 295/80R22.5",
              },
            ],
          },
          {
            PaymentID: 3,
            PaymentTypeCode: "csh",
            PaymentTypeName: "Cash",
            Amount: 10000,
            CreatedAt: "2026-11-25T14:00:00Z",
            Collected: 1,
            IsAdvance: 0,
            SaleLines: [
              {
                ID: 2,
                DAGSaleID: 11,
                DAGTyresID: 1,
                DAGTyresSerialID: 102,
                Amount: 22500,
                SerialNumber: "BS-002",
                TyreCode: "TY-01",
                TyreName: "Bridgestone 295/80R22.5",
              },
            ],
          },
        ],
      }

      const summary = buildDAGPaymentSummaryReceiptPrintData(multiPaymentDag)

      expect(summary.summaryNumber).toBe("DAG-110-PAYMENTS")
      expect(summary.dagNumber).toBe("110")
      expect(summary.paymentCount).toBe("3")
      expect(summary.totalCost).toBe("LKR 45,000.00")
      expect(summary.settledTotal).toBe("LKR 45,000.00")
      expect(summary.balanceDue).toBe("LKR 0.00")
      expect(summary.payments).toHaveLength(3)

      expect(summary.payments[0].receiptNumber).toBe("PR-1")
      expect(summary.payments[0].method).toBe("Cash")
      expect(summary.payments[0].amount).toBe("LKR 15,000.00")
      expect(summary.payments[0].status).toBe("Settled")

      expect(summary.payments[1].receiptNumber).toBe("PR-2")
      expect(summary.payments[1].method).toBe("Cheque")
      expect(summary.payments[1].status).toBe("Cheque collected")
      expect(summary.payments[1].referenceAndInvoices).toContain("CHQ-1122")
      expect(summary.payments[1].referenceAndInvoices).toContain("Serials: BS-001")

      expect(summary.payments[2].receiptNumber).toBe("PR-3")
      expect(summary.payments[2].method).toBe("Cash")
      expect(summary.payments[2].status).toBe("Settled")
      expect(summary.payments[2].referenceAndInvoices).toContain("Serials: BS-002")
    })
  })

  describe("Invoice Print Service Data Builder", () => {
    it("maps DAG Retreading source label and formats tyre retreading line items", () => {
      const mockInvoice: InvoiceDetailedRecord = {
        InvoiceID: 77,
        InvoiceNumber: "INV-2026-00077",
        InvoiceDate: "2026-11-25",
        DueDate: "2026-12-05",
        CreatedDateTime: "2026-11-25 10:00:00",
        SourceType: "dag",
        SourceID: 100,
        CustomerID: 5,
        WalkinCustomerID: null,
        CustomerName: "Lanka Freight Logistics",
        CustomerAddress: "123 Port Road, Colombo",
        CustomerPhone: "+94771234567",
        CustomerVatNo: "VAT-112233",
        Subtotal: 45000,
        DiscountTotal: 0,
        TaxLabel: "VAT 18%",
        TaxAmount: 0,
        Total: 45000,
        AmountPaid: 25000,
        BalanceDue: 20000,
        Status: "par",
        IsCreditNote: 0,
        CreditNoteOf: null,
        Notes: "Retreading contract #45",
        VoidReason: null,
        CreatedBy: 1,
        IsOverdue: 0,
        Lines: [
          {
            InvoiceLineID: 1,
            InvoiceID: 77,
            LineType: "tyre",
            TyreID: 10,
            SerialNo: "BS-001",
            Description: "DAG Retreading Bridgestone 295/80R22.5 (R168) [Serial: BS-001]",
            Brand: "Bridgestone",
            Size: "295/80R22.5",
            Pattern: "R168",
            Qty: 1,
            UnitPrice: 22500,
            Discount: 0,
            LineTotal: 22500,
          },
          {
            InvoiceLineID: 2,
            InvoiceID: 77,
            LineType: "tyre",
            TyreID: 10,
            SerialNo: "BS-002",
            Description: "DAG Retreading Bridgestone 295/80R22.5 (R168) [Serial: BS-002]",
            Brand: "Bridgestone",
            Size: "295/80R22.5",
            Pattern: "R168",
            Qty: 1,
            UnitPrice: 22500,
            Discount: 0,
            LineTotal: 22500,
          },
        ],
        PaymentLinks: [],
        Payments: [],
        CreditNotes: [],
      }

      const printData = buildInvoicePrintData(mockInvoice)

      expect(printData.invoiceNumber).toBe("INV-2026-00077")
      expect(printData.sourceType).toBe("DAG Retreading")
      expect(printData.sourceId).toBe("100")
      expect(printData.customerName).toBe("Lanka Freight Logistics")
      expect(printData.customerVatNo).toBe("VAT-112233")
      expect(printData.lines).toHaveLength(2)
      expect(printData.lines[0].description).toContain("BS-001")
      expect(printData.lines[1].description).toContain("BS-002")
      expect(printData.total).toBe("45,000")
      expect(printData.amountPaid).toBe("25,000")
      expect(printData.balanceDue).toBe("20,000")
    })

    it("defaults walk-in customer label when CustomerName is null", () => {
      const walkinInvoice: InvoiceDetailedRecord = {
        InvoiceID: 88,
        InvoiceNumber: "INV-2026-00088",
        InvoiceDate: "2026-11-25",
        DueDate: null,
        CreatedDateTime: "2026-11-25 10:00:00",
        SourceType: "dag",
        SourceID: 105,
        CustomerID: null,
        WalkinCustomerID: 12,
        CustomerName: null,
        CustomerAddress: null,
        CustomerPhone: null,
        CustomerVatNo: null,
        Subtotal: 20000,
        DiscountTotal: 0,
        TaxLabel: null,
        TaxAmount: 0,
        Total: 20000,
        AmountPaid: 20000,
        BalanceDue: 0,
        Status: "paid",
        IsCreditNote: 0,
        CreditNoteOf: null,
        Notes: null,
        VoidReason: null,
        CreatedBy: 1,
        IsOverdue: 0,
        Lines: [],
        PaymentLinks: [],
        Payments: [],
        CreditNotes: [],
      }

      const printData = buildInvoicePrintData(walkinInvoice)
      expect(printData.customerName).toBe("Walk-in Customer")
    })
  })

  describe("Invoice Source Link Resolution & Constants", () => {
    it("generates correct internal route for each source document type", () => {
      expect(getInvoiceSourceLink("dag", 15)).toBe("/dag/15")
      expect(getInvoiceSourceLink("so", 22)).toBe("/sales-orders/22")
      expect(getInvoiceSourceLink("other_service", 7)).toBe("/other-service/7")
      expect(getInvoiceSourceLink("delivery", 9)).toBeNull()
      expect(getInvoiceSourceLink("direct", 1)).toBeNull()
      expect(getInvoiceSourceLink("dag", null)).toBeNull()
    })

    it("provides human-readable source labels", () => {
      expect(SOURCE_LABELS.dag).toBe("DAG Retreading")
      expect(SOURCE_LABELS.so).toBe("Sales Order")
      expect(SOURCE_LABELS.other_service).toBe("Other Service")
      expect(SOURCE_LABELS.delivery).toBe("Delivery")
      expect(SOURCE_LABELS.direct).toBe("Direct")
    })
  })
})
