export type SupplierTyreAssociation = {
  TyreID: number
  Price: number | null
  Brand?: string | null
  Size?: string | null
  Pattern?: string | null
  LL_SR?: string | null
  PR?: string | null
  SideWall?: string | null
}

export type SupplierBatteryAssociation = {
  BatteryID: number
  Price: number | null
  Brand?: string | null
  Model?: string | null
  Series?: string | null
  Voltage?: string | null
  Capacity?: string | null
  Technology?: string | null
  Application?: string | null
  WarrantyMonths?: number | null
}

export type SupplierContact = {
  PhoneNumber: string
  IsPrimary: boolean | number
}

export type SupplierEmail = {
  EmailAddress: string
  IsPrimary: boolean | number
}

export type SupplierAddress = {
  AddressType?: string | null
  AddressLine1?: string | null
  AddressLine2?: string | null
  City?: string | null
  State?: string | null
  PostalCode?: string | null
  IsPrimary: boolean | number
}

export type SupplierTypeRecord = {
  Id: number
  TypeCode: string
  TypeName: string
  Description?: string | null
  SupplierTypeCode?: string
  SupplierTypeName?: string
}

export type SupplierPayload = {
  SupplierCode: string
  Name: string
  TinNo?: string | null
  VatNo?: string | null
  SupplierTypeID?: number | null
  SupplierTypeCode?: string | null
  SupplierTypeName?: string | null
  Contacts?: SupplierContact[]
  Emails?: SupplierEmail[]
  Addresses?: SupplierAddress[]
  Tyres?: SupplierTyreAssociation[]
  Batteries?: SupplierBatteryAssociation[]
}

export type SupplierRecord = SupplierPayload & {
  SupplierID: number
  Contact?: string | null
  Address?: string | null
}
