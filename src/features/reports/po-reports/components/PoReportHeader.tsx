import React, { useState } from "react"
import { Download, Calendar, Filter, ChevronDown, RefreshCw } from "lucide-react"
import type { DatePreset } from "../models/poReport"
import { DATE_PRESET_OPTIONS } from "../constants/poReportConstants"

interface PoReportHeaderProps {
  preset: DatePreset
  customFrom: string
  customTo: string
  onPresetChange: (preset: DatePreset) => void
  onCustomRangeApply: (from: string, to: string) => void
  onRefresh: () => void
  isRefreshing: boolean
  onExport: (type: "transactions" | "summary") => void
  isExporting: boolean
  activeView: "overview" | "transactions"
  onViewChange: (view: "overview" | "transactions") => void
}

export const PoReportHeader: React.FC<PoReportHeaderProps> = ({
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
          <p className="eyebrow">Procurement &amp; Supply Chain</p>
          <h1>Purchase Order Reports</h1>
          <p className="hero-text">
            Procurement expenditure, supplier fulfillment tracking, and purchase order transactions.
          </p>
        </div>

        <div className="header-actions">
          {/* Preset Selector */}
          <div className="select-wrapper">
            <select
              className="report-preset-select"
              value={preset}
              onChange={(e) => onPresetChange(e.target.value as DatePreset)}
              aria-label="Select PO report period preset"
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
                    onExport("transactions")
                  }}
                >
                  <strong>Detailed PO Transactions</strong>
                  <small>Full ledger of purchase orders and status</small>
                </button>
                <button
                  type="button"
                  className="report-dropdown-item"
                  onClick={() => {
                    setShowExportMenu(false)
                    onExport("summary")
                  }}
                >
                  <strong>Procurement Summary</strong>
                  <small>KPIs, status distribution, suppliers &amp; tyres</small>
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
            <label htmlFor="po-report-from-date">From:</label>
            <input
              id="po-report-from-date"
              type="date"
              className="form-control form-control-sm"
              value={tempFrom}
              onChange={(e) => setTempFrom(e.target.value)}
              required
            />
          </div>

          <div className="report-date-input-group">
            <Calendar size={15} className="text-muted" />
            <label htmlFor="po-report-to-date">To:</label>
            <input
              id="po-report-to-date"
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

      {/* Primary Navigation Tabs: Overview vs Transactions Ledger */}
      <div className="report-view-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "overview"}
          className={`filter-tab ${activeView === "overview" ? "filter-tab-active" : ""}`}
          onClick={() => onViewChange("overview")}
        >
          <Calendar size={15} />
          <span>Procurement Overview</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "transactions"}
          className={`filter-tab ${activeView === "transactions" ? "filter-tab-active" : ""}`}
          onClick={() => onViewChange("transactions")}
        >
          <Filter size={15} />
          <span>PO Transaction Ledger</span>
        </button>
      </div>
    </section>
  )
}
