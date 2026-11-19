import { useEffect, useRef } from "react"
import { useErrorStore } from "./errorStore"
import { useToast } from "../ui/toast/ToastProvider"

export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  const errors = useErrorStore((state) => state.errors)
  const showToast = useToast().showToast
  const lastHandledIdRef = useRef<number>(0)

  useEffect(() => {
    const newErrors = errors.filter((error) => error.id > lastHandledIdRef.current)

    if (newErrors.length === 0) {
      return
    }

    for (const error of newErrors) {
      // IPC errors already surface in the calling feature (its own toast or
      // inline error state), so a second global toast would be redundant.
      if (error.source === "ipc") {
        continue
      }

      const label = error.channel ? `[${error.channel}]` : "Application"
      showToast({
        variant: "error",
        title: "Something went wrong",
        message: `${label} ${error.message}`,
      })
    }

    lastHandledIdRef.current = newErrors[newErrors.length - 1].id
  }, [errors, showToast])

  return <>{children}</>
}
