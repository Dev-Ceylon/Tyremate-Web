"use client"
/**
 * react-router-dom compatibility layer on top of the Next.js App Router.
 *
 * The desktop renderer used react-router (BrowserRouter/HashRouter). To keep
 * ~50k lines of feature code unchanged, the subset of the react-router API it
 * uses is re-implemented here and the original imports are pointed at this
 * module. Dynamic segments (/sales-orders/:soId) map to static pages with
 * query parameters, see routeTable.ts.
 */
import NextLink from "next/link"
import { usePathname, useRouter, useSearchParams as useNextSearchParams } from "next/navigation"
import React, { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react"
import { fromPageLocation, normalizePath, resolveTo, toPageHref } from "./routeTable"

type To = string | { pathname?: string; search?: string; hash?: string }

export interface NavigateOptions {
  replace?: boolean
  state?: unknown
}

export interface Location {
  pathname: string
  search: string
  hash: string
  state: unknown
  key: string
}

interface OutletContextValue {
  outlet: ReactNode
  base: string
}

const OutletContext = createContext<OutletContextValue | null>(null)

/** Provides the matched child page to an <Outlet/> rendered by a layout component. */
export function OutletProvider({ outlet, base, children }: { outlet: ReactNode; base: string; children: ReactNode }) {
  const parent = useContext(OutletContext)
  const value = useMemo(() => ({ outlet, base: base || parent?.base || "/" }), [outlet, base, parent?.base])
  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>
}

export function Outlet(): ReactNode {
  return useContext(OutletContext)?.outlet ?? null
}

function toString(to: To): string {
  if (typeof to === "string") return to
  const search = to.search ? (to.search.startsWith("?") ? to.search : `?${to.search}`) : ""
  const hash = to.hash ? (to.hash.startsWith("#") ? to.hash : `#${to.hash}`) : ""
  return `${to.pathname ?? ""}${search}${hash}`
}

let navigationState: unknown = null

/** Current logical location (the desktop URL), derived from the exported page URL. */
export function useLocation(): Location {
  const pagePath = usePathname() || "/"
  const searchParams = useNextSearchParams()
  return useMemo(() => {
    const logical = fromPageLocation(pagePath, new URLSearchParams(searchParams?.toString() ?? ""))
    return {
      pathname: logical.pathname,
      search: logical.search ? `?${logical.search}` : "",
      hash: typeof window !== "undefined" ? window.location.hash : "",
      state: navigationState,
      key: `${pagePath}?${searchParams?.toString() ?? ""}`,
    }
  }, [pagePath, searchParams])
}

function useResolve() {
  const location = useLocation()
  const outlet = useContext(OutletContext)
  return useCallback(
    (to: To) => resolveTo(toString(to), location.pathname, outlet?.base),
    [location.pathname, outlet?.base],
  )
}

export function useNavigate() {
  const router = useRouter()
  const resolve = useResolve()
  return useCallback(
    (to: To | number, options: NavigateOptions = {}) => {
      if (typeof to === "number") {
        if (to === 0) window.location.reload()
        else if (to < 0) {
          if (window.history.length > 1) router.back()
          else router.push("/")
        } else router.forward()
        return
      }
      navigationState = options.state ?? null
      const href = toPageHref(resolve(to))
      if (options.replace) router.replace(href)
      else router.push(href)
    },
    [router, resolve],
  )
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  const pagePath = usePathname() || "/"
  const searchParams = useNextSearchParams()
  return useMemo(
    () => fromPageLocation(pagePath, new URLSearchParams(searchParams?.toString() ?? "")).params as T,
    [pagePath, searchParams],
  )
}

type SetSearchParams = (
  next: URLSearchParams | Record<string, string> | ((prev: URLSearchParams) => URLSearchParams | Record<string, string>),
  options?: NavigateOptions,
) => void

export function useSearchParams(): [URLSearchParams, SetSearchParams] {
  const location = useLocation()
  const router = useRouter()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const set = useCallback<SetSearchParams>(
    (next, options = {}) => {
      const value = typeof next === "function" ? next(new URLSearchParams(location.search)) : next
      const query = value instanceof URLSearchParams ? value : new URLSearchParams(value)
      const qs = query.toString()
      const href = toPageHref(`${location.pathname}${qs ? `?${qs}` : ""}`)
      if (options.replace) router.replace(href, { scroll: false })
      else router.push(href, { scroll: false })
    },
    [location.pathname, location.search, router],
  )
  return [params, set]
}

export function Navigate({ to, replace }: { to: To; replace?: boolean }) {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(to, { replace })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

type AnchorProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "style" | "children">

export interface LinkProps extends AnchorProps {
  to: To
  replace?: boolean
  state?: unknown
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, state, children, onClick, ...rest },
  ref,
) {
  const resolve = useResolve()
  const href = toPageHref(resolve(to))
  return (
    <NextLink
      ref={ref}
      href={href}
      replace={replace}
      onClick={(event) => {
        navigationState = state ?? null
        onClick?.(event)
      }}
      {...rest}
    >
      {children}
    </NextLink>
  )
})

export interface NavLinkProps extends Omit<LinkProps, "className" | "style" | "children"> {
  end?: boolean
  className?: string | ((args: { isActive: boolean; isPending: boolean }) => string | undefined)
  style?: React.CSSProperties | ((args: { isActive: boolean; isPending: boolean }) => React.CSSProperties | undefined)
  children?: ReactNode | ((args: { isActive: boolean; isPending: boolean }) => ReactNode)
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, end, className, style, children, ...rest },
  ref,
) {
  const location = useLocation()
  const resolve = useResolve()
  const target = normalizePath(resolve(to).split(/[?#]/)[0])
  const current = normalizePath(location.pathname)
  const isActive = current === target || (!end && target !== "/" && current.startsWith(target + "/"))
  const args = { isActive, isPending: false }
  const resolvedClass =
    typeof className === "function" ? className(args) : [className, isActive ? "active" : ""].filter(Boolean).join(" ")
  const resolvedStyle = typeof style === "function" ? style(args) : style
  return (
    <Link
      ref={ref}
      to={to}
      className={resolvedClass || undefined}
      style={resolvedStyle}
      aria-current={isActive ? "page" : undefined}
      {...rest}
    >
      {typeof children === "function" ? children(args) : children}
    </Link>
  )
})
