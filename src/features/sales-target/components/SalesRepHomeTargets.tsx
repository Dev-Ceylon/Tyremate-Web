import React from "react"
import { Link } from "@/lib/router"
import { Award, RotateCw, Target, TrendingUp } from "lucide-react"
import { useMyTargets } from "../hooks/useMyTargets"
import { MyActiveTargetCard } from "./MyActiveTargetCard"
import { LoadingState } from "../../../shared/ui/progress"
import type { PeriodType, SalesTargetRecord } from "../models/salesTarget"

export function SalesRepHomeTargets() {
  const {
    activeTargets,
    loading,
    error,
    summary,
    refresh,
  } = useMyTargets()

  // Collect only the active targets currently assigned
  const activeList: Array<{ cadence: PeriodType; title: string; target: SalesTargetRecord }> = []
  if (activeTargets.daily) {
    activeList.push({ cadence: "daily", title: "Today's Target", target: activeTargets.daily })
  }
  if (activeTargets.weekly) {
    activeList.push({ cadence: "weekly", title: "This Week's Target", target: activeTargets.weekly })
  }
  if (activeTargets.monthly) {
    activeList.push({ cadence: "monthly", title: "This Month's Target", target: activeTargets.monthly })
  }
  if (activeTargets.annually) {
    activeList.push({ cadence: "annually", title: "Annual Target", target: activeTargets.annually })
  }

  return (
    <section className="sales-rep-home-targets-card panel panel-strong">
      <div className="table-panel-header">
        <div>
          <p className="section-label">Sales Targets & Performance</p>
          <h2>My Active Quotas</h2>
          <p className="sales-rep-targets-subtitle">
            Real-time revenue tracking and quota attainment from approved sales orders.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="secondary-action target-refresh-btn"
            onClick={refresh}
            disabled={loading}
            title="Refresh active targets"
          >
            <RotateCw size={14} className={loading ? "target-spin-icon" : ""} />
            <span>Refresh</span>
          </button>
          <Link className="secondary-action" to="/my-targets">
            <span>View All Targets &rarr;</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Calculating your target progress and real-time actuals…" />
      ) : error ? (
        <div className="target-error-card">
          <p className="target-error-card-title">Error loading targets</p>
          <p className="target-error-card-desc">{error}</p>
        </div>
      ) : (
        <>
          {/* Summary Strip */}
          <div className="sales-rep-summary-strip">
            <div className="sales-rep-summary-item">
              <div className="sales-rep-summary-icon-wrap">
                <TrendingUp size={18} />
              </div>
              <div className="sales-rep-summary-content">
                <span className="sales-rep-summary-label">Monthly Attainment</span>
                <div className="sales-rep-summary-value-row">
                  <span className="sales-rep-summary-value">{summary.monthlyAttainment}%</span>
                  {summary.monthlyAttainment >= 100 ? (
                    <span className="status-badge status-approved">Target Met</span>
                  ) : summary.monthlyAttainment > 0 ? (
                    <span className="status-badge status-pending">In Progress</span>
                  ) : (
                    <span className="status-badge">Pending</span>
                  )}
                </div>
              </div>
            </div>

            <div className="sales-rep-summary-item">
              <div className="sales-rep-summary-icon-wrap">
                <Target size={18} />
              </div>
              <div className="sales-rep-summary-content">
                <span className="sales-rep-summary-label">Active Quotas</span>
                <span className="sales-rep-summary-value">{summary.activeCount}</span>
              </div>
            </div>

            <div className="sales-rep-summary-item">
              <div className="sales-rep-summary-icon-wrap">
                <Award size={18} />
              </div>
              <div className="sales-rep-summary-content">
                <span className="sales-rep-summary-label">Goals Achieved</span>
                <span className="sales-rep-summary-value">{summary.totalAchieved}</span>
              </div>
            </div>
          </div>

          {/* Active Cards Grid */}
          {activeList.length > 0 ? (
            <div className="my-targets-grid">
              {activeList.map((item) => (
                <MyActiveTargetCard
                  key={item.cadence}
                  cadence={item.cadence}
                  title={item.title}
                  target={item.target}
                />
              ))}
            </div>
          ) : (
            <div className="sales-rep-empty-targets-box">
              <div className="sales-rep-empty-icon-wrap">
                <Target size={30} />
              </div>
              <p className="sales-rep-empty-title">No Active Targets Assigned</p>
              <p className="sales-rep-empty-desc">
                Your sales manager has not assigned any active quotas for today or this month.
                New targets assigned to you will track here in real time.
              </p>
              <Link className="secondary-action" to="/my-targets">
                Check Target History
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  )
}
