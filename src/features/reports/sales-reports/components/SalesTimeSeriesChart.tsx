import React, { useState } from "react"
import type { TimeSeriesPoint, ChartInterval } from "../models/salesReport"
import { formatLKR, formatChartPeriod } from "../../../../shared/utils/formatters"

interface SalesTimeSeriesChartProps {
  points: TimeSeriesPoint[]
  interval: ChartInterval
  onIntervalChange: (interval: ChartInterval) => void
  dateRangeLabel: string
}

export const SalesTimeSeriesChart: React.FC<SalesTimeSeriesChartProps> = ({
  points,
  interval,
  onIntervalChange,
  dateRangeLabel,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesPoint | null>(null)

  const maxTotal = Math.max(...points.map((p) => p.totalSales), 0)
  const safeMax = maxTotal > 0 ? maxTotal : 1000

  // Label density check: show label every N points to avoid overlapping
  const labelStep = points.length > 25 ? Math.ceil(points.length / 10) : points.length > 14 ? 2 : 1

  return (
    <section className="trend-panel panel report-chart-panel">
      <div className="trend-header">
        <div className="trend-title">
          <p className="section-label">Revenue Stream Velocity / {dateRangeLabel}</p>
          <h2>Sales Trend &amp; Channel Distribution</h2>
        </div>

        {/* Legend */}
        <div className="report-chart-legend">
          <span className="legend-item">
            <span className="legend-color tyre-color" />
            <span>Tyre Sales</span>
          </span>
          <span className="legend-item">
            <span className="legend-color dag-color" />
            <span>DAG Retread</span>
          </span>
          <span className="legend-item">
            <span className="legend-color service-color" />
            <span>Bay Services</span>
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

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div className="report-chart-tooltip panel">
            <div className="tooltip-header">
              <strong>{hoveredPoint.period}</strong>
              <small>{hoveredPoint.transactionCount} transaction{hoveredPoint.transactionCount === 1 ? "" : "s"}</small>
            </div>
            <div className="tooltip-row">
              <span className="legend-color tyre-color" />
              <span>Tyres:</span>
              <strong>{formatLKR(hoveredPoint.tyreSales)}</strong>
            </div>
            <div className="tooltip-row">
              <span className="legend-color dag-color" />
              <span>DAG Retreads:</span>
              <strong>{formatLKR(hoveredPoint.dagSales)}</strong>
            </div>
            <div className="tooltip-row">
              <span className="legend-color service-color" />
              <span>Bay Services:</span>
              <strong>{formatLKR(hoveredPoint.serviceSales)}</strong>
            </div>
            <div className="tooltip-total">
              <span>Total:</span>
              <strong>{formatLKR(hoveredPoint.totalSales)}</strong>
            </div>
          </div>
        )}

        <div className="trend-bars report-stacked-bars">
          {points.length === 0 ? (
            <div className="report-empty-chart">No sales records in selected date range.</div>
          ) : (
            points.map((p) => {
              const totalHeight = safeMax > 0 ? (p.totalSales / safeMax) * 100 : 0
              const tyrePercent = p.totalSales > 0 ? (p.tyreSales / p.totalSales) * 100 : 0
              const dagPercent = p.totalSales > 0 ? (p.dagSales / p.totalSales) * 100 : 0
              const servicePercent = p.totalSales > 0 ? (p.serviceSales / p.totalSales) * 100 : 0

              return (
                <div
                  className="trend-bar-wrap"
                  key={p.period}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <div
                    className="report-multi-bar"
                    style={{ height: `${Math.max(totalHeight, p.totalSales > 0 ? 3 : 0)}%` }}
                  >
                    {p.serviceSales > 0 && (
                      <div
                        className="bar-segment service-segment"
                        style={{ height: `${servicePercent}%` }}
                      />
                    )}
                    {p.dagSales > 0 && (
                      <div
                        className="bar-segment dag-segment"
                        style={{ height: `${dagPercent}%` }}
                      />
                    )}
                    {p.tyreSales > 0 && (
                      <div
                        className="bar-segment tyre-segment"
                        style={{ height: `${tyrePercent}%` }}
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="trend-x-labels">
          {points.map((p, idx) => {
            const isVisible = idx % labelStep === 0 || idx === points.length - 1
            return (
              <span
                key={p.period}
                className={`trend-x-label ${isVisible ? "" : "is-hidden"}`}
              >
                {formatChartPeriod(p.period, interval)}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}
