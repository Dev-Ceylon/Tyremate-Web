/**
 * Maps the desktop app's react-router URL patterns to statically exported
 * Next.js pages. GitHub Pages can only serve files that exist at build time,
 * so a path such as /sales-orders/42 is served by /sales-orders/view/?soId=42.
 *
 * The rest of the app keeps using the original logical paths; the router
 * compatibility layer (src/lib/router.tsx) translates in both directions.
 */
export interface DynamicRoute {
  pattern: string
  page: string
}

export const DYNAMIC_ROUTES: DynamicRoute[] = [
  { pattern: "/master-data/suppliers/:supplierId/edit", page: "/master-data/suppliers/edit" },
  { pattern: "/master-data/contractors/:contractorId/edit", page: "/master-data/contractors/edit" },
  { pattern: "/master-data/customers/:customerId/edit", page: "/master-data/customers/edit" },
  { pattern: "/master-data/storage-locations/tyres/:storageLocationId/edit", page: "/master-data/storage-locations/tyres/edit" },
  { pattern: "/master-data/consumable-locations/:consumableLocationId/edit", page: "/master-data/consumable-locations/edit" },
  { pattern: "/master-data/branches/:branchId/edit", page: "/master-data/branches/edit" },
  { pattern: "/master-data/tyres/:tyreId/edit", page: "/master-data/tyres/edit" },
  { pattern: "/master-data/consumables/:consumableId/edit", page: "/master-data/consumables/edit" },
  { pattern: "/master-data/bank-details/:bankDetailId/edit", page: "/master-data/bank-details/edit" },
  { pattern: "/sales-orders/:soId", page: "/sales-orders/view" },
  { pattern: "/sales-returns/:salesReturnId", page: "/sales-returns/view" },
  { pattern: "/purchase-orders/:poId/edit", page: "/purchase-orders/edit" },
  { pattern: "/purchase-orders/:poId/allocate", page: "/purchase-orders/allocate" },
  { pattern: "/purchase-orders/:poId", page: "/purchase-orders/view" },
  { pattern: "/inquiries/:inquiryId", page: "/inquiries/view" },
  { pattern: "/reminders/:reminderId", page: "/reminders/view" },
  { pattern: "/dag/:dagId", page: "/dag/view" },
  { pattern: "/other-service/:osId", page: "/other-service/view" },
  { pattern: "/violations/:violationId", page: "/violations/view" },
  { pattern: "/invoices/:invoiceId", page: "/invoices/view" },
  {
    pattern: "/storage-manager/tyres/locations/:locationId/branches/:branchId",
    page: "/storage-manager/tyres/location",
  },
  {
    pattern: "/storage-manager/consumables/locations/:locationId/branches/:branchId",
    page: "/storage-manager/consumables/location",
  },
]

/** Every statically exported page path (logical paths without params). */
export const STATIC_PAGES = new Set<string>([
  "/",
  "/login",
  "/setup",
  "/admin",
  "/help",
  "/account",
  "/products",
  "/master-data",
  "/master-data/suppliers",
  "/master-data/suppliers/new",
  "/master-data/contractors",
  "/master-data/contractors/new",
  "/master-data/customers",
  "/master-data/customers/new",
  "/master-data/storage-locations",
  "/master-data/storage-locations/tyres",
  "/master-data/storage-locations/tyres/new",
  "/master-data/consumable-locations",
  "/master-data/consumable-locations/new",
  "/master-data/branches",
  "/master-data/branches/new",
  "/master-data/tyres",
  "/master-data/tyres/new",
  "/master-data/consumables",
  "/master-data/consumables/new",
  "/master-data/bank-details",
  "/master-data/bank-details/new",
  "/sales-orders",
  "/sales-orders/new",
  "/sales-orders/overview",
  "/sales-returns",
  "/purchase-orders",
  "/purchase-orders/new",
  "/purchase-orders/overview",
  "/goods-receipts",
  "/inquiries",
  "/inquiries/new",
  "/inquiries/overview",
  "/reminders",
  "/reminders/overview",
  "/dag",
  "/dag/new",
  "/gatepass",
  "/gatepass/so",
  "/gatepass/dag",
  "/storage-manager",
  "/storage-manager/tyres",
  "/storage-manager/consumables",
  "/stock-snapshot",
  "/used-tyres",
  "/opex",
  "/other-payment",
  "/other-service",
  "/other-service/new",
  "/violations",
  "/invoices",
  "/invoices/new",
  "/reports",
  "/reports/sales",
  "/reports/purchase-orders",
  "/reports/po",
  "/reports/cash-flow",
])

interface ParsedTo {
  pathname: string
  search: string
  hash: string
}

export function parseTo(to: string): ParsedTo {
  let rest = to
  let hash = ""
  const hashIndex = rest.indexOf("#")
  if (hashIndex !== -1) {
    hash = rest.slice(hashIndex)
    rest = rest.slice(0, hashIndex)
  }
  let search = ""
  const qIndex = rest.indexOf("?")
  if (qIndex !== -1) {
    search = rest.slice(qIndex)
    rest = rest.slice(0, qIndex)
  }
  return { pathname: rest, search, hash }
}

export function normalizePath(pathname: string): string {
  if (!pathname) return "/"
  const trimmed = pathname.replace(/\/+$/, "")
  return trimmed === "" ? "/" : trimmed
}

function matchPattern(pattern: string, pathname: string): Record<string, string> | null {
  const p = pattern.split("/").filter(Boolean)
  const s = normalizePath(pathname).split("/").filter(Boolean)
  if (p.length !== s.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) {
      params[p[i].slice(1)] = decodeURIComponent(s[i])
    } else if (p[i] !== s[i]) {
      return null
    }
  }
  return params
}

/** Logical app path ("/sales-orders/42?tab=x") -> exported page URL ("/sales-orders/view?soId=42&tab=x"). */
export function toPageHref(to: string): string {
  const { pathname, search, hash } = parseTo(to)
  const path = normalizePath(pathname)
  if (STATIC_PAGES.has(path)) return `${path}${search}${hash}`
  for (const route of DYNAMIC_ROUTES) {
    const params = matchPattern(route.pattern, path)
    if (params) {
      const query = new URLSearchParams(params)
      new URLSearchParams(search).forEach((value, key) => {
        if (!query.has(key)) query.append(key, value)
      })
      return `${route.page}?${query.toString()}${hash}`
    }
  }
  return `${path}${search}${hash}`
}

function paramNames(pattern: string): string[] {
  return pattern
    .split("/")
    .filter((s) => s.startsWith(":"))
    .map((s) => s.slice(1))
}

export function dynamicRouteForPage(pagePath: string): DynamicRoute | undefined {
  const path = normalizePath(pagePath)
  return DYNAMIC_ROUTES.find((r) => r.page === path)
}

/** Exported page + query -> logical path params and remaining query. */
export function fromPageLocation(pagePath: string, searchParams: URLSearchParams) {
  const path = normalizePath(pagePath)
  const route = dynamicRouteForPage(path)
  if (!route) {
    return { pathname: path, params: {} as Record<string, string>, search: searchParams.toString() }
  }
  const names = paramNames(route.pattern)
  const params: Record<string, string> = {}
  for (const name of names) params[name] = searchParams.get(name) ?? ""
  const logical = route.pattern
    .split("/")
    .map((seg) => (seg.startsWith(":") ? encodeURIComponent(params[seg.slice(1)]) : seg))
    .join("/")
  const remaining = new URLSearchParams(searchParams)
  names.forEach((n) => remaining.delete(n))
  return { pathname: logical, params, search: remaining.toString() }
}

/**
 * Resolves a react-router "to" against the current logical location.
 * `routeBase` is the path of the enclosing nested-route layout (route-relative
 * resolution, react-router's default), e.g. "/master-data/suppliers".
 */
export function resolveTo(to: string, currentPath: string, routeBase?: string): string {
  if (to.startsWith("/")) return to
  const { pathname, search, hash } = parseTo(to)
  const current = normalizePath(currentPath)
  const base = routeBase ? normalizePath(routeBase) : null

  let segments: string[]
  if (base && current !== base && current.startsWith(base + "/")) {
    // Inside a child route of a nested layout: the child's own route is the base + 1 route.
    segments = base.split("/").filter(Boolean)
    if (pathname.startsWith("..")) {
      // ".." from a child route returns to the layout's index route.
      const rest = pathname.replace(/^\.\.\/?/, "")
      return `/${[...segments, ...rest.split("/").filter(Boolean)].join("/")}${search}${hash}`
    }
  } else {
    segments = (base ?? current).split("/").filter(Boolean)
  }

  for (const part of pathname.split("/")) {
    if (part === "" || part === ".") continue
    if (part === "..") segments.pop()
    else segments.push(part)
  }
  return `/${segments.join("/")}${search}${hash}`
}
