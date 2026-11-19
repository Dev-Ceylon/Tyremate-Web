import React, { useState } from "react"
import { Download, Calendar, Filter, ChevronDown, RefreshCw } from "lucide-react"
import type { DatePreset } from "../models/cashFlowReport"
import { DATE_PRESET_OPTIONS } from "../constants/cashFlowReportConstants"

interface CashFlowHeaderProps {
  preset: DatePreset
  customFrom: string
  customTo: string
  onPresetChange: (preset: DatePreset) => void
  onCustomRangeApply: (from: string, to: string) => void
  onRefresh: () => void
  isRefreshing: boolean
  onExport: (type: "ledger" | "summary") => void
  isExporting: boolean
  activeView: "overview" | "ledger"
  onViewChange: (view: "overview" | "ledger") => void
}

export const CashFlowHeader: React.FC<CashFlowHeaderProps> = ({
  preset,
  customFrom,
  customTo,
  onPresetChange,
  onCustomRangeApply,
  onRefresh,
  isRefreshing,
  onExport,
  isExporting,
  activeView,
  onViewChange,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [tempFrom, setTempFrom] = useState(customFrom || new Date().toISOString().slice(0, 10))
  const [tempTo, setTempTo] = useState(customTo || new Date().toISOString().slice(0, 10))

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (tempFrom && tempTo) {
      onCustomRangeApply(tempFrom, tempTo)
    }
  }

  return (
    <section className="page-header panel">
      <div className="report-header-top">
        <div>
          <p className="eyebrow">Financial Management &amp; Treasury</p>
          <h1>Daily Cash Incoming &amp; Outgoing Report</h1>
          <p className="hero-text">
            Track daily realized cash and bank inflows, supplier restocking disbursements, customer refunds, and net treasury position.
          </p>
        </div>

        <div className="header-actions">
          {/* Preset Selector */}
          <div className="select-wrapper">
            <select
              className="report-preset-select"
              value={preset}
              onChange={(e) => onPresetChange(e.target.value as DatePreset)}
              aria-label="Select cash flow date preset"
            >
              {DATE_PRESET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="secondary-action"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Report Data"
          >
            <RefreshCw size={15} className={isRefreshing ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>

          {/* Export Menu Dropdown */}
          <div className="report-export-dropdown">
            <button
              type="button"
              className="primary-action"
              onClick={() => setShowExportMenu((prev) => !prev)}
              disabled={isExporting}
            >
              <Download size={15} />
              <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
              <ChevronDown size={14} />
            </button>

            {showExportMenu && (
              <div
                className="report-dropdown-menu panel"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  type="button"
                  className="report-dropdown-item"
                  onClick={() => {
                    setShowExportMenu(false)
                    onExport("ledger")
                  }}
                >
                  <strong>Cash Movement Ledger</strong>
                  <small>Line-by-line statement of inflows, outflows, and net impact</small>
                </button>
                <button
                  type="button"
                  className="report-dropdown-item"
                  onClick={() => {
                    setShowExportMenu(false)
                    onExport("summary")
                  }}
                >
                  <strong>Daily Treasury Summary</strong>
                  <small>KPIs, payment instrument distribution &amp; category split</small>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Bar (Shown when preset is 'custom') */}
      {preset === "custom" && (
        <form className="report-custom-bar" onSubmit={handleApplyCustom}>
          <div className="report-date-input-group">
            <Calendar size={15} className="text-muted" />
            <label htmlFor="cashflow-report-from-date">From:</label>
            <input
              id="cashflow-report-from-date"
              type="date"
              className="form-control form-control-sm"
              value={tempFrom}
              onChange={(e) => setTempFrom(e.target.value)}
              required
            />
          </div>

          <div className="report-date-input-group">
            <Calendar size={15} className="text-muted" />
            <label htmlFor="cashflow-report-to-date">To:</label>
            <input
              id="cashflow-report-to-date"
              type="date"
              className="form-control form-control-sm"
              value={tempTo}
              onChange={(e) => setTempTo(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="primary-action btn-sm">
            Apply Date Range
          </button>
        </form>
      )}

      {/* Primary Navigation Tabs: Overview vs Ledger */}
      <div className="report-view-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "overview"}
          className={`filter-tab ${activeView === "overview" ? "filter-tab-active" : ""}`}
          onClick={() => onViewChange("overview")}
        >
          <Calendar size={15} />
          <span>Treasury Overview</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "ledger"}
          className={`filter-tab ${activeView === "ledger" ? "filter-tab-active" : ""}`}
          onClick={() => onViewChange("ledger")}
        >
          <Filter size={15} />
          <span>Cash Movement Ledger</span>
        </button>
      </div>
    </section>
  )
}
