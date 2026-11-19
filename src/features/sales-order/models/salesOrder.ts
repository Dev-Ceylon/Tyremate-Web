import type { PoDetailedRecord, PoRecord, PoTyreRecord } from "../../purchase-order/models/purchaseOrder"
import type { SoLinkedInquiryRecord } from "../../inquiry/models/inquirySo"
import type { SoDeliveryRecord } from "./delivery"

export type SoPayload = {
  Date: string
  IsAdminApproved?: number
  IsCompleted?: number
  IsPaymentCompleted?: number
}

export type SoRecord = {
  SoID: number
  Date: string
  IsAdminApproved: number
  IsCompleted: number
  IsPaymentCompleted: number
}

export type SoTodaySalesSummary = {
  OrderCount: number
  TotalSale: number
}

export type SoCustomerSummary =
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
      CustomerName?: string
      CustomerCode?: string
    }

export type SoPaymentReceiptMeta = {
  ID?: number
  SortOrder?: number
  ReceiptPath?: string
  ReceiptEncIV?: string
  ReceiptEncAuthTag?: string
  ReceiptEncKey?: string
  OriginalFileName?: string | null
}

export type SoPaymentRecord = {
  PaymentID?: number
  CreatedAt?: string | null
  Invoices?: Array<{
    InvoiceID: number
    InvoiceNumber?: string | null
  }>
  PaymentTypeCode: string
  PaymentTypeName: string
  Amount: number
  ReferenceNumber?: string
  PaymentDate?: string
  BankName?: string
  PaidAmount?: number
  BalanceAmount?: number
  Collected?: number | boolean
  ReceiptPath?: string
  ReceiptEncIV?: string
  ReceiptEncAuthTag?: string
  ReceiptEncKey?: string
  Receipts?: SoPaymentReceiptMeta[]
}

export type SoDetailedRecord = SoRecord & {
  Customer?: SoCustomerSummary
  CustomerName?: string
  CustomerCode?: string
  TotalSale?: number
  TotalDiscount?: number
  RemainingAmount?: number
  Tyres?: SoTyreRecord[]
  PO?: PoDetailedRecord | null
  Returns?: SoReturnTyresRecord[]
  SalesReturns?: Array<{ SalesReturnID: number; ReturnNo: string; StatusCode?: string; StatusName?: string; ReturnTypeName?: string; RequestedDate?: string; TotalQty?: number; RefundedAmount?: number }>
  Payments?: SoPaymentRecord[]
  LinkedInquiries?: SoLinkedInquiryRecord[]
  Violations?: any[]
}

export type SoCustomerPayload = {
  SoID: number
  CustomerID: number
}

export type SoCustomerRecord = {
  ID: number
  SoID: number
  CustomerID: number
}

export type SoWalkinCustomerPayload = {
  SoID: number
  CustomerName: string
  CustomerPhone: string
  CustomerAddress: string
  CustomerEmail?: string
  VehicleNumber?: string
  TinNo?: string
  VatNo?: string
}

export type SoWalkinCustomerRecord = {
  ID: number
  SoID: number
  CustomerName: string
  CustomerPhone: string
  CustomerAddress: string
  CustomerEmail?: string | null
  VehicleNumber?: string | null
  TinNo?: string | null
  VatNo?: string | null
}

export type SoTyrePayload = {
  SoID: number
  TyreID: number
  Price: number
  Discount: number
  Qty: number
  NeedToOrderQty: number
  IsAdminApproved?: number
}

export type SoTyreRecord = {
  ID: number
  SoID: number
  TyreID: number
  Price: number
  Discount: number
  Qty: number
  NeedToOrderQty: number
  IsAdminApproved: number
  Size?: string
  Pattern?: string
  Brand?: string
  returnedQty?: number
  reTurnCompleted?: number | boolean
}

export type SoReturnTyresPayload = {
  SoID: number
  SoTyreID: number
  TyreID: number
  Price: number
  Discount: number
  Qty: number
  NeedToOrderQty: number
  ReturnDate: string
  Reason?: string
  AllocationId?: number
  StorageManagerID?: number | null
  StorageManagerBatchID?: number | null
  DOT?: string | null
}

export type SoReturnTyresRecord = {
  ID: number
  SoTyreID: number
  Qty: number
  ReturnDate: string
  Reason?: string | null
  TyreID?: number
  Size?: string
  Pattern?: string
  Brand?: string
  Price?: number
  StatusId?: number | null
  SalesReturnID?: number | null
  StatusCode?: string | null
  StatusName?: string | null
}

export type PoPayload = {
  SoID: number
  IsAdminApproved?: number
  IsSupplierApproved?: number
  Date?: string
}

export type PoTyrePayload = {
  POID: number
  TyreID: number
  Price: number
  Discount: number
  Qty: number
  IsAdminApproved?: number
}

export type StorageAllocationInput = {
  StorageManagerID: number | null
  StorageManagerBatchID?: number | null
  Qty: number
  TakeNowQty?: number | null
}

export type SoTyreStorageAllocationRecord = {
  Id: number
  AllocationID?: number
  SoTyreID: number
  StorageManagerID: number | null
  StorageManagerBatchID: number | null
  Qty: number
  CreatedAt?: string
  LocationName?: string | null
  DOT?: string | null
  AvailableQty?: number
  ReturnedQty?: number
}

export type ReturnAllocationItem = {
  allocationId: number
  storageManagerId: number | null
  storageManagerBatchId: number | null
  dot: string | null
  locationName: string | null
  allocatedQty: number
  alreadyReturned: number
  returnQty: number
}

export type SalesOrderLineInput = {
  TyreID: number
  Price: number
  Discount: number
  Allocations: StorageAllocationInput[]
  NeedToOrderQty: number
  TakeNowQty?: number | null
  IsAdminApproved?: number
}

export type SalesOrderPaymentInput = {
  CashPayment: {
    PaymentTypeCode: string
    AmountReceived: number
    BalanceToReturn: number
  } | null
  ChequePayment: {
    PaymentTypeCode: string
    ChequeNumber: string
    ChequeDate: string
    BankName: string
    Amount: number
  } | null
  BankTransferPayment: {
    PaymentTypeCode: string
    BankDetailsID: number
    Amount: number
    BankName?: string
    AccountNumber?: string
    AccountName?: string
    Branch?: string
  } | null
}

export type CreateSalesOrderPayload = {
  Date: string
  InquiryID?: number
  CustomerID?: number | null
  CustomerName?: string
  CustomerPhone?: string
  CustomerAddress?: string
  CustomerEmail?: string
  VehicleNumber?: string
  TinNo?: string
  VatNo?: string
  IsAdminApproved?: number
  IsCompleted?: number
  IsPaymentCompleted?: number
  Payment?: SalesOrderPaymentInput
  Lines: SalesOrderLineInput[]
}

export type CreateSalesOrderWithAutoPOResult = {
  so: SoRecord
  customerLink: SoCustomerRecord | SoWalkinCustomerRecord
  lineItems: SoTyreRecord[]
  po: PoRecord | null
  poTyres: PoTyreRecord[]
  delivery: SoDeliveryRecord | null
}

export type CompleteSalesOrderResult = {
  success: boolean
  soId: number
  isCompleted: 1
}

export type SoWarehouseDispatchLine = {
  tyreId: number
  displayName: string
  dot: string
  storageManagerId: number | null
  qty: number
}

export type SoWarehouseDispatchSite = {
  locationId: number | null
  locationName: string
  locationCode: string
  totalQty: number
  lines: SoWarehouseDispatchLine[]
}

export type SoWarehouseDispatch = {
  soId: number
  date: string
  deliveryId?: number
  deliveryDate?: string
  gatePassNo?: string
  customerName: string
  customerCode: string
  warehouses: SoWarehouseDispatchSite[]
}
