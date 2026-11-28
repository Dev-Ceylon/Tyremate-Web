import React from "react"
import type { SalesTargetRecord } from "../models/salesTarget"
import { Icons } from "../../../shared/ui/icons/icon"

interface MyTargetHistoryTableProps {
  targets: SalesTargetRecord[]
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

export function MyTargetHistoryTable({ targets }: MyTargetHistoryTableProps) {
  if (targets.length === 0) {
    return (
      <div className="target-empty-state">
        <p className="target-empty-title">
          No historical targets found
        </p>
        <p className="target-empty-desc">
          Targets assigned to you will appear here once created.
        </p>
      </div>
    )
  }

  return (
    <div className="table-scroll table-scroll-wide">
      <table className="table target-table">
        <thead>
          <tr>
            <th>Cadence</th>
            <th>Date Window</th>
            <th>Category Scope</th>
            <th>Target Revenue</th>
            <th>Actual Achieved</th>
            <th className="target-th-progress">Progress</th>
            <th>Volume</th>
            <th className="target-cell-center">Orders</th>
            <th className="target-cell-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {targets.map((t) => {
            const cappedPercent = Math.min(t.AmountPercentage, 100)
            const isAchieved = t.IsAchieved === 1 || t.Status === "achieved"
            const daysLeft = t.DaysRemaining

            return (
              <tr key={t.TargetID}>
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

                {/* Category Scope */}
                <td>{getCategoryLabel(t.Category)}</td>

                {/* Target Revenue */}
                <td>
                  <span className="target-progress-val">
                    {formatCurrency(t.TargetAmount)}
                  </span>
                </td>

                {/* Actual Revenue */}
                <td>
                  <span className="target-progress-val">
                    {formatCurrency(t.ActualAmount)}
                  </span>
                </td>

                {/* Visual Progress */}
                <td>
                  <div className="target-progress-block">
                    <div className="target-progress-header">
                      <span className="target-date-meta">Attainment</span>
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
                      aria-label="Attainment progress"
                    />
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
                        {t.QtyPercentage != null ? `${t.QtyPercentage}%` : null}
                      </div>
                    </div>
                  ) : (
                    <span className="target-volume-block target-volume-meta">
                      {t.ActualQty} units
                    </span>
                  )}
                </td>

                {/* Contributing Orders */}
                <td className="target-cell-center">
                  <span className="target-orders-count">{t.OrderCount}</span>
                </td>

                {/* Status */}
                <td className="target-cell-center">
                  {getStatusBadge(t.Status, t.IsAchieved)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
