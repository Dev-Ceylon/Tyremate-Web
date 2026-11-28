import React from "react"
import {
  Calendar,
  ChevronDown,
  Layers,
  Plus,
  RotateCw,
  User,
  X,
} from "lucide-react"
import type {
  PeriodType,
  SalesRepUser,
  SalesTargetFilter,
  TargetCategory,
} from "../models/salesTarget"

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
  const hasActiveFilters = Boolean(
    filter.repId || filter.periodType || filter.category || filter.activeOnly
  )

  return (
    <div className="target-filters-card">
      <div className="target-filters-container">
        {/* Sales Rep Selector */}
        <div className="target-filter-item target-filter-item-rep">
          <label htmlFor="filter-rep" className="target-filter-label">
            Sales Representative
          </label>
          <div className="target-filter-input-wrap">
            <User size={15} className="target-input-icon" />
            <select
              id="filter-rep"
              className="target-filter-select"
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
            <ChevronDown size={14} className="target-select-chevron" />
          </div>
        </div>

        {/* Period Selector */}
        <div className="target-filter-item target-filter-item-period">
          <label htmlFor="filter-period" className="target-filter-label">
            Period
          </label>
          <div className="target-filter-input-wrap">
            <Calendar size={15} className="target-input-icon" />
            <select
              id="filter-period"
              className="target-filter-select"
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
            <ChevronDown size={14} className="target-select-chevron" />
          </div>
        </div>

        {/* Category Selector */}
        <div className="target-filter-item target-filter-item-category">
          <label htmlFor="filter-category" className="target-filter-label">
            Product Scope
          </label>
          <div className="target-filter-input-wrap">
            <Layers size={15} className="target-input-icon" />
            <select
              id="filter-category"
              className="target-filter-select"
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
            <ChevronDown size={14} className="target-select-chevron" />
          </div>
        </div>

        {/* Active Targets Only Toggle */}
        <div className="target-filter-item">
          <button
            type="button"
            className={`target-toggle-btn${filter.activeOnly ? " is-active" : ""}`}
            onClick={() =>
              onFilterChange({
                ...filter,
                activeOnly: filter.activeOnly ? undefined : true,
              })
            }
            title="Filter active periods only"
          >
            <span className="target-toggle-indicator" />
            <span>Active periods only</span>
          </button>
        </div>

        {/* Clear Filters Reset Button */}
        {hasActiveFilters && (
          <div className="target-filter-item">
            <button
              type="button"
              className="target-clear-btn"
              onClick={() => onFilterChange({})}
              title="Clear all filters"
            >
              <X size={13} />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="target-filter-actions">
        <button
          type="button"
          className="target-refresh-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh targets"
        >
          <RotateCw size={14} className={loading ? "target-spin-icon" : ""} />
          <span>Refresh</span>
        </button>

        <button
          type="button"
          className="target-assign-btn"
          onClick={onOpenCreate}
          title="Assign a new target"
        >
          <Plus size={16} strokeWidth={2.2} />
          <span>Assign Target</span>
        </button>
      </div>
    </div>
  )
}
