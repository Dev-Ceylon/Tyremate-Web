export interface LinkedPoRecord {
  ID: number
  LinkedDate?: string | null
  Date?: string | null
  SoID?: number | null
  Category?: string | null
  StatusID?: number | null
  StatusCode?: string | null
  StatusName?: string | null
  IsAdminApproved?: number
  IsSupplierApproved?: number
  LineCount?: number
}

export interface LinkedInquiryRecord {
  InquiryID: number
  LinkedDate?: string | null
  Date?: string | null
  CustomerID?: number | null
  CustomerName?: string | null
  IsWalkinCustomer?: number
  IsAdminApproved?: number
  IsCompleted?: number
  ConvertedSOID?: number | null
}
