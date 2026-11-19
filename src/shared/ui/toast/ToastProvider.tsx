import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createToast, type ToastItem, type ToastPayload } from "../../services/toaster"

type ToastContextType = {
  showToast: (toast: ToastPayload) => void
  dismissToast: (id: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const TOAST_DURATION_MS = 3200

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timeoutRefs = useRef<Map<number, number>>(new Map())

  const dismissToast = useCallback((id: number) => {
    const timeoutId = timeoutRefs.current.get(id)

    if (timeoutId) {
      window.clearTimeout(timeoutId)
      timeoutRefs.current.delete(id)
    }

    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (toast: ToastPayload) => {
      const nextToast = createToast(toast)

      setToasts((currentToasts) => [...currentToasts, nextToast])

      const timeoutId = window.setTimeout(() => {
        dismissToast(nextToast.id)
      }, TOAST_DURATION_MS)

      timeoutRefs.current.set(nextToast.id, timeoutId)
    },
    [dismissToast]
  )

  useEffect(() => {
    const timeoutMap = timeoutRefs.current

    return () => {
      timeoutMap.forEach((timeoutId) => window.clearTimeout(timeoutId))
      timeoutMap.clear()
    }
  }, [])

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`app-toast app-toast-${toast.variant}`}
            role="status"
          >
            <div className="app-toast-body">
              {toast.content ? (
                toast.content
              ) : (
                <>
                  <strong>{toast.title}</strong>

                  {toast.message ? (
                    <p>{toast.message}</p>
                  ) : null}
                </>
              )}
            </div>

            <button
              type="button"
              className="app-toast-close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider")
  }

  return context
}
