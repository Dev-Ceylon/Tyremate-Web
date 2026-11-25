import React, { useState } from "react"
import { Download, Printer, RefreshCw, ChevronDown } from "lucide-react"
import type { BatteryDatePreset } from "../models/batteryReport"
import { DATE_PRESET_OPTIONS } from "../constants/batteryReportConstants"

interface BatteryReportHeaderProps {
  preset: BatteryDatePreset
  customFrom: string
  customTo: string
  brand: string
  onPresetChange: (preset: BatteryDatePreset) => void
  onCustomRangeApply: (from: string, to: string) => void
  onBrandChange: (brand: string) => void
  onRefresh: () => void
  isRefreshing: boolean
  onExport: (exportType: "transactions" | "summary") => void
  isExporting: boolean
  activeView: "overview" | "transactions"
  onViewChange: (view: "overview" | "transactions") => void
}

export const BatteryReportHeader: React.FC<BatteryReportHeaderProps> = ({
  preset,
  customFrom,
  customTo,
  brand,
  onPresetChange,
  onCustomRangeApply,
  onBrandChange,
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

  const handlePrint = () => {
    window.print()
  }

  return (
    <section className="page-header panel">
      <div className="report-header-top">
        <div>
          <p className="eyebrow">Battery Inventory &amp; Performance</p>
          <h1>Battery Reports &amp; Dashboards</h1>
          <p className="hero-text">
            Commercial battery sales, procurement spend, warranty claims, and batch shelf-life analytics.
          </p>
        </div>

        <div className="header-actions">
          {/* Preset Selector */}
          <div className="select-wrapper">
            <select
              className="report-preset-select"
              value={preset}
              onChange={(e) => onPresetChange(e.target.value as BatteryDatePreset)}
              aria-label="Select report period preset"
            >
              {DATE_PRESET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="select-wrapper">
            <select
              className="report-preset-select"
              value={brand}
              onChange={(e) => onBrandChange(e.target.value)}
              aria-label="Filter by battery brand"
            >
              <option value="">All Brands</option>
              <option value="Lucas">Lucas</option>
              <option value="Amaron">Amaron</option>
              <option value="Exide">Exide</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="secondary-action"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Battery Report Data"
          >
            <RefreshCw size={15} className={isRefreshing ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            className="secondary-action"
            onClick={handlePrint}
            title="Print or Save as PDF"
          >
            <Printer size={15} />
            <span>Print</span>
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
                className="report-dropdown-menu panel panel-strong"
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
                  <strong>Download Movements CSV</strong>
                  <small>Row-by-row battery sales, purchases, and returns</small>
                </button>
                <button
                  type="button"
                  className="report-dropdown-item"
                  onClick={() => {
                    setShowExportMenu(false)
                    onExport("summary")
                  }}
                >
                  <strong>Download Summary CSV</strong>
                  <small>Aggregated KPIs, brand split, and segment metrics</small>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {preset === "custom" && (
        <form className="report-custom-date-bar" onSubmit={handleApplyCustom}>
          <div className="report-date-field">
            <label htmlFor="battery-report-from">From:</label>
            <input
              id="battery-report-from"
              type="date"
              className="report-date-input"
              value={tempFrom}
              onChange={(e) => setTempFrom(e.target.value)}
              required
            />
          </div>
          <div className="report-date-field">
            <label htmlFor="battery-report-to">To:</label>
            <input
              id="battery-report-to"
              type="date"
              className="report-date-input"
              value={tempTo}
              onChange={(e) => setTempTo(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="primary-action">
            Apply Dates
          </button>
        </form>
      )}

      {/* Navigation View Switcher */}
      <div className="report-view-tabs">
        <button
          type="button"
          className={`filter-tab ${activeView === "overview" ? "active" : ""}`}
          onClick={() => onViewChange("overview")}
        >
          Overview Analytics
        </button>
        <button
          type="button"
          className={`filter-tab ${activeView === "transactions" ? "active" : ""}`}
          onClick={() => onViewChange("transactions")}
        >
          Movement Ledger
        </button>
      </div>
    </section>
  )
}
