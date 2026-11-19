export interface GoodsReceiptBatchPayload {
  DOT?: string | null
  ReceivedQty: number
  AcceptedQty: number
}

export interface GoodsReceiptPayload {
  POID: number
  PoTyresSupplierID: number
  ReceiptDate: string
  DeliveryNoteNumber?: string | null
  DispatchedQty: number
  DamagedQty: number
  DiscrepancyReason?: string | null
  Batches: GoodsReceiptBatchPayload[]
}

export interface GoodsReceiptBatchRecord extends GoodsReceiptBatchPayload {
  ID: number
  GoodsReceiptLineID: number
}

export interface GoodsReceiptLineRecord {
  GoodsReceiptID: number
  GRNNumber: string
  POID: number
  SupplierID: number
  SupplierName: string
  ReceiptDate: string
  DeliveryNoteNumber: string | null
  Status: "Posted"
  GoodsReceiptLineID: number
  PoTyresID: number
  PoTyresSupplierID: number
  LocationID: number
  DispatchedQty: number
  ReceivedQty: number
  AcceptedQty: number
  DamagedQty: number
  ShortageQty: number
  OverReceiptQty: number
  DiscrepancyReason: string | null
  Brand: string
  Size: string
  Pattern: string
  Batches: GoodsReceiptBatchRecord[]
}

export interface PendingGoodsReceiptFilters {
  POID?: number | null
  SupplierID?: number | null
  PoTyresID?: number | null
  ExpectedFrom?: string | null
  ExpectedTo?: string | null
  OverdueOnly?: boolean
}

export interface PendingGoodsReceiptRecord {
  PoTyresSupplierID: number
  PoTyresID: number
  AllocatedQty: number
  AcceptedToDateQty: number
  PendingQty: number
  GoodsReceiptCount: number
  SupplierID: number
  SupplierCode: string
  SupplierName: string
  IsApproved: number
  ExpectedDeliveryDate: string | null
  ActualDeliveryDate: string | null
  POID: number
  PODate: string
  POStatusID: number | null
  POStatusCode: string | null
  POIsAdminApproved: number
  POIsSupplierApproved: number
  TyreLineStatusCode: string | null
  TyreID: number
  Brand: string | null
  Size: string | null
  Pattern: string | null
  Price: number
  Discount: number
  AllocatedLocationId: number | null
  AllocatedLocationCode: string | null
  AllocatedLocationName: string | null
}

export type GoodsReceiptSource = "po" | "dag"

export interface PendingDagGoodsReceiptRecord {
  SourceStorageManagerID: number
  TyreID: number
  PendingQty: number
  DAGID: number
  QuarantineLocationID: number
  QuarantineLocationName: string | null
  QuarantineLocationCode: string | null
  BranchId: number | null
  DAGDate: string | null
  DAGDeliveryDate: string | null
  CustomerCode: string | null
  CustomerName: string | null
  Brand: string | null
  Size: string | null
  Pattern: string | null
  DestinationLocationId: number | null
  DestinationLocationCode: string | null
  DestinationLocationName: string | null
}

export interface DagGoodsReceiptPayload {
  SourceStorageManagerID: number
  DAGID: number
  ReceiptDate: string
  DeliveryNoteNumber?: string | null
  DispatchedQty: number
  ReceivedQty: number
  AcceptedQty: number
  DamagedQty: number
  DiscrepancyReason?: string | null
}

export interface DagGoodsReceiptResult {
  ID: number
  GRNNumber: string
  GoodsReceiptLineID: number
  ReceivedQty: number
  AcceptedQty: number
}