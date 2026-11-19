import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Icons } from "../icons/icon"

export interface ActionMenuItem {
  label: string
  onClick: () => void
}

type ActionMenuProps = {
  label: string
  items: ActionMenuItem[]
}

type MenuPosition = {
  top: number
  left: number
}

const MENU_GAP = 6
const VIEWPORT_MARGIN = 8

export const ActionMenu = ({ label, items }: ActionMenuProps) => {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const reposition = useCallback(() => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return

    const rect = trigger.getBoundingClientRect()
    const menuHeight = menu.offsetHeight
    const menuWidth = menu.offsetWidth
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < menuHeight + MENU_GAP + VIEWPORT_MARGIN && rect.top > spaceBelow

    const top = openUp
      ? Math.max(VIEWPORT_MARGIN, rect.top - menuHeight - MENU_GAP)
      : rect.bottom + MENU_GAP

    const alignedLeft = rect.right - menuWidth
    const clampedLeft = Math.min(
      Math.max(VIEWPORT_MARGIN, alignedLeft),
      Math.max(VIEWPORT_MARGIN, window.innerWidth - menuWidth - VIEWPORT_MARGIN)
    )

    setPosition({ top, left: clampedLeft })
  }, [])

  useLayoutEffect(() => {
    if (!open) return

    reposition()
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
    }
  }, [open, reposition])

  const closeMenu = useCallback(() => {
    setOpen(false)
    setPosition(null)
  }, [])

  const toggleMenu = () => {
    if (open) {
      closeMenu()
      return
    }
    setPosition(null)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return

    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
      setPosition(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      closeMenu()
      triggerRef.current?.focus()
    }

    document.addEventListener("mousedown", onClickOutside)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onClickOutside)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, closeMenu])

  return (
    <div
      ref={rootRef}
      className="action-menu"
      data-open={open}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        className="secondary-action table-action action-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggleMenu}
      >
        {label}
        <Icons.ChevronDown size={14} className="action-menu-caret" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="action-menu-items action-menu-items-portal"
            role="menu"
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? "visible" : "hidden",
            }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className="action-menu-item"
                onClick={() => {
                  closeMenu()
                  item.onClick()
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}