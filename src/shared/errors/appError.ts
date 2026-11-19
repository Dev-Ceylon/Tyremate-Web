import type { AppErrorCode } from "../models/common/error"

export type IpcErrorInfo = {
  channel: string
  message: string
}

export type AppErrorSource = "ipc" | "render" | "unhandled"

export type AppErrorDetails = Record<string, unknown> | string | null

export type AppErrorOptions = {
  channel?: string
  code?: AppErrorCode
  details?: AppErrorDetails
  errorName?: string
  stackTrace?: string | null
}

export type AppErrorRecord = {
  id: number
  code: AppErrorCode
  channel?: string
  details?: AppErrorDetails
  errorName: string
  message: string
  source: AppErrorSource
  stackTrace?: string | null
  timestamp: number
}

let lastErrorTimestamp = 0
let errorSequence = 0

function nextErrorId() {
  const timestamp = Date.now()

  if (timestamp === lastErrorTimestamp) {
    errorSequence += 1
  } else {
    lastErrorTimestamp = timestamp
    errorSequence = 0
  }

  return timestamp * 1000 + errorSequence
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || String(error)
  }
  if (error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message
  }
  return String(error ?? "Unknown error")
}

export function toErrorName(error: unknown): string {
  if (error instanceof Error) {
    return error.name || "Error"
  }
  if (error && typeof (error as { name?: unknown }).name === "string") {
    return (error as { name: string }).name
  }
  return "Error"
}

export function toErrorStack(error: unknown): string | null {
  if (error instanceof Error) {
    return error.stack || null
  }
  if (error && typeof (error as { stack?: unknown }).stack === "string") {
    return (error as { stack: string }).stack
  }
  return null
}

export function createErrorRecord(
  source: AppErrorSource,
  error: unknown,
  options?: AppErrorOptions
): AppErrorRecord {
  return {
    id: nextErrorId(),
    code: options?.code ?? "UNKNOWN",
    channel: options?.channel,
    details: options?.details,
    errorName: options?.errorName ?? toErrorName(error),
    message: toErrorMessage(error),
    source,
    stackTrace: options?.stackTrace ?? toErrorStack(error),
    timestamp: Date.now(),
  }
}
