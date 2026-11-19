import React, { useState } from "react"
import { Download, Calendar, Filter, ChevronDown, RefreshCw } from "lucide-react"
import type { DatePreset } from "../models/salesReport"
import { DATE_PRESET_OPTIONS } from "../constants/salesReportConstants"

interface SalesReportHeaderProps {
  preset: DatePreset
  customFrom: string
  customTo: string
  onPresetChange: (preset: DatePreset) => void
  onCustomRangeApply: (from: string, to: string) => void
  onRefresh: () => void
  isRefreshing: boolean
  onExport: (type: "transactions" | "summary" | "top_products") => void
  isExporting: boolean
  activeView: "overview" | "transactions"
  onViewChange: (view: "overview" | "transactions") => void
}

export const SalesReportHeader: React.FC<SalesReportHeaderProps> = ({
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
          <p className="eyebrow">Analytics &amp; Intelligence</p>
          <h1>Sales Reports</h1>
          <p className="hero-text">
            Financial performance, multi-channel revenue analysis, and payment settlement ledgers.
          </p>
        </div>

        <div className="header-actions">
          {/* Preset Selector */}
          <div className="select-wrapper">
            <select
              className="report-preset-select"
              value={preset}
              onChange={(e) => onPresetChange(e.target.value as DatePreset)}
              aria-label="Select report period preset"
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
                  <strong>Detailed Transactions CSV</strong>
                  <small>Full sales order, DAG, and workshop service ledger</small>
                </button>
                <button
                  type="button"
                  className="report-dropdown-item"
                  onClick={() => {
                    setShowExportMenu(false)
                    onExport("summary")
                  }}
                >
                  <strong>Executive Summary CSV</strong>
                  <small>High-level financial KPIs, channels, and payment breakdown</small>
                </button>
                <button
                  type="button"
                  className="report-dropdown-item"
                  onClick={() => {
                    setShowExportMenu(false)
                    onExport("top_products")
                  }}
                >
                  <strong>Top Selling Products CSV</strong>
                  <small>Tyre sizes, retreads, and workshop consumables</small>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker bar (when Custom is selected) */}
      {preset === "custom" && (
        <form onSubmit={handleApplyCustom} className="report-custom-date-bar">
          <div className="report-date-field">
            <label htmlFor="report-from-date">From Date:</label>
            <input
              id="report-from-date"
              type="date"
              className="report-date-input"
              value={tempFrom}
              onChange={(e) => setTempFrom(e.target.value)}
              required
            />
          </div>
          <div className="report-date-field">
            <label htmlFor="report-to-date">To Date:</label>
            <input
              id="report-to-date"
              type="date"
              className="report-date-input"
              value={tempTo}
              onChange={(e) => setTempTo(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="primary-action">
            <Filter size={14} />
            Apply Filter
          </button>
        </form>
      )}

      {/* Navigation View Switcher (Overview vs Full Transactions Ledger) */}
      <div className="report-view-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "overview"}
          className={`filter-tab ${activeView === "overview" ? "filter-tab-active" : ""}`}
          onClick={() => onViewChange("overview")}
        >
          <Calendar size={15} />
          <span>Overview &amp; Visual Analytics</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "transactions"}
          className={`filter-tab ${activeView === "transactions" ? "filter-tab-active" : ""}`}
          onClick={() => onViewChange("transactions")}
        >
          <Filter size={15} />
          <span>Detailed Transactions Ledger</span>
        </button>
      </div>
    </section>
  )
}
