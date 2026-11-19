/**
 * Error taxonomy mirroring the backend packages/errors/appErrors.js.
 *
 * AppError subclasses carry a stable machine-readable code that the IPC
 * middleware maps into a client-safe envelope via toClientError(). These
 * types give the renderer the same vocabulary when inspecting rejected IPC
 * calls or persisted audit records.
 */

export const ERROR_CODES = {
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  UNAUTHORIZED: "UNAUTHORIZED",
  INTERNAL: "INTERNAL",
  ERROR: "ERROR",
  UNKNOWN: "UNKNOWN",
  REACT_ERROR_BOUNDARY: "REACT_ERROR_BOUNDARY",
  UNHANDLED_REJECTION: "UNHANDLED_REJECTION",
  RENDER: "RENDER",
  IPC: "IPC",
} as const

export type AppErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export interface ClientError {
  code: AppErrorCode
  message: string
}
