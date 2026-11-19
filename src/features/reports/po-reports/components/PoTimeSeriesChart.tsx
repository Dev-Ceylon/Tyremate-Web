import React, { useState } from "react"
import type { PoTimeSeriesPoint, ChartInterval } from "../models/poReport"
import { formatLKR, formatChartPeriod } from "../../../../shared/utils/formatters"

interface PoTimeSeriesChartProps {
  points: PoTimeSeriesPoint[]
  interval: ChartInterval
  onIntervalChange: (interval: ChartInterval) => void
  dateRangeLabel: string
}

export const PoTimeSeriesChart: React.FC<PoTimeSeriesChartProps> = ({
  points,
  interval,
  onIntervalChange,
  dateRangeLabel,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<PoTimeSeriesPoint | null>(null)

  const maxTotal = Math.max(...points.map((p) => p.totalSpend), 0)
  const safeMax = maxTotal > 0 ? maxTotal : 1000

  const labelStep = points.length > 25 ? Math.ceil(points.length / 10) : points.length > 14 ? 2 : 1

  return (
    <section className="trend-panel panel report-chart-panel">
      <div className="trend-header">
        <div className="trend-title">
          <p className="section-label">Procurement Velocity / {dateRangeLabel}</p>
          <h2>Procurement Spend &amp; Volume Timeline</h2>
        </div>

        {/* Legend */}
        <div className="report-chart-legend">
          <span className="legend-item">
            <span className="legend-color tyre-color" />
            <span>Net Spend</span>
          </span>
          <span className="legend-item">
            <span className="legend-color dag-color" />
            <span>Discounts Saved</span>
          </span>
        </div>

        {/* Interval toggle */}
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

        <div className="trend-bars report-stacked-bars">
          {points.length === 0 ? (
            <div className="report-empty-chart">
              <p>No purchase order activity recorded for this period.</p>
            </div>
          ) : (
            points.map((pt, idx) => {
              const spendHeight = Math.min(100, Math.round((pt.totalSpend / safeMax) * 100))
              const discountHeight =
                pt.totalSpend > 0 ? Math.min(100, Math.round((pt.discountAmount / safeMax) * 100)) : 0

              return (
                <div
                  key={`${pt.period}-${idx}`}
                  className="trend-bar-wrap"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <div
                    className="report-multi-bar"
                    style={{ height: `${pt.totalSpend > 0 ? Math.max(spendHeight, 2) : 0}%` }}
                  >
                    <div
                      className="bar-segment tyre-segment"
                      style={{ height: "100%" }}
                    />
                    {discountHeight > 0 && (
                      <div
                        className="bar-segment dag-segment"
                        style={{ height: `${Math.min(discountHeight, 30)}%` }}
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* X-axis date labels */}
        {points.length > 0 && (
          <div className="trend-x-labels">
            {points.map((pt, idx) => {
              const isVisible = idx % labelStep === 0 || idx === points.length - 1
              return (
                <span
                  key={`label-${pt.period}-${idx}`}
                  className={`trend-x-label ${isVisible ? "" : "is-hidden"}`}
                >
                  {formatChartPeriod(pt.period, interval)}
                </span>
              )
            })}
          </div>
        )}

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div className="report-chart-tooltip panel panel-strong">
            <div className="tooltip-header">
              <strong>{hoveredPoint.period}</strong>
              <small className="text-muted">{hoveredPoint.poCount} PO{hoveredPoint.poCount === 1 ? "" : "s"}</small>
            </div>
            <div className="tooltip-row">
              <span>Tyre Units:</span>
              <strong>{hoveredPoint.tyreCount}</strong>
            </div>
            <div className="tooltip-row">
              <span>Gross Value:</span>
              <span>{formatLKR(hoveredPoint.grossSpend)}</span>
            </div>
            <div className="tooltip-row">
              <span>Discounts:</span>
              <span className="text-warning">-{formatLKR(hoveredPoint.discountAmount)}</span>
            </div>
            <div className="tooltip-total">
              <strong>Net Spend:</strong>
              <strong className="text-success">{formatLKR(hoveredPoint.totalSpend)}</strong>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
