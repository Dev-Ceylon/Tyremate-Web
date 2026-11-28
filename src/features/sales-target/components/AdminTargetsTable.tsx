import React from "react"
import type { SalesTargetRecord } from "../models/salesTarget"
import { Icons } from "../../../shared/ui/icons/icon"

interface AdminTargetsTableProps {
  targets: SalesTargetRecord[]
  onEdit: (target: SalesTargetRecord) => void
  onDelete: (target: SalesTargetRecord) => void
}

function formatCurrency(amount: number): string {
  return "Rs. " + Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getPeriodBadgeClass(period: string): string {
  switch (period) {
    case "daily":
      return "status-badge status-arrived"
    case "weekly":
      return "status-badge status-pending"
    case "monthly":
      return "status-badge status-completed"
    case "annually":
      return "status-badge status-approved"
    default:
      return "status-badge"
  }
}

function getStatusBadge(status: string, isAchieved: number) {
  if (isAchieved || status === "achieved") {
    return <span className="status-badge status-approved">Achieved</span>
  }
  if (status === "missed") {
    return <span className="status-badge status-rejected">Missed</span>
  }
  return <span className="status-badge status-pending">In Progress</span>
}

function getCategoryLabel(category: string) {
  switch (category) {
    case "tyre":
      return (
        <span className="target-category-badge">
          <Icons.Tyre size={14} /> Tyres
        </span>
      )
    case "battery":
      return (
        <span className="target-category-badge">
          <Icons.Battery size={14} /> Batteries
        </span>
      )
    default:
      return <span className="target-category-badge">All Products</span>
  }
}

export function AdminTargetsTable({ targets, onEdit, onDelete }: AdminTargetsTableProps) {
  if (targets.length === 0) {
    return (
      <div className="target-empty-state">
        <p className="target-empty-title">
          No sales targets found
        </p>
        <p className="target-empty-desc">
          Try clearing your filters or assign a new target to a sales representative.
        </p>
      </div>
    )
  }

  return (
    <div className="table-scroll table-scroll-wide">
      <table className="table target-table">
        <thead>
          <tr>
            <th>Representative</th>
            <th>Cadence</th>
            <th>Date Window</th>
            <th>Category</th>
            <th className="target-th-progress">Revenue Progress</th>
            <th>Volume</th>
            <th className="target-cell-center">Orders</th>
            <th className="target-cell-center">Status</th>
            <th className="target-cell-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {targets.map((t) => {
            const cappedPercent = Math.min(t.AmountPercentage, 100)
            const isAchieved = t.IsAchieved === 1 || t.Status === "achieved"
            const daysLeft = t.DaysRemaining

            return (
              <tr key={t.TargetID}>
                {/* Sales Representative */}
                <td>
                  <div className="target-rep-cell">
                    <div className="target-rep-avatar">
                      {(t.SalesRepName || t.SalesRepUsername || "R").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="target-rep-name">
                        {t.SalesRepName || t.SalesRepUsername}
                      </div>
                      <div className="target-rep-username">
                        @{t.SalesRepUsername}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Cadence */}
                <td>
                  <span className={getPeriodBadgeClass(t.PeriodType)}>
                    {t.PeriodType.charAt(0).toUpperCase() + t.PeriodType.slice(1)}
                  </span>
                </td>

                {/* Date Window */}
                <td>
                  <div className="target-date-window">
                    <div>
                      {t.StartDate} &rarr; {t.EndDate}
                    </div>
                    <div className="target-date-meta">
                      {daysLeft > 0 ? (
                        <span>{daysLeft} days remaining</span>
                      ) : daysLeft === 0 ? (
                        <span className="target-meta-ending-today">Ends today</span>
                      ) : (
                        <span className="target-meta-expired">Period ended</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Scope Category */}
                <td>
                  {getCategoryLabel(t.Category)}
                </td>

                {/* Revenue Progress & Bar */}
                <td>
                  <div className="target-progress-block">
                    <div className="target-progress-header">
                      <span className="target-progress-val">
                        {formatCurrency(t.ActualAmount)}
                      </span>
                      <span
                        className={`target-progress-rate${isAchieved ? " is-achieved" : ""}`}
                      >
                        {t.AmountPercentage}%
                      </span>
                    </div>
                    <progress
                      className={`target-table-progress-bar${isAchieved ? " is-achieved" : ""}`}
                      value={cappedPercent}
                      max={100}
                      aria-label="Revenue target percentage"
                    />
                    <div className="target-progress-meta">
                      Target: {formatCurrency(t.TargetAmount)}
                      {t.RemainingAmount > 0 && !isAchieved && (
                        <span> ({formatCurrency(t.RemainingAmount)} left)</span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Volume Progress */}
                <td>
                  {t.TargetQty != null && t.TargetQty > 0 ? (
                    <div className="target-volume-block">
                      <div className="target-volume-val">
                        {t.ActualQty} / {t.TargetQty} units
                      </div>
                      <div className="target-volume-meta">
                        {t.QtyPercentage != null ? `${t.QtyPercentage}% fulfilled` : null}
                      </div>
                    </div>
                  ) : (
                    <span className="target-volume-block target-volume-meta">
                      {t.ActualQty} units
                    </span>
                  )}
                </td>

                {/* Orders count */}
                <td className="target-cell-center">
                  <span className="target-orders-count">{t.OrderCount}</span>
                </td>

                {/* Status */}
                <td className="target-cell-center">
                  {getStatusBadge(t.Status, t.IsAchieved)}
                </td>

                {/* Action buttons */}
                <td className="target-cell-right">
                  <div className="target-row-actions">
                    <button
                      type="button"
                      className="secondary-action icon-button"
                      onClick={() => onEdit(t)}
                      title="Edit target"
                      aria-label="Edit target"
                    >
                      <Icons.Edit size={15} />
                    </button>
                    <button
                      type="button"
                      className="secondary-action icon-button target-delete-btn"
                      onClick={() => onDelete(t)}
                      title="Delete target"
                      aria-label="Delete target"
                    >
                      <Icons.Trash size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
