import React from "react"
import type {
  PeriodType,
  SalesRepUser,
  SalesTargetFilter,
  TargetCategory,
} from "../models/salesTarget"
import { Icons } from "../../../shared/ui/icons/icon"

interface AdminTargetFiltersProps {
  filter: SalesTargetFilter
  onFilterChange: (newFilter: SalesTargetFilter) => void
  salesReps: SalesRepUser[]
  onOpenCreate: () => void
  onRefresh: () => void
  loading?: boolean
}

const PERIOD_OPTIONS: Array<{ value: PeriodType | ""; label: string }> = [
  { value: "", label: "All Periods" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "annually", label: "Annually" },
]

const CATEGORY_OPTIONS: Array<{ value: TargetCategory | ""; label: string }> = [
  { value: "", label: "All Categories" },
  { value: "all", label: "All Products" },
  { value: "tyre", label: "Tyres Only" },
  { value: "battery", label: "Batteries Only" },
]

export function AdminTargetFilters({
  filter,
  onFilterChange,
  salesReps,
  onOpenCreate,
  onRefresh,
  loading = false,
}: AdminTargetFiltersProps) {
  return (
    <div className="table-panel-header panel target-filters-card">
      <div className="target-filters-container">
        {/* Sales Rep Selector */}
        <div className="target-filter-item target-filter-item-rep">
          <label htmlFor="filter-rep" className="target-filter-label">
            Sales Representative
          </label>
          <select
            id="filter-rep"
            className="input select target-filter-select"
            value={filter.repId ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                repId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          >
            <option value="">All Representatives</option>
            {salesReps.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.displayName || rep.username} ({rep.roleName || "Sales Rep"})
              </option>
            ))}
          </select>
        </div>

        {/* Period Selector */}
        <div className="target-filter-item target-filter-item-period">
          <label htmlFor="filter-period" className="target-filter-label">
            Period
          </label>
          <select
            id="filter-period"
            className="input select target-filter-select"
            value={filter.periodType ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                periodType: (e.target.value as PeriodType) || undefined,
              })
            }
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selector */}
        <div className="target-filter-item target-filter-item-category">
          <label htmlFor="filter-category" className="target-filter-label">
            Product Scope
          </label>
          <select
            id="filter-category"
            className="input select target-filter-select"
            value={filter.category ?? ""}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                category: (e.target.value as TargetCategory) || undefined,
              })
            }
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Targets Only checkbox */}
        <div className="target-filter-checkbox-wrap">
          <label className="target-filter-checkbox-label">
            <input
              type="checkbox"
              checked={Boolean(filter.activeOnly)}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  activeOnly: e.target.checked ? true : undefined,
                })
              }
            />
            <span>Active periods only</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="target-filter-actions">
        <button
          type="button"
          className="secondary-action target-btn-content"
          onClick={onRefresh}
          disabled={loading}
        >
          <span>Refresh</span>
        </button>

        <button
          type="button"
          className="primary-action target-btn-content"
          onClick={onOpenCreate}
        >
          <Icons.Plus size={16} />
          <span>Assign Target</span>
        </button>
      </div>
    </div>
  )
}
