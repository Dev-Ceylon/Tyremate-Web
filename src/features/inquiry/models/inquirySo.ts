export interface LinkedSoRecord {
  SoID: number
  LinkedDate?: string | null
  Date?: string | null
  CreatedDateTime?: string | null
  IsAdminApproved?: number
  IsCompleted?: number
  IsPaymentCompleted?: number
  CustomerName?: string | null
  CustomerCode?: string | null
  TotalSale?: number
  TotalDiscount?: number
}

export interface SoLinkedInquiryRecord {
  InquiryID: number
  LinkedDate?: string | null
  Date?: string | null
  CustomerID?: number | null
  CustomerName?: string | null
  IsWalkinCustomer?: number
  IsAdminApproved?: number
  ConvertedSOID?: number | null
}