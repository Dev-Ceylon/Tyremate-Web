export type BatteryStorageManagerPayload = {
  BatteryId: number
  LocationID: number
  Qty?: number | null
  OrderID?: number | null
  SourceTypeId?: number | null
  SourceId?: number | null
  CreatedBy?: string | null
  BatchCode?: string | null
  MfgDate?: string | null
  ExpiryDate?: string | null
  batches?: BatteryStorageManagerBatchPayload[]
}

export type BatteryStorageManagerBatchPayload = {
  BatchCode?: string | null
  MfgDate?: string | null
  ExpiryDate?: string | null
  Qty: number
}

export type BatteryStorageManagerRecord = {
  Id: number
  BatteryId: number
  LocationID: number
  Qty: number
  OrderID: number | null
  SourceTypeId: number | null
  SourceId: number | null
  CreatedBy: string | null
  createdDate: string
}

export type BatteryStorageManagerBatchRecord = {
  Id: number
  BatteryStorageManagerID: number
  BatchCode: string | null
  MfgDate: string | null
  ExpiryDate: string | null
  Qty: number
  CreatedBy: string | null
  createdDate: string
  LocationName?: string | null
  ManufactureDate?: string | null
  DaysLeft?: number | null
}

export type BatteryStorageManagerLocationBatchRecord = {
  Id: number
  BatteryStorageManagerID: number
  LocationID: number
  BatteryId: number
  BatchCode: string | null
  MfgDate: string | null
  ExpiryDate: string | null
  Qty: number
  CreatedBy: string | null
  createdDate: string
  Brand?: string | null
  Model?: string | null
  Capacity?: string | null
  Voltage?: string | null
  Application?: string | null
  ManufactureDate?: string | null
  DaysLeft?: number | null
}

export type BatteryStorageManagerLocationRecord = BatteryStorageManagerRecord & {
  Brand?: string | null
  Model?: string | null
  Series?: string | null
  Voltage?: string | null
  Capacity?: string | null
  Technology?: string | null
  Application?: string | null
  WarrantyMonths?: number | null
  MasterBatchCode?: string | null
  SourceCode?: string | null
  batches?: BatteryStorageManagerLocationBatchRecord[]
}
