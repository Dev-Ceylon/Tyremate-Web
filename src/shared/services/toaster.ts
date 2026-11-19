export type ToastVariant = "success" | "error" | "info"

export type ToastPayload = {
  title: string
  message?: string
  variant: ToastVariant
  content?: React.ReactNode;
}

export type ToastItem = ToastPayload & {
  id: number
}

let lastToastTimestamp = 0
let toastSequence = 0

function nextToastId() {
  const timestamp = Date.now()

  if (timestamp === lastToastTimestamp) {
    toastSequence += 1
  } else {
    lastToastTimestamp = timestamp
    toastSequence = 0
  }

  return timestamp * 1000 + toastSequence
}

export function createToast(payload: ToastPayload): ToastItem {
  return {
    id: nextToastId(),
    ...payload,
  }
}
