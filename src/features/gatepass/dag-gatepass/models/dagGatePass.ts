export type DAGGatePassPayload = {
  DAGID: number
}

export type DAGGatePassTyre = {
  ID: number
  DAGID: number
  TyreID: number
  StorageLocationID: number
  Qty: number
  // dagTyresRepository.getDAGTyresByDAGIdWithDetails aliases the TyreM columns
  // as TyreCode/TyreName (and the storage location as *Code/*Name), so these
  // must mirror the SQL aliases rather than the underlying column names.
  TyreCode: string | null
  TyreName: string | null
  StorageLocationCode: string | null
  StorageLocationName: string | null
}

export type DAGGatePassRecord = {
  ID: number
  DAGID: number
  // CustomerID is NOT NULL on DAG; ContractorID and StatusID are nullable.
  CustomerID: number
  CustomerName: string
  CustomerCode: string
  ContractorID: number | null
  ContractorName: string | null
  StatusID: number | null
  StatusName: string
  StatusCode: string
  Comment: string | null
  Date: string
  // Null until a delivery date is set from the DAG details page.
  DeliveryDate: string | null
  Tyres: DAGGatePassTyre[]
}
