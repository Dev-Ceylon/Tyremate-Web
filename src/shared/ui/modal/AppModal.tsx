import { useEffect, type ReactNode } from "react"

type AppModalProps = {
  isOpen: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function AppModal({ isOpen, title, children, onClose }: AppModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="app-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="app-modal panel panel-strong"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="app-modal-header">
          <h3>{title}</h3>
          <button
            className="secondary-action app-modal-close"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
