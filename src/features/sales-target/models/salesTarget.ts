export type PeriodType = "daily" | "weekly" | "monthly" | "annually"

export type TargetCategory = "all" | "tyre" | "battery"

export type TargetStatus = "achieved" | "in_progress" | "missed"

export interface SalesTargetRecord {
  TargetID: number
  SalesRepID: number
  SalesRepName: string
  SalesRepUsername: string
  PeriodType: PeriodType
  StartDate: string
  EndDate: string
  TargetAmount: number
  TargetQty: number | null
  Category: TargetCategory
  Notes: string | null
  CreatedBy: number | null
  CreatedByName: string | null
  CreatedAt: string
  UpdatedAt: string
  // Hydrated dynamic actuals & progress
  ActualAmount: number
  ActualQty: number
  RemainingAmount: number
  RemainingQty: number
  AmountPercentage: number
  QtyPercentage: number | null
  OrderCount: number
  DaysRemaining: number
  Status: TargetStatus
  IsAchieved: number
}

export interface SalesTargetPayload {
  SalesRepID: number
  PeriodType: PeriodType
  StartDate?: string
  EndDate?: string
  TargetAmount: number
  TargetQty?: number | null
  Category?: TargetCategory
  Notes?: string | null
}

export interface SalesTargetUpdatePayload {
  StartDate?: string
  EndDate?: string
  TargetAmount?: number
  TargetQty?: number | null
  Category?: TargetCategory
  Notes?: string | null
}

export interface SalesTargetFilter {
  repId?: number
  periodType?: PeriodType
  category?: TargetCategory
  activeOnly?: boolean | string
  startDate?: string
  endDate?: string
}

export interface SalesRepUser {
  id: number
  username: string
  displayName: string
  isActive: number
  roleName: string
}

export interface ActiveTargetsMap {
  daily: SalesTargetRecord | null
  weekly: SalesTargetRecord | null
  monthly: SalesTargetRecord | null
  annually: SalesTargetRecord | null
}
