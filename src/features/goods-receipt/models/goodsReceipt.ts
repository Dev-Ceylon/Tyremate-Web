export interface GoodsReceiptBatchPayload {
  DOT?: string | null
  BatchCode?: string | null
  ReceivedQty: number
  AcceptedQty: number
}

export interface GoodsReceiptPayload {
  POID: number
  PoTyresSupplierID?: number | null
  PoBatterySupplierID?: number | null
  Category?: "tyre" | "battery"
  ReceiptDate: string
  DeliveryNoteNumber?: string | null
  DispatchedQty: number
  ReceivedQty?: number
  AcceptedQty?: number
  DamagedQty: number
  DiscrepancyReason?: string | null
  Batches?: GoodsReceiptBatchPayload[]
}

export interface GoodsReceiptBatchRecord extends GoodsReceiptBatchPayload {
  ID: number
  GoodsReceiptLineID: number
}

export interface GoodsReceiptLineRecord {
  GoodsReceiptID: number
  GRNNumber: string
  POID: number
  Category?: "tyre" | "battery"
  SupplierID: number
  SupplierName: string
  ReceiptDate: string
  DeliveryNoteNumber: string | null
  Status: "Posted"
  GoodsReceiptLineID: number
  PoTyresID?: number | null
  PoTyresSupplierID?: number | null
  PoBatteriesID?: number | null
  PoBatterySupplierID?: number | null
  LocationID: number
  LocationName?: string | null
  LocationCode?: string | null
  DispatchedQty: number
  ReceivedQty: number
  AcceptedQty: number
  DamagedQty: number
  ShortageQty: number
  OverReceiptQty: number
  DiscrepancyReason: string | null
  Brand: string
  Size?: string | null
  Pattern?: string | null
  Model?: string | null
  Capacity?: string | null
  Voltage?: string | null
  Batches: GoodsReceiptBatchRecord[]
}

export interface PendingGoodsReceiptFilters {
  POID?: number | null
  SupplierID?: number | null
  PoTyresID?: number | null
  PoBatteriesID?: number | null
  Category?: "all" | "tyre" | "battery" | null
  ExpectedFrom?: string | null
  ExpectedTo?: string | null
  OverdueOnly?: boolean
}

export interface PendingGoodsReceiptRecord {
  PoTyresSupplierID: number
  PoBatterySupplierID?: number | null
  PoTyresID?: number | null
  PoBatteriesID?: number | null
  Category?: "tyre" | "battery"
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
  LineStatusCode?: string | null
  TyreID?: number | null
  BatteryID?: number | null
  Brand: string | null
  Size: string | null
  Pattern: string | null
  Model?: string | null
  Capacity?: string | null
  Voltage?: string | null
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