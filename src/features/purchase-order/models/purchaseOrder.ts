import type { LinkedInquiryRecord } from "../../inquiry/models/inquiryPo"

export interface PoRecord {
  ID: number
  SoID?: number | null // Sales Order ID if linked
  StatusID?: number | null
  StatusCode?: string
  IsAdminApproved: number | boolean
  IsSupplierApproved: number | boolean
  Date: string
  SupplierFeedback?: boolean
  isStoragesAllocated?: boolean
  IsPOArrived?: boolean
  IsPartiallyReceived?: boolean
  TotalOrdered?: number
  TotalReceived?: number
  // Add other common PO fields as needed
}

export interface PoDetailedRecord extends PoRecord {
  // Add fields for detailed view, e.g., linked tyres, supplier info
  Tyres?: PoTyreRecord[]
  SupplierName?: string
  SupplierCode?: string
  LinkedInquiries?: LinkedInquiryRecord[]
}

export interface CreatePoPayload {
  SoID?: number | null
  InquiryID?: number | null
  InquiryIDs?: Array<number | null> | number[] | null
  IsAdminApproved?: number | boolean
  IsSupplierApproved?: number | boolean
  Date: string
  Lines?: PoLinePayload[]
}

export interface UpdateStandalonePoPayload {
  SoID?: number | null
  InquiryID?: number | null
  InquiryIDs?: Array<number | null> | number[] | null
  IsAdminApproved?: number | boolean
  IsSupplierApproved?: number | boolean
  Date: string
  Lines?: PoLinePayload[]
}

export interface PoTyreRecord {
  ID: number
  POID: number
  TyreID: number
  Price: number
  Discount: number
  Qty: number
  ReceivedQty?: number
  PendingQty?: number
  IsAdminApproved: number | boolean
  StatusID?: number | null
  StatusCode?: string
  Brand?: string
  Size?: string
  Pattern?: string
  Suppliers?: PoTyreSupplierRecord[]
  Batches?: PoTyreBatchRecord[]
  IsBatchManaged?: boolean
  LocationId?: number
  LocationCode?: string
  LocationName?: string
}

export interface PoTyreBatchPayload {
  DOT?: string | null
  Qty: number
}

export interface PoTyreBatchRecord {
  Id: number
  PoTyresID: number
  DOT: string | null
  Qty: number
  CreatedBy: string | null
  createdDate: string
}

export interface PoTyreBatchStatusRecord {
  PoTyresID: number
  TyreID: number
  Brand?: string
  Size?: string
  Pattern?: string
  Qty: number
  IsBatchManaged: boolean
  BatchQty: number
  BatchCount: number
}

export interface PoTyreSupplierRecord {
  ID: number
  PoTyresID: number
  SupplierID: number
  Qty: number
  IsApproved: number | boolean | null
  ExpectedDeliveryDate?: string | null
  ActualDeliveryDate?: string | null
  SupplierName?: string
  SupplierCode?: string
}

export interface PoLinePayload {
  TyreID: number
  Price: number
  Discount: number
  Qty: number
  Suppliers?: PoLineSupplierPayload[]
  IsAdminApproved?: number | boolean
}

export interface PoLineSupplierPayload {
  PoTyresID?: number | null
  SupplierID: number
  Qty: number
  Price?: number
  Discount?: number
  IsApproved?: number | boolean | null
  ExpectedDeliveryDate?: string | null
  ActualDeliveryDate?: string | null
}

export interface PoTyreAllocationPayload {
  POID: number
  PoTyresID: number
  LocationId: number
}

export interface PoPendingCount {
  Count: number
}
