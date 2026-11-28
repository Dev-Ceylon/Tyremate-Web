import React from "react"
import type { TargetStats } from "../hooks/useSalesTargets"

interface AdminTargetStatsProps {
  stats: TargetStats
}

function formatCurrency(amount: number): string {
  return "Rs. " + Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function AdminTargetStats({ stats }: AdminTargetStatsProps) {
  const attainmentPercentage = Math.min(stats.overallAttainmentRate, 100)
  const isOverAchieved = stats.overallAttainmentRate >= 100

  return (
    <div className="tm-target-stats-grid">
      {/* Card 1: Total Targets & Status Distribution */}
      <div className="metric-card panel">
        <p className="hero-card-label">Assigned Targets</p>
        <h2 className="target-stat-value">
          {stats.totalTargets}
        </h2>
        <div className="target-stat-badges">
          <span className="status-badge status-approved" title="Achieved targets">
            {stats.achievedCount} Achieved
          </span>
          <span className="status-badge status-pending" title="In-progress targets">
            {stats.inProgressCount} Active
          </span>
          {stats.missedCount > 0 && (
            <span className="status-badge status-rejected" title="Missed targets">
              {stats.missedCount} Missed
            </span>
          )}
        </div>
      </div>

      {/* Card 2: Overall Revenue Attainment */}
      <div className="metric-card panel">
        <div className="target-stat-header">
          <p className="hero-card-label">Revenue Attainment</p>
          <span className={`target-stat-rate${isOverAchieved ? " is-achieved" : ""}`}>
            {stats.overallAttainmentRate}%
          </span>
        </div>
        <h2 className="target-stat-value-md">
          {formatCurrency(stats.totalActualAmount)}
        </h2>
        <p className="target-stat-meta">
          Target: {formatCurrency(stats.totalTargetAmount)}
        </p>
        <progress
          className={`target-stat-progress-bar${isOverAchieved ? " is-achieved" : ""}`}
          value={attainmentPercentage}
          max={100}
          aria-label="Revenue attainment percentage"
        />
      </div>

      {/* Card 3: Unit Volume Target vs Actuals */}
      <div className="metric-card panel">
        <p className="hero-card-label">Volume Target vs Actual</p>
        <h2 className="target-stat-value">
          {stats.totalActualQty.toLocaleString()}{" "}
          <span className="target-stat-unit-suffix">
            / {stats.totalTargetQty.toLocaleString()} units
          </span>
        </h2>
        <p className="target-stat-meta-sm">
          {stats.totalTargetQty > 0
            ? `${Math.round((stats.totalActualQty / stats.totalTargetQty) * 100)}% volume fulfilled`
            : "No unit quota constraints"}
        </p>
      </div>

      {/* Card 4: Top Performer */}
      <div className="metric-card panel">
        <p className="hero-card-label">Top Performer</p>
        {stats.topPerformer ? (
          <div>
            <h2 className="target-stat-value-sm">
              {stats.topPerformer.repName}
            </h2>
            <p className="target-performer-sub">
              {formatCurrency(stats.topPerformer.actualAmount)} ({stats.topPerformer.attainmentRate}%)
            </p>
          </div>
        ) : (
          <p className="target-performer-empty">
            No sales recorded yet for current targets
          </p>
        )}
      </div>
    </div>
  )
}
