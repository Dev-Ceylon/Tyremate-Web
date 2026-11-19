"use client"
import { useEffect, useState } from "react"
import { getBackendStatus, onBackendStatus, type BackendStatus } from "../../../web/bridge/backendClient"

export function useBackendStatus(): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>(getBackendStatus())
  useEffect(() => {
    setStatus(getBackendStatus())
    return onBackendStatus(setStatus)
  }, [])
  return status
}

export function describeDatabase(status: BackendStatus): string {
  if (status.state === "idle") return "Not connected"
  const config = status.config
  if (config.driver === "local") return "This browser (local database)"
  try {
    return `Remote libSQL · ${new URL(config.url.replace(/^libsql:/, "https:")).host}`
  } catch {
    return "Remote libSQL"
  }
}
