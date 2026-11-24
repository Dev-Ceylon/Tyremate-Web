// A reserved lot/batch the customer collects against. `RemainingQty` is what is
// still collectable for this specific allocation (allocation qty minus what has
// already been handed over against it).
export type SoDeliveryAllocation = {
  AllocationID: number
  SoTyreID?: number
  SoBatteryID?: number
  StorageManagerID: number | null
  StorageManagerBatchID: number | null
  BatteryStorageManagerID?: number | null
  BatteryStorageManagerBatchID?: number | null
  LocationName?: string | null
  DOT?: string | null
  BatchCode?: string | null
  ExpiryDate?: string | null
  Price?: number
  Discount?: number
  Qty: number
  DeliveredQty: number
  RemainingQty: number
}

// Per sales-order line view of fulfilment: ordered vs. delivered vs. still to
// order, plus the allocations that make up the collectable quantity.
export type SoDeliveryProgressLine = {
  SoTyreID?: number
  SoBatteryID?: number
  TyreID?: number | null
  BatteryID?: number | null
  Brand?: string
  Size?: string
  Pattern?: string
  Model?: string
  Capacity?: string
  Voltage?: string
  OrderedQty: number
  DeliveredQty: number
  RemainingToCollect: number
  AllocatedQty: number
  RemainingCollectable: number
  ToOrderQty: number
  IsFullyDelivered: boolean
  Allocations: SoDeliveryAllocation[]
}

export type SoDeliveryProgressTotals = {
  OrderedQty: number
  DeliveredQty: number
  RemainingToCollect: number
  RemainingCollectable: number
  ToOrderQty: number
}

export type SoDeliveryProgress = {
  SoID: number
  Lines: SoDeliveryProgressLine[]
  Allocations: (SoDeliveryAllocation & { SoTyreID?: number; SoBatteryID?: number })[]
  Totals: SoDeliveryProgressTotals
  IsFullyDelivered: boolean
}

// One requested hand-over line: collect `Qty` from a specific reservation.
export type SoDeliveryLineInput = {
  SoTyreStorageAllocationID?: number
  SoBatteryStorageAllocationID?: number
  AllocationID?: number
  Qty: number
}

// The gate pass number is assigned by the service, never supplied by the
// client, so it is not part of the payload.
export type RecordSoDeliveryPayload = {
  DeliveryDate: string
  Notes?: string
  Lines: SoDeliveryLineInput[]
}

export type SoDeliveryLineRecord = {
  ID: number
  SODeliveryID: number
  SoTyreID?: number | null
  TyreID?: number | null
  SoBatteryID?: number | null
  BatteryID?: number | null
  SoTyreStorageAllocationID?: number | null
  SoBatteryStorageAllocationID?: number | null
  StorageManagerID?: number | null
  StorageManagerBatchID?: number | null
  BatteryStorageManagerID?: number | null
  BatteryStorageManagerBatchID?: number | null
  Qty: number
  Amount: number
  Brand?: string
  Size?: string
  Pattern?: string
  Model?: string
  Capacity?: string
  Voltage?: string
  LocationName?: string | null
  DOT?: string | null
  BatchCode?: string | null
  ExpiryDate?: string | null
}

// Whether the warehouse may release this hand-over. A gate pass is issued only
// once settled payments cover the cumulative value of the deliveries recorded
// up to and including this one, so `Shortfall` is what still has to be paid.
export type SoGatePassEligibility = {
  Issued: boolean
  CanIssue: boolean
  SettledAmount: number
  RequiredCoverage: number
  Shortfall: number
}

export type SoDeliveryRecord = {
  ID: number
  SoID: number
  DeliveryDate: string
  DeliveredBy?: number | null
  Notes?: string | null
  GatePassNo?: string | null
  GatePassIssuedAt?: string | null
  GatePassIssuedBy?: number | null
  GatePassPaymentOverride?: number | boolean
  GatePassPaymentOverrideShortfall?: number
  CreatedDateTime?: string
  TotalQty?: number
  Lines: SoDeliveryLineRecord[]
  GatePass?: SoGatePassEligibility
}

export type SOGatePassRecord = SoDeliveryRecord & {
  GatePassNo: string | null
  Date: string
  CustomerName: string
  CustomerCode: string | null
}
