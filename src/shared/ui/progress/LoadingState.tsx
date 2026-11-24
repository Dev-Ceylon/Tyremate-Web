import type { ReactNode } from "react"

export interface LoadingStateProps {
  /** Optional message displayed below (or next to) the spinner. */
  message?: string
  /** Size of the spinner: "sm" (18px), "md" (32px), or "lg" (44px). Defaults to "md". */
  size?: "sm" | "md" | "lg"
  /** Whether to render an inline flex row rather than a centered block container. */
  inline?: boolean
  /** Additional container CSS class names. */
  className?: string
  /** Optional children for custom sub-content below the message. */
  children?: ReactNode
}

/**
 * Accessible branded loading progress spinner for async data fetching across TyreMate ERP.
 */
export function LoadingState({
  message,
  size = "md",
  inline = false,
  className = "",
  children,
}: LoadingStateProps) {
  const spinnerClass = `tm-spinner tm-spinner-${size}`

  if (inline) {
    return (
      <span
        className={`tm-loading-inline ${className}`.trim()}
        role="status"
        aria-live="polite"
      >
        <span className={spinnerClass} aria-hidden="true" />
        {message ? <span>{message}</span> : null}
        {children}
      </span>
    )
  }

  return (
    <div
      className={`tm-loading-container ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className={spinnerClass} aria-hidden="true" />
      {message ? <p className="tm-loading-message">{message}</p> : null}
      {children}
    </div>
  )
}

export default LoadingState
