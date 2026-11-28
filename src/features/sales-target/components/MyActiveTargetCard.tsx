import React from "react"
import type { PeriodType, SalesTargetRecord } from "../models/salesTarget"
import { Icons } from "../../../shared/ui/icons/icon"

interface MyActiveTargetCardProps {
  cadence: PeriodType
  title: string
  target: SalesTargetRecord | null
}

function formatCurrency(amount: number): string {
  return "Rs. " + Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "tyre":
      return <Icons.Tyre size={13} />
    case "battery":
      return <Icons.Battery size={13} />
    default:
      return null
  }
}

function getCategoryName(category: string) {
  switch (category) {
    case "tyre":
      return "Tyres Only"
    case "battery":
      return "Batteries Only"
    default:
      return "All Products"
  }
}

export function MyActiveTargetCard({ cadence, title, target }: MyActiveTargetCardProps) {
  if (!target) {
    return (
      <div className="my-target-card panel panel-strong">
        <div className="my-target-empty-card">
          <p className="my-target-empty-cadence-title">{title}</p>
          <p className="my-target-empty-desc">
            No active {cadence} target assigned for this period.
          </p>
        </div>
      </div>
    )
  }

  const isAchieved = target.IsAchieved === 1 || target.Status === "achieved"
  const cappedPercentage = Math.min(target.AmountPercentage, 100)
  const daysLeft = target.DaysRemaining

  return (
    <div className={`my-target-card panel panel-strong${isAchieved ? " is-achieved" : ""}`}>
      {/* Header */}
      <div className="my-target-card-header">
        <div>
          <h3 className="my-target-card-cadence">{title}</h3>
          <p className="my-target-card-dates">
            {target.StartDate} &rarr; {target.EndDate}
          </p>
        </div>
        <div>
          {isAchieved ? (
            <span className="status-badge status-approved">Achieved!</span>
          ) : daysLeft > 0 ? (
            <span className="status-badge status-pending">{daysLeft} days left</span>
          ) : daysLeft === 0 ? (
            <span className="status-badge status-pending">Ends today</span>
          ) : (
            <span className="status-badge status-rejected">Ended</span>
          )}
        </div>
      </div>

      {/* Main Revenue Body */}
      <div className="my-target-card-body">
        <div className="my-target-revenue-row">
          <span className="my-target-actual-amount">
            {formatCurrency(target.ActualAmount)}
          </span>
          <span className={`my-target-percentage${isAchieved ? " is-achieved" : ""}`}>
            {target.AmountPercentage}%
          </span>
        </div>

        <p className="my-target-goal-meta">
          Target Quota: <strong>{formatCurrency(target.TargetAmount)}</strong>
        </p>

        {/* Visual Progress Bar */}
        <progress
          className={`target-stat-progress-bar${isAchieved ? " is-achieved" : ""}`}
          value={cappedPercentage}
          max={100}
          aria-label={`${title} revenue progress`}
        />

        {/* Remaining amount banner */}
        <div className={`my-target-remaining-box${isAchieved ? " is-achieved" : ""}`}>
          {isAchieved ? (
            <span>
              Goal Achieved! Surpassed by {formatCurrency(Math.abs(target.RemainingAmount))}
            </span>
          ) : (
            <span>
              {formatCurrency(target.RemainingAmount)} needed to hit target
            </span>
          )}
        </div>

        {/* Target Meta Indicators */}
        <div className="my-target-meta-row">
          <span className="my-target-pill">
            {getCategoryIcon(target.Category)}
            <span>{getCategoryName(target.Category)}</span>
          </span>

          {target.TargetQty != null && target.TargetQty > 0 ? (
            <span className="my-target-pill">
              {target.ActualQty} / {target.TargetQty} units ({target.QtyPercentage || 0}%)
            </span>
          ) : (
            <span className="my-target-pill">
              {target.ActualQty} units sold
            </span>
          )}

          <span className="my-target-pill">
            {target.OrderCount} orders
          </span>
        </div>

        {/* Admin/Manager Notes */}
        {target.Notes && (
          <div className="my-target-notes-callout">
            &ldquo;{target.Notes}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
}
