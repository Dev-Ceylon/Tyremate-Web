import { useEffect } from "react"
import { useErrorStore } from "./errorStore"

function handleUnhandledRejection(event: PromiseRejectionEvent) {
  useErrorStore.getState().reportError("unhandled", event.reason, {
    code: "UNHANDLED_REJECTION",
    details: {
      kind: "unhandledrejection",
    },
  })
}

function handleWindowError(event: ErrorEvent) {
  useErrorStore
    .getState()
    .reportError("render", event.error ?? event.message ?? "Uncaught error", {
      code: "RENDER",
      details: {
        colno: event.colno,
        filename: event.filename,
        kind: "window.error",
        lineno: event.lineno,
      },
    })
}

export function useGlobalErrorHandlers() {
  useEffect(() => {
    const unsubscribeFromIpc = window.api.onError?.((info) => {
      useErrorStore.getState().reportError("ipc", info.message, {
        channel: info.channel,
        code: "IPC",
      })
    })

    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    window.addEventListener("error", handleWindowError)

    return () => {
      unsubscribeFromIpc?.()
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      window.removeEventListener("error", handleWindowError)
    }
  }, [])
}
