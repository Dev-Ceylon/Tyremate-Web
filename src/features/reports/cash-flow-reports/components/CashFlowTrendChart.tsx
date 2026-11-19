import React, { useState } from "react"
import type { CashFlowTimeSeriesPoint, ChartInterval } from "../models/cashFlowReport"
import { formatLKR, formatChartPeriod } from "../../../../shared/utils/formatters"

interface CashFlowTrendChartProps {
  points: CashFlowTimeSeriesPoint[]
  interval: ChartInterval
  onIntervalChange: (interval: ChartInterval) => void
  dateRangeLabel: string
}

export const CashFlowTrendChart: React.FC<CashFlowTrendChartProps> = ({
  points,
  interval,
  onIntervalChange,
  dateRangeLabel,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<CashFlowTimeSeriesPoint | null>(null)

  const maxVal = Math.max(
    ...points.map((p) => Math.max(p.totalInflow, p.totalOutflow)),
    0
  )
  const safeMax = maxVal > 0 ? maxVal : 1000

  const labelStep = points.length > 25 ? Math.ceil(points.length / 10) : points.length > 14 ? 2 : 1

  return (
    <section className="trend-panel panel report-chart-panel">
      <div className="trend-header">
        <div className="trend-title">
          <p className="section-label">Treasury Velocity / {dateRangeLabel}</p>
          <h2>Cash Inflow, Outflow &amp; Net Position Timeline</h2>
        </div>

        {/* Legend */}
        <div className="report-chart-legend">
          <span className="legend-item">
            <span className="legend-color legend-inflow" />
            <span>Cash In (Inflow)</span>
          </span>
          <span className="legend-item">
            <span className="legend-color legend-outflow" />
            <span>Cash Out (Outflow)</span>
          </span>
          <span className="legend-item">
            <span className="legend-color legend-net" />
            <span>Net Liquid Flow</span>
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
              <p>No cash flow activity recorded for this period.</p>
            </div>
          ) : (
            points.map((pt, idx) => {
              const inflowHeight = Math.min(100, Math.round((pt.totalInflow / safeMax) * 100))
              const outflowHeight = Math.min(100, Math.round((pt.totalOutflow / safeMax) * 100))

              return (
                <div
                  key={`${pt.period}-${idx}`}
                  className="trend-bar-wrap"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <div className="report-multi-bar report-multi-bar-group">
                    {/* Inflow Bar */}
                    <div
                      className="report-bar-inflow"
                      style={{ height: `${pt.totalInflow > 0 ? Math.max(inflowHeight, 3) : 0}%` }}
                      title={`Inflow: ${formatLKR(pt.totalInflow)}`}
                    />

                    {/* Outflow Bar */}
                    <div
                      className="report-bar-outflow"
                      style={{ height: `${pt.totalOutflow > 0 ? Math.max(outflowHeight, 3) : 0}%` }}
                      title={`Outflow: ${formatLKR(pt.totalOutflow)}`}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* X-Axis Labels */}
        {points.length > 0 && (
          <div className="trend-x-labels">
            {points.map((pt, idx) => {
              const isVisible = idx % labelStep === 0 || idx === points.length - 1
              return (
                <span
                  key={`x-${pt.period}-${idx}`}
                  className={`trend-x-label ${isVisible ? "" : "is-hidden"}`}
                >
                  {formatChartPeriod(pt.period, interval)}
                </span>
              )
            })}
          </div>
        )}

        {/* Hover Tooltip Box */}
        {hoveredPoint && (
          <div className="report-chart-tooltip panel">
            <strong>{hoveredPoint.period}</strong>
            <div className="tooltip-row text-success">
              <span>Cash In:</span>
              <span>{formatLKR(hoveredPoint.totalInflow)}</span>
            </div>
            <div className="tooltip-subrow">
              <small>Cash: {formatLKR(hoveredPoint.inflowCash)} | Bank: {formatLKR(hoveredPoint.inflowBank)}</small>
            </div>
            <div className="tooltip-subrow">
              <small>Cleared Cheques: {formatLKR(hoveredPoint.inflowChequeCleared)}</small>
            </div>
            {hoveredPoint.inflowChequePending > 0 && (
              <div className="tooltip-subrow text-warning">
                <small>Pending Cheques: {formatLKR(hoveredPoint.inflowChequePending)}</small>
              </div>
            )}
            <div className="tooltip-row text-danger mt-1">
              <span>Cash Out:</span>
              <span>{formatLKR(hoveredPoint.totalOutflow)}</span>
            </div>
            <div className="tooltip-subrow">
              <small>PO Spend: {formatLKR(hoveredPoint.outflowPO)} | Refunds: {formatLKR(hoveredPoint.outflowRefund)}</small>
            </div>
            <div className="tooltip-row tooltip-net mt-1">
              <span>Net Balance:</span>
              <span className={hoveredPoint.netCashFlow >= 0 ? "text-success" : "text-danger"}>
                {hoveredPoint.netCashFlow >= 0 ? "+" : ""}
                {formatLKR(hoveredPoint.netCashFlow)}
              </span>
            </div>
            <div className="tooltip-footer">
              <small>
                {hoveredPoint.inflowCount} receipts, {hoveredPoint.outflowCount} payouts
              </small>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
