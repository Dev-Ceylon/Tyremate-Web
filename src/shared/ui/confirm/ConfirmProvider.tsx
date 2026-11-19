import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { AppModal } from "../modal/AppModal"

export type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmState = {
  options: ConfirmOptions
} | null

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>(null)
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
      setState({ options })
    })
  }, [])

  const close = useCallback((confirmed: boolean) => {
    setState(null)
    resolveRef.current?.(confirmed)
    resolveRef.current = null
  }, [])

  const value = useMemo(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      <AppModal
        isOpen={!!state}
        title={state?.options.title ?? "Confirm"}
        onClose={() => close(false)}
      >
        <p className="hero-text app-modal-body">
          {state?.options.message}
        </p>

        <div className="header-actions">
          <button
            className="secondary-action"
            type="button"
            onClick={() => close(false)}
          >
            {state?.options.cancelLabel ?? "Cancel"}
          </button>
          <button
            className={state?.options.danger ? "danger-action" : "primary-action"}
            type="button"
            onClick={() => close(true)}
          >
            {state?.options.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </AppModal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)

  if (!context) {
    throw new Error("useConfirm must be used inside ConfirmProvider")
  }

  return context.confirm
}
