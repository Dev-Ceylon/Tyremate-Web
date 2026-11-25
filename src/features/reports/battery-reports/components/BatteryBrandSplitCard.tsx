import React from "react"
import type { BatteryBrandDistribution, BatteryApplicationDistribution } from "../models/batteryReport"
import { formatLKR } from "../../../../shared/utils/formatters"

interface BatteryBrandSplitCardProps {
  brands: BatteryBrandDistribution[]
  applications: BatteryApplicationDistribution[]
}

export const BatteryBrandSplitCard: React.FC<BatteryBrandSplitCardProps> = ({ brands, applications }) => {
  return (
    <div className="report-split-grid">
      {/* 1. Brand Breakdown */}
      <article className="panel panel-strong report-breakdown-card">
        <div className="card-header-clean">
          <div>
            <span className="eyebrow">Manufacturer Split</span>
            <h3>Battery Brands Performance</h3>
          </div>
          <span className="badge-count">{brands.length} Brands</span>
        </div>

        {brands.length === 0 ? (
          <p className="report-empty-message">No sales recorded for this period.</p>
        ) : (
          <div className="report-breakdown-list">
            {brands.map((b) => (
              <div key={b.brand} className="report-breakdown-item">
                <div className="report-breakdown-item-header">
                  <strong>{b.brand}</strong>
                  <span>{formatLKR(b.revenue)} ({b.sharePercent.toFixed(1)}%)</span>
                </div>
                <div className="report-progress-bar">
                  <div
                    className="progress-segment battery-brand-segment"
                    style={{ width: `${Math.min(100, Math.max(0, b.sharePercent))}%` }}
                    title={`${b.brand}: ${b.sharePercent.toFixed(1)}%`}
                  />
                </div>
                <div className="report-breakdown-item-meta">
                  <span>{b.unitsSold} unit{b.unitsSold === 1 ? "" : "s"} sold</span>
                  <span>{b.orderCount} order{b.orderCount === 1 ? "" : "s"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* 2. Application Breakdown */}
      <article className="panel panel-strong report-breakdown-card">
        <div className="card-header-clean">
          <div>
            <span className="eyebrow">Vehicle Segment</span>
            <h3>Battery Application Mix</h3>
          </div>
          <span className="badge-count">{applications.length} Segments</span>
        </div>

        {applications.length === 0 ? (
          <p className="report-empty-message">No applications recorded for this period.</p>
        ) : (
          <div className="report-breakdown-list">
            {applications.map((app) => (
              <div key={app.application} className="report-breakdown-item">
                <div className="report-breakdown-item-header">
                  <strong>{app.application}</strong>
                  <span>{formatLKR(app.revenue)} ({app.sharePercent.toFixed(1)}%)</span>
                </div>
                <div className="report-progress-bar">
                  <div
                    className="progress-segment battery-app-segment"
                    style={{ width: `${Math.min(100, Math.max(0, app.sharePercent))}%` }}
                    title={`${app.application}: ${app.sharePercent.toFixed(1)}%`}
                  />
                </div>
                <div className="report-breakdown-item-meta">
                  <span>{app.unitsSold} unit{app.unitsSold === 1 ? "" : "s"} sold</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
