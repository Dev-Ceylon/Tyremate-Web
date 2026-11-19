export interface ReminderRecord {
  ID: number
  ReminderTypeID: number
  Date?: string | null
  IsCompleted: number
  ReminderTypeCode: string
  ReminderTypeName: string
}

export interface ReminderPayload {
  ReminderTypeID: number
  IsCompleted?: boolean
}

export interface PendingReminderRecord {
  ID: number
  InquiryID: number
  ReminderID: number
  ReminderDate: string
  ReminderNote: string | null
  IsDone: number
  ReminderTypeID: number
  IsCompleted: number
}

export interface ReminderDetails {
  ID: number
  ReminderTypeID: number
  Date: string | null
  IsCompleted: number
  ReminderTypeCode: string
  ReminderTypeName: string
}

export interface InquiryTyre {
  ID: number
  Size: string
  Pattern: string
  Brand: string
  Price: number
  Qty: number
  Discount: number
}

export interface CustomerContact {
  PhoneNumber: string
  IsPrimary: number
}

export interface CustomerEmail {
  EmailAddress: string
  IsPrimary: number
}

export interface InquiryReminderDetails {
  InquiryID: number
  Date: string
  CustomerID: number
  CustomerName: string
  CustomerCode: string
  InquiryNotes: string | null
  IsAdminApproved: number
  ConvertedSOID: number | null
  tyres: InquiryTyre[]
  contacts: CustomerContact[]
  emails: CustomerEmail[]
}

export interface TyreExpiryReminderDetails {
  ID: number
  StorageManagerBatchID: number
  TyreID: number
  LocationID: number | null
  ReminderID: number
  DOT: string | null
  ExpiryDate: string | null
  IsDone: number
  Brand: string | null
  Size: string | null
  Pattern: string | null
  LL_SR: string | null
  PR: string | null
  SideWall: string | null
  LocationName: string | null
  BranchId: number | null
  BranchName: string | null
}

export type ReminderWithInquiryDetails = ReminderDetails & { inquiryDetails?: InquiryReminderDetails | null }

export type ReminderWithTyreExpiryDetails = ReminderDetails & { tyreExpiryDetails?: TyreExpiryReminderDetails | null }
