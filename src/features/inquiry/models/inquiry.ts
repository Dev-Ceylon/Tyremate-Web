import type { WalkinCustomerForm as WalkinCustomerPayload } from "../../../shared/walkinCustomer/models/walkinCustomer"

export interface InquiryTyrePayload {
  TyreID: number
  Price: number
  Discount: number
  Qty: number
  IsAdminApproved?: number
}

export interface InquiryTyreRecord extends InquiryTyrePayload {
  ID: number
  InquiryID: number
  Size?: string
  Pattern?: string
  Brand?: string
  AvailableQuantity?: number
  NeedToOrderQty?: number
}

export interface InquiryPayload {
  Date?: string
  ReminderDate?: string
  CustomerID?: number | null
  WalkinCustomer?: WalkinCustomerPayload
  Notes?: string
  IsAdminApproved?: number
  ConvertedSOID?: number | null
  tyres?: InquiryTyrePayload[]
}

/**
 * Mirrors the backend Customer summary so list and detail views can render
 * registered and walk-in customers through one branch.
 */
export type InquiryCustomerSummary =
  | { IsWalkinCustomer: true; CustomerName: string } & WalkinCustomerPayload
  | {
      IsWalkinCustomer: false
      CustomerName?: string
      CustomerCode?: string
    }

export interface InquiryRecord {
  InquiryID: number
  Date: string
  CustomerID: number | null
  CustomerName?: string
  CustomerCode?: string
  IsAdminApproved: number
  Notes: string
  ConvertedSOID: number | null
  Customer?: InquiryCustomerSummary
  tyres?: InquiryTyreRecord[]
  RequestedDate?: string | null
}

export interface InquiryReminderPayload {
  InquiryID: number
  ReminderDate: string
  ReminderNote: string
  IsDone: number
}

export interface InquiryReminderRecord extends InquiryReminderPayload {
  ID: number
}