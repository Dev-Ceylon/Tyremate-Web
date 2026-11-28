"use client"
import React from "react"
import { useAuthContext } from "../../auth/hooks/AuthProvider"
import { Navigate } from "@/lib/router"
import { useMyTargets } from "../hooks/useMyTargets"
import { MyActiveTargetCard } from "../components/MyActiveTargetCard"
import { MyTargetHistoryTable } from "../components/MyTargetHistoryTable"
import { LoadingState } from "../../../shared/ui/progress"
import type { PeriodType } from "../models/salesTarget"

const TABS: Array<{ id: PeriodType | "all"; label: string }> = [
  { id: "all", label: "All Quotas" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "annually", label: "Annually" },
]

export default function MyTargetsPage() {
  const { user } = useAuthContext()
  const isAdminOrSuperAdmin = Boolean(
    user?.roles?.some(
      (r) => Number(r.roleId) === 0 || Number(r.roleId) === 1 || r.roleName === "Admin" || r.roleName === "Super Admin"
    )
  )

  const {
    activeTargets,
    historyTargets,
    allHistoryCount,
    loading,
    error,
    summary,
    selectedCadence,
    setSelectedCadence,
    refresh,
  } = useMyTargets()

  // Administrators only assign targets and do not receive them; redirect to Admin management
  if (isAdminOrSuperAdmin) {
    return <Navigate to="/sales-targets" replace />
  }

  return (
    <main className="app-shell tm-admin">
      {/* Page Header */}
      <section className="page-header panel target-section-mb">
        <div>
          <p className="eyebrow">Personal Performance Dashboard</p>
          <h1>My Sales Targets</h1>
          <p className="hero-text">
            Track your assigned daily, weekly, monthly, and annual sales goals in real time.
            Progress updates dynamically with each approved sales order.
          </p>
        </div>
      </section>

      {/* Quick Summary Row */}
      <section className="target-section-mb">
        <div className="tm-target-stats-grid">
          <div className="metric-card panel">
            <p className="hero-card-label">Active Goals</p>
            <h2 className="target-stat-value">{summary.activeCount}</h2>
            <p className="target-stat-meta-sm">Currently tracking in progress</p>
          </div>

          <div className="metric-card panel">
            <p className="hero-card-label">This Month&apos;s Attainment</p>
            <h2 className="target-stat-value">
              {summary.monthlyAttainment}%
            </h2>
            <p className="target-stat-meta-sm">
              {summary.monthlyAttainment >= 100 ? (
                <span className="status-badge status-approved">Target Met</span>
              ) : (
                <span>In progress</span>
              )}
            </p>
          </div>

          <div className="metric-card panel">
            <p className="hero-card-label">Lifetime Goals Achieved</p>
            <h2 className="target-stat-value">{summary.totalAchieved}</h2>
            <p className="target-stat-meta-sm">Historical completed quotas</p>
          </div>

          <div className="metric-card panel">
            <p className="hero-card-label">Total Assigned Periods</p>
            <h2 className="target-stat-value">{allHistoryCount}</h2>
            <p className="target-stat-meta-sm">Across all time periods</p>
          </div>
        </div>
      </section>

      {/* Active Cadences Section */}
      <section className="target-section-mb">
        <div className="table-panel-header">
          <div>
            <p className="section-label">Active Quotas</p>
            <h2>Current Target Cadences</h2>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="secondary-action"
              onClick={refresh}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading your personal targets and calculating actuals…" />
        ) : error ? (
          <div className="target-error-card">
            <p className="target-error-card-title">Error loading targets</p>
            <p className="target-error-card-desc">{error}</p>
          </div>
        ) : (
          <div className="my-targets-grid">
            <MyActiveTargetCard
              cadence="daily"
              title="Today's Target"
              target={activeTargets.daily}
            />
            <MyActiveTargetCard
              cadence="weekly"
              title="This Week's Target"
              target={activeTargets.weekly}
            />
            <MyActiveTargetCard
              cadence="monthly"
              title="This Month's Target"
              target={activeTargets.monthly}
            />
            <MyActiveTargetCard
              cadence="annually"
              title="Annual Target"
              target={activeTargets.annually}
            />
          </div>
        )}
      </section>

      {/* Quota History Section */}
      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <div>
            <p className="section-label">Performance Archive</p>
            <h2>Historical Quota Attainment</h2>
          </div>
          <div className="header-actions">
            <span className="table-count">{historyTargets.length} records</span>
          </div>
        </div>

        {/* Cadence Filter Tabs */}
        <div className="tm-tabs" role="tablist" aria-label="Target cadence filter">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selectedCadence === tab.id}
              className="tm-tab"
              onClick={() => setSelectedCadence(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <MyTargetHistoryTable targets={historyTargets} />
      </section>
    </main>
  )
}
