export type ViolationTypeCode = "ovmx" | "fsfo";
export type ViolationStatus = "pending" | "approved" | "rejected";

export interface PolicyViolationDOTRecord {
  Id: number;
  PolicyViolationID: number;
  DOT: string;
  OldestAvailableDOT: string;
  StorageManagerID: number;
  StorageManagerBatchID: number;
  Qty: number;
  CreatedDateTime: string;
}

export interface PolicyViolationRecord {
  Id: number;
  SoID: number;
  SoTyreID?: number | null;
  TyreID: number;
  ViolationTypeCode: string;
  ViolationTypeName?: string;
  Qty: number;
  Price: number;
  MaxDiscountAllowed?: number | null;
  AppliedDiscount?: number | null;
  DiscountExcess?: number | null;
  Details?: string | null;
  IsApproved: number;
  ApproveNote?: string | null;
  ApprovedBy?: string | null;
  ApprovedDateTime?: string | null;
  ResponsibleUser?: string | null;
  CreatedDateTime: string;
  DOTs?: PolicyViolationDOTRecord[];
}

export interface ViolationListItem {
  Id: number;
  SoID: number;
  SoTyreID?: number | null;
  TyreID: number;
  ViolationTypeCode: string;
  ViolationTypeName: string;
  Qty: number;
  Price: number;
  MaxDiscountAllowed?: number | null;
  AppliedDiscount?: number | null;
  DiscountExcess?: number | null;
  Details?: string | null;
  IsApproved: number;
  ApproveNote?: string | null;
  ApprovedBy?: string | null;
  ApprovedDateTime?: string | null;
  ResponsibleUser?: string | null;
  CreatedDateTime: string;
  DOTs?: PolicyViolationDOTRecord[];
}

export interface ViolationGroup {
  Id: number;
  SoID: number;
  SoTyreID?: number | null;
  TyreID: number;
  ViolationTypeCode: string;
  ViolationTypeName: string;
  Qty: number;
  Price: number;
  MaxDiscountAllowed?: number | null;
  AppliedDiscount?: number | null;
  DiscountExcess?: number | null;
  Details?: string | null;
  IsApproved: number;
  ApproveNote?: string | null;
  ApprovedBy?: string | null;
  ApprovedDateTime?: string | null;
  ResponsibleUser?: string | null;
  CreatedDateTime: string;
  DOTs?: PolicyViolationDOTRecord[];
}

export interface ViolationDOTDetail {
  Id: number;
  PolicyViolationID: number;
  DOT: string;
  OldestAvailableDOT: string;
  StorageManagerID: number;
  StorageManagerBatchID: number;
  Qty: number;
  CreatedDateTime: string;
}

export interface CreateViolationPayload {
  SoID: number;
  SoTyreID?: number | null;
  TyreID: number;
  ViolationTypeCode: string;
  Qty: number;
  Price: number;
  MaxDiscountAllowed?: number | null;
  AppliedDiscount?: number | null;
  DiscountExcess?: number | null;
  Details?: string | null;
  DOTs?: Array<{
    DOT: string;
    OldestAvailableDOT: string;
    StorageManagerID: number;
    StorageManagerBatchID: number;
    Qty: number;
  }>;
}

export interface ApproveViolationPayload {
  ApproveNote?: string | null;
}

export interface ViolationFilter {
  SoID?: number;
  ViolationTypeCode?: string;
  IsApproved?: number;
  Status?: string;
  FromDate?: string;
  ToDate?: string;
}