import React, { useState } from "react"
import type { BatteryTimeSeriesPoint, BatteryChartInterval } from "../models/batteryReport"
import { formatLKR, formatChartPeriod } from "../../../../shared/utils/formatters"

interface BatteryTimeSeriesChartProps {
  points: BatteryTimeSeriesPoint[]
  interval: BatteryChartInterval
  onIntervalChange: (interval: BatteryChartInterval) => void
  dateRangeLabel: string
}

export const BatteryTimeSeriesChart: React.FC<BatteryTimeSeriesChartProps> = ({
  points,
  interval,
  onIntervalChange,
  dateRangeLabel,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<BatteryTimeSeriesPoint | null>(null)

  const maxTotal = Math.max(...points.map((p) => p.salesRevenue), 0)
  const safeMax = maxTotal > 0 ? maxTotal : 1000

  const labelStep = points.length > 25 ? Math.ceil(points.length / 10) : points.length > 14 ? 2 : 1

  return (
    <section className="trend-panel panel report-chart-panel">
      <div className="trend-header">
        <div className="trend-title">
          <p className="section-label">Sales Velocity / {dateRangeLabel}</p>
          <h2>Battery Sales &amp; Demand Trend</h2>
        </div>

        <div className="report-chart-legend">
          <span className="legend-item">
            <span className="legend-color battery-color" />
            <span>Battery Sales Revenue</span>
          </span>
        </div>

        <div className="range-toggle" role="group" aria-label="Chart Interval">
          <button
            type="button"
            className={interval === "day" ? "active" : ""}
            onClick={() => onIntervalChange("day")}
          >
            Daily
          </button>
          <button
            type="button"
            className={interval === "week" ? "active" : ""}
            onClick={() => onIntervalChange("week")}
          >
            Weekly
          </button>
          <button
            type="button"
            className={interval === "month" ? "active" : ""}
            onClick={() => onIntervalChange("month")}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="trend-plot report-trend-plot">
        <span className="trend-max-label">{formatLKR(safeMax, 0)}</span>

        {hoveredPoint && (
          <div className="report-chart-tooltip panel panel-strong">
            <div className="tooltip-header">
              <strong>{hoveredPoint.period}</strong>
              <small> ({hoveredPoint.orderCount} orders)</small>
            </div>
            <div className="tooltip-row">
              <span>Units Sold:</span>
              <strong>{hoveredPoint.unitsSold}</strong>
            </div>
            <div className="tooltip-row">
              <span>Revenue:</span>
              <strong>{formatLKR(hoveredPoint.salesRevenue)}</strong>
            </div>
          </div>
        )}

        <div className="trend-bars report-stacked-bars">
          {points.length === 0 ? (
            <div className="report-empty-chart">
              No battery transactions recorded for the selected date range.
            </div>
          ) : (
            points.map((point) => {
              const heightPercent = Math.min(
                100,
                Math.max(point.salesRevenue > 0 ? 3 : 0, (point.salesRevenue / safeMax) * 100)
              )

              return (
                <div
                  key={point.period}
                  className="trend-bar-wrap"
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <div
                    className="report-multi-bar"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="bar-segment battery-segment" />
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="trend-x-labels">
          {points.map((point, index) => {
            const showLabel = index % labelStep === 0 || index === points.length - 1
            return (
              <span
                key={point.period}
                className={`trend-x-label ${!showLabel ? "is-hidden" : ""}`}
              >
                {showLabel ? formatChartPeriod(point.period, interval) : ""}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}
