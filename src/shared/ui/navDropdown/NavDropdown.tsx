import { useEffect, useRef, useState } from "react"
import { NavLink, useLocation } from "@/lib/router"
import { Icons } from "../icons/icon"

export interface NavDropdownItem {
  label: string
  to: string
}

type NavDropdownProps = {
  label: string
  items: NavDropdownItem[]
}

export const NavDropdown = ({ label, items }: NavDropdownProps) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  if (!items || items.length === 0) {
    return null
  }

  const isActive = items.some((item) => {
    const path = location.pathname
    return path === item.to || path.startsWith(`${item.to}/`)
  })

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onClickOutside)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`nav-dropdown${isActive ? " nav-dropdown-active" : ""}`}>
      <button
        type="button"
        className="ghost-link nav-dropdown-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label}
        <Icons.ChevronDown size={16} className="nav-dropdown-caret" />
      </button>

      {open && (
        <div className="nav-dropdown-menu" role="menu">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              role="menuitem"
              className="nav-dropdown-item"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
