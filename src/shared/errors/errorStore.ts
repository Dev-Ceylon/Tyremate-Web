import { create } from "zustand"
import type { AppErrorOptions, AppErrorRecord, AppErrorSource } from "./appError"
import { createErrorRecord } from "./appError"

const MAX_ERRORS = 20
const DEDUPE_WINDOW_MS = 5000

interface ErrorState {
  errors: AppErrorRecord[]
  reportError: (
    source: AppErrorSource,
    error: unknown,
    options?: AppErrorOptions
  ) => AppErrorRecord | null
  dismissError: (id: number) => void
  clearErrors: () => void
}

function isDuplicate(existing: AppErrorRecord[], next: AppErrorRecord): boolean {
  return existing.some(
    (item) =>
      item.channel === next.channel &&
      item.message === next.message &&
      item.timestamp >= next.timestamp - DEDUPE_WINDOW_MS
  )
}

function shouldPersist(record: AppErrorRecord): boolean {
  return record.source !== "ipc"
}

function reportToMain(record: AppErrorRecord) {
  if (!shouldPersist(record)) {
    return
  }

  void window.api.errorReporter.report({
    channel: record.channel,
    code: record.code,
    details: {
      href: window.location.href,
      timestamp: new Date(record.timestamp).toISOString(),
      ...(record.details === null || record.details === undefined
        ? {}
        : { extra: record.details }),
    },
    errorName: record.errorName,
    message: record.message,
    source: record.source,
    stackTrace: record.stackTrace ?? null,
  }).catch((error) => {
    console.error("Failed to persist renderer error", error)
  })
}

export const useErrorStore = create<ErrorState>((set, get) => ({
  errors: [],

  reportError: (source, error, options) => {
    const record = createErrorRecord(
      source,
      error,
      options
    )

    if (isDuplicate(get().errors, record)) {
      return null
    }

    set((state) => ({
      errors: [...state.errors, record].slice(-MAX_ERRORS),
    }))

    reportToMain(record)

    return record
  },

  dismissError: (id) =>
    set((state) => ({
      errors: state.errors.filter((error) => error.id !== id),
    })),

  clearErrors: () => set({ errors: [] }),
}))
