import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  DYNAMIC_ROUTES,
  STATIC_PAGES,
  fromPageLocation,
  resolveTo,
  toPageHref,
} from "../../src/lib/routeTable"

const appDir = path.resolve(__dirname, "../../app")
const pageExists = (route: string) => existsSync(path.join(appDir, route === "/" ? "" : route, "page.tsx"))

describe("route table", () => {
  it("every static and dynamic target has an exported Next.js page", () => {
    for (const route of STATIC_PAGES) expect(pageExists(route), route).toBe(true)
    for (const route of DYNAMIC_ROUTES) expect(pageExists(route.page), route.page).toBe(true)
  })

  it("every Next.js page is reachable through the route table", () => {
    const pages: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else if (entry === "page.tsx") pages.push("/" + path.relative(appDir, dir).split(path.sep).join("/"))
      }
    }
    walk(appDir)
    const known = new Set([...STATIC_PAGES, ...DYNAMIC_ROUTES.map((r) => r.page)].map((p) => (p === "/" ? "/" : p)))
    for (const page of pages.map((p) => (p === "/" ? "/" : p.replace(/\/$/, "")))) {
      expect(known.has(page === "" ? "/" : page), page).toBe(true)
    }
  })

  it("maps desktop paths to exported pages", () => {
    expect(toPageHref("/sales-orders/42")).toBe("/sales-orders/view?soId=42")
    expect(toPageHref("/sales-orders/new")).toBe("/sales-orders/new")
    expect(toPageHref("/sales-orders/new?inquiryId=7")).toBe("/sales-orders/new?inquiryId=7")
    expect(toPageHref("/purchase-orders/9/edit")).toBe("/purchase-orders/edit?poId=9")
    expect(toPageHref("/purchase-orders/9/allocate")).toBe("/purchase-orders/allocate?poId=9")
    expect(toPageHref("/master-data/suppliers/3/edit")).toBe("/master-data/suppliers/edit?supplierId=3")
    expect(toPageHref("/storage-manager/tyres/locations/5/branches/2")).toBe(
      "/storage-manager/tyres/location?locationId=5&branchId=2",
    )
    expect(toPageHref("/invoices/1?tab=payments#top")).toBe("/invoices/view?invoiceId=1&tab=payments#top")
  })

  it("round-trips exported pages back to desktop paths and params", () => {
    const loc = fromPageLocation("/storage-manager/tyres/location/", new URLSearchParams("locationId=5&branchId=2&x=1"))
    expect(loc).toEqual({
      pathname: "/storage-manager/tyres/locations/5/branches/2",
      params: { locationId: "5", branchId: "2" },
      search: "x=1",
    })
    expect(fromPageLocation("/inquiries", new URLSearchParams("q=a")).pathname).toBe("/inquiries")
  })

  it("resolves relative links like react-router's route-relative mode", () => {
    const base = "/master-data/suppliers"
    expect(resolveTo("new", base, base)).toBe("/master-data/suppliers/new")
    expect(resolveTo("3/edit", base, base)).toBe("/master-data/suppliers/3/edit")
    expect(resolveTo("..", "/master-data/suppliers/3/edit", base)).toBe("/master-data/suppliers")
    expect(resolveTo("..", "/master-data/suppliers/new", base)).toBe("/master-data/suppliers")
    expect(resolveTo("/inquiries", "/anything", base)).toBe("/inquiries")
    expect(resolveTo("..", "/reports/sales")).toBe("/reports")
  })

  it("covers every literal navigation target used by the renderer", () => {
    const srcDir = path.resolve(__dirname, "../../src")
    const targets = new Set<string>()
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else if (/\.tsx?$/.test(entry)) {
          const text = readFileSync(full, "utf-8")
          for (const m of text.matchAll(/(?:navigate\(|to=)\{?["'`](\/[^"'`?#]*)/g)) targets.add(m[1].replace(/\$\{[^}]+\}/g, "1"))
        }
      }
    }
    walk(srcDir)
    const unmapped = [...targets].filter((t) => {
      const href = toPageHref(t).split("?")[0]
      return !pageExists(href.replace(/\/$/, "") || "/")
    })
    // /gatepass/dag/new is linked by the desktop app but was never routed there either
    // (it fell through to "*" -> Home, which the web edition reproduces via not-found).
    expect(unmapped.sort()).toEqual(["/gatepass/dag/new"])
  })
})
