import type { SalesReturnConditionCode, SalesReturnDispositionCode } from "../constants/salesReturnInspectionConstants"
import type { SalesReturnStatusCode } from "../constants/salesReturnStatusConstants"

export interface SalesReturnLinePayload {
  soTyreId: number
  returnedQty: number
  unitPrice?: number
  discount?: number
  returnReason?: string
  serialNo?: string | null
  allocationId: number
  storageManagerId?: number | null
  storageManagerBatchId?: number | null
}

export interface CreateSalesReturnPayload {
  soId: number
  invoiceId?: number | null
  customerId?: number | null
  walkinCustomerId?: number | null
  returnType?: string
  warrantyHandling?: string | null
  requestedBy?: number | null
  notes?: string | null
  lines: SalesReturnLinePayload[]
}

export interface SalesReturnLineInspectionUpdate {
  salesReturnLineId: number
  condition?: string | null
  disposition?: string | null
  inspected?: boolean
  approved?: boolean
  inspectionNotes?: string | null
  returnReason?: string | null
}

export interface InspectAndApprovePayload {
  salesReturnId: number
  inspectedBy?: number | null
  approvedBy?: number | null
  lines?: SalesReturnLineInspectionUpdate[]
}

export interface ReceiveToQuarantinePayload {
  salesReturnId: number
  receivedBy?: number | null
}

export interface TransferToSaleablePayload {
  salesReturnId: number
  releasedBy?: number | null
}

export interface MoveToScrapOrSupplierPayload {
  salesReturnId: number
  actionCode: string
  movedBy?: number | null
  notes?: string | null
  remarks?: string | null
}

export interface RejectSalesReturnPayload {
  salesReturnId: number
  rejectedBy?: number | null
  rejectionReason?: string | null
}

export interface SalesReturnLineRecord {
  SalesReturnLineID: number
  SalesReturnID: number
  SoTyreID: number
  TyreID: number
  Brand?: string | null
  Size?: string | null
  Pattern?: string | null
  DOT?: string | null
  SerialNo?: string | null
  ReturnedQty: number
  UnitPrice: number
  Discount?: number
  LineAmount: number
  ReturnReason?: string | null
  ConditionId?: number | null
  DispositionId?: number | null
  Inspected: number
  Approved: number
  InspectionNotes?: string | null
  AllocationID?: number | null
  StorageManagerID?: number | null
  StorageManagerBatchID?: number | null
  ConditionCode?: string | null
  ConditionName?: string | null
  DispositionCode?: string | null
  DispositionName?: string | null
}

export interface SalesReturnRecord {
  SalesReturnID: number
  ReturnNo: string
  SoID: number
  InvoiceID?: number | null
  CustomerID?: number | null
  WalkinCustomerID?: number | null
  ReturnTypeId: number
  StatusId: number
  WarrantyHandlingId?: number | null
  ExchangeSoID?: number | null
  RequestedBy?: number | null
  InspectedBy?: number | null
  ApprovedBy?: number | null
  RequestedDate?: string
  TotalQty?: number
  InspectedDate?: string | null
  ApprovedDate?: string | null
  ClosedDate?: string | null
  Notes?: string | null
  RejectionReason?: string | null
  ReturnTypeCode?: string | null
  ReturnTypeName?: string | null
  StatusCode?: SalesReturnStatusCode | null
  StatusName?: string | null
  WarrantyHandlingCode?: string | null
  WarrantyHandlingName?: string | null
}

export interface SalesReturnCreditNoteRecord {
  CreditNoteID: number
  CreditNoteNo?: string
  TotalAmount: number
  StatusCode?: SalesReturnStatusCode
  StatusName?: string
}

export interface SalesReturnRefundRecord {
  RefundID: number
  RefundNo?: string
  CreditNoteID?: number
  Amount: number
  StatusCode?: string
  StatusName?: string
}

export interface SalesReturnStockMovementRecord {
  MovementID: number
  MovementType: string
  Qty: number
  LocationType: string
}

export interface SalesReturnLineInspection {
  condition: SalesReturnConditionCode
  disposition: SalesReturnDispositionCode
  notes: string
}

export interface SalesReturnDetails {
  salesReturn: SalesReturnRecord
  lines: SalesReturnLineRecord[]
  refunds: SalesReturnRefundRecord[]
  warranties: any[]
  stockMovements: SalesReturnStockMovementRecord[]
  creditNotes?: SalesReturnCreditNoteRecord[]
}
