import type { DagPaymentPayload } from "./payment"

export type DagCustomerSummary =
  | {
      IsWalkinCustomer: true
      CustomerName: string
      CustomerPhone: string
      CustomerAddress: string
      CustomerEmail?: string | null
      VehicleNumber?: string | null
      TinNo?: string | null
      VatNo?: string | null
    }
  | {
      IsWalkinCustomer: false
      CustomerID?: number | null
      CustomerName?: string
      CustomerCode?: string
    }

export type DagPayload = {
  CustomerID?: number | null
  CustomerName?: string
  CustomerPhone?: string
  CustomerAddress?: string
  CustomerEmail?: string
  VehicleNumber?: string
  TinNo?: string
  VatNo?: string
  StatusID?: number | null
  Comment?: string | null
  Date: string
}

export type DagRecord = {
  ID: number
  CustomerID: number | null
  TotalDAGCost: number | null
  CustomerCode: string | null
  CustomerName: string
  WalkinCustomerPhone?: string | null
  IsWalkinCustomer?: number | boolean
  ContractorID: number | null
  ContractorName: string | null
  StatusID: number
  StatusCode: string
  StatusName: string
  Comment: string | null
  Date: string
  DeliveryDate: string | null
  IsPaymentCompleted: number
}

export type DagTyreSerialPayload = {
  SerialNumber: string
  DAGCost: number | null
}

export type DagTyrePayload = {
  DAGID: number
  TyreID: number
  StorageLocationID: number
  Qty: number
  Serials: DagTyreSerialPayload[]
}

export type DagTyreRecord = {
  ID: number
  DAGID: number
  TyreID: number
  StorageLocationID: number
  Qty: number
}

export type DagTyreSerialRecord = {
  ID: number
  DAGTyresID: number
  SerialNumber: string
  DAGCost: number | null
  SoldAt?: string | null
  SoldBy?: number | null
}

export type DagPaymentSaleLine = {
  ID: number
  DAGSaleID: number
  DAGTyresID: number
  DAGTyresSerialID: number
  Amount: number
  SerialNumber: string | null
  TyreCode: string | null
  TyreName: string | null
}

export type DagPaymentDetail = {
  PaymentID: number
  PaymentTypeCode: string
  PaymentTypeName: string
  Amount: number
  AmountReceived?: number
  BalanceToReturn?: number
  PaidAmount?: number
  BalanceAmount?: number
  CreatedAt?: string | null
  PaymentDate?: string | null
  ReferenceNumber?: string | null
  ChequeNumber?: string
  ChequeDate?: string
  BankName?: string
  Collected?: number
  BankDetailsID?: number
  IsAdvance?: number | boolean
  Invoices?: Array<{ InvoiceID: number; InvoiceNumber?: string | null }>
  // Receipt fields for preview/upload
  ReceiptPath?: string | null
  ReceiptEncIV?: string | null
  ReceiptEncAuthTag?: string | null
  ReceiptEncKey?: string | null
  Receipts?: Array<{
    ReceiptPath: string
    ReceiptEncIV: string
    ReceiptEncAuthTag: string
    ReceiptEncKey: string
    OriginalFileName: string | null
  }>
  SaleLines?: DagPaymentSaleLine[]
}

export type UpdateDagTyreSerialCostResult = {
  dag: DagRecord
  serial: DagTyreSerialRecord
}

export type CreateDagWithTyresPayload = DagPayload & {
  Tyres: DagTyrePayload[]
}

export type CreateDagWithTyresResult = {
  dag: DagRecord
  tyres: DagTyreRecord[]
}

export type DagGatePassPayload = {
  DAGID: number
}

export type DagGatePassRecord = DagRecord & {
  ID: number
  DAGID: number
}

export type DagGrnStatus = "none" | "partial" | "completed"

export type DagDetailedRecord = DagRecord & {
  Customer?: DagCustomerSummary
  Tyres: (DagTyreRecord & {
    TyreCode?: string
    TyreName?: string
    StorageLocationCode?: string
    StorageLocationName?: string
    SoldQty?: number
    Serials: {
      ID: number
      SerialNumber: string
      DAGCost: number | null
      SoldAt?: string | null
      SoldBy?: number | null
    }[]
  })[]
  Payments?: DagPaymentDetail[]
  TakenAmount?: number
  TakenQty?: number
  GrnStatus?: DagGrnStatus
  GrnAcceptedQty?: number
  GrnRequiredQty?: number
}

export type SellDagTyresPayload = {
  SerialIds: number[]
  Payment: DagPaymentPayload | null
}

export type SellDagTyresResult = {
  success: boolean
  saleId: number
  soldCount: number
  soldAmount: number
  completed: boolean
  dag: DagRecord
}

// Mirrors PoTyresSuppliers.IsApproved: null is pending, not a distinct status,
// so the record needs to distinguish "awaiting decision" from a real decision.
export type DagContractorApprovalStatus = "approved" | "rejected"
export type DagContractorApprovalDecision = DagContractorApprovalStatus | null

export type DagContractorAssignmentPayload = {
  ContractorID: number
}

export type DagContractorApprovalRecord = {
  ID: number
  DAGID: number
  ContractorID: number
  ContractorName: string | null
  ApprovalStatus: DagContractorApprovalDecision
  ApprovedDateTime: string | null
  CapturedBy: number | null
}

export type CompleteDagChequePaymentResult = {
  success: boolean
  dagId: number
  paymentId: number
  isPaymentCompleted: number
}
