import { describe, it, expect } from "vitest"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { TyreIcon, BatteryIcon, CalendarIcon, Icons } from "../../src/shared/ui/icons"

describe("Shared UI Icons", () => {
  it("renders TyreIcon with default props and custom props", () => {
    const defaultHtml = renderToStaticMarkup(React.createElement(TyreIcon))
    expect(defaultHtml).toContain('<svg')
    expect(defaultHtml).toContain('width="18"')
    expect(defaultHtml).toContain('height="18"')
    expect(defaultHtml).toContain('class="tm-icon tm-icon-tyre"')
    expect(defaultHtml).toContain('aria-hidden="true"')

    const customHtml = renderToStaticMarkup(
      React.createElement(TyreIcon, { size: 24, color: "#1e40af", className: "custom-class" })
    )
    expect(customHtml).toContain('width="24"')
    expect(customHtml).toContain('height="24"')
    expect(customHtml).toContain('stroke="#1e40af"')
    expect(customHtml).toContain('class="tm-icon tm-icon-tyre custom-class"')
  })

  it("renders BatteryIcon with default props and custom props", () => {
    const defaultHtml = renderToStaticMarkup(React.createElement(BatteryIcon))
    expect(defaultHtml).toContain('<svg')
    expect(defaultHtml).toContain('width="18"')
    expect(defaultHtml).toContain('height="18"')
    expect(defaultHtml).toContain('class="tm-icon tm-icon-battery"')
    expect(defaultHtml).toContain('aria-hidden="true"')

    const customHtml = renderToStaticMarkup(
      React.createElement(BatteryIcon, { size: 20, color: "#059669", className: "active-battery" })
    )
    expect(customHtml).toContain('width="20"')
    expect(customHtml).toContain('stroke="#059669"')
    expect(customHtml).toContain('class="tm-icon tm-icon-battery active-battery"')
  })

  it("renders CalendarIcon with default props and custom props", () => {
    const defaultHtml = renderToStaticMarkup(React.createElement(CalendarIcon))
    expect(defaultHtml).toContain('<svg')
    expect(defaultHtml).toContain('width="16"')
    expect(defaultHtml).toContain('height="16"')
    expect(defaultHtml).toContain('class="tm-icon tm-icon-calendar"')
    expect(defaultHtml).toContain('aria-hidden="true"')
  })

  it("exports tyre, battery, and calendar icons via the Icons dictionary", () => {
    expect(Icons.Tyre).toBe(TyreIcon)
    expect(Icons.Battery).toBe(BatteryIcon)
    expect(Icons.Calendar).toBe(CalendarIcon)

    const tyreFromDict = renderToStaticMarkup(React.createElement(Icons.Tyre, { size: 14 }))
    expect(tyreFromDict).toContain('width="14"')
    expect(tyreFromDict).toContain('tm-icon-tyre')

    const batteryFromDict = renderToStaticMarkup(React.createElement(Icons.Battery, { size: 14 }))
    expect(batteryFromDict).toContain('width="14"')
    expect(batteryFromDict).toContain('tm-icon-battery')
  })
})
