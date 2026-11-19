/**
 * @file Central error taxonomy for the TyreMate backend (Electron main process).
 *
 * Service/domain code throws these to express business failures with a stable
 * machine-readable code. The IPC error middleware uses toClientError() to map
 * any thrown value into a client-safe { code, message } envelope before it is
 * rethrown across the IPC boundary.
 *
 * IMPORTANT: Electron only serializes an Error's `message` when it crosses
 * IPC, so `code`/`details` never reach the renderer. `code` is primarily used
 * for backend classification and logging.
 */

const INTERNAL_MESSAGE = "Something went wrong"

class AppError extends Error {
  constructor(code, message, options = {}) {
    super(message || INTERNAL_MESSAGE)
    this.name = "AppError"
    this.code = code
    this.expose = options.expose !== false
    this.silent = options.silent === true
    this.details = options.details
    if (options.cause !== undefined) {
      this.cause = options.cause
    }
  }
}

class ValidationError extends AppError {
  constructor(message, options) {
    super("VALIDATION", message, options)
    this.name = "ValidationError"
  }
}

class NotFoundError extends AppError {
  constructor(message, options) {
    super("NOT_FOUND", message, options)
    this.name = "NotFoundError"
  }
}

class ConflictError extends AppError {
  constructor(message, options) {
    super("CONFLICT", message, options)
    this.name = "ConflictError"
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", options) {
    super("UNAUTHORIZED", message, { expose: false, ...options })
    this.name = "UnauthorizedError"
  }
}

/**
 * Signed in, but the role lacks the permission. Deliberately does NOT contain
 * the word "Unauthorized": the renderer treats that as an expired session and
 * signs the user out (which used to log Cashiers out of the dashboard).
 */
class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action", options) {
    super("FORBIDDEN", message, options)
    this.name = "ForbiddenError"
  }
}

class InternalError extends AppError {
  constructor(message, options) {
    super("INTERNAL", message, { expose: false, ...options })
    this.name = "InternalError"
  }
}

/**
 * Maps any thrown value to a client-safe { code, message } envelope.
 *
 * - AppError with expose=true            -> its own code + message
 * - AppError with expose=false           -> INTERNAL code + generic message,
 *                                           except UNAUTHORIZED which always
 *                                           keeps its message (the preload
 *                                           redirect depends on the word
 *                                           "Unauthorized" reaching the client)
 * - plain Error                          -> message preserved (domain code
 *                                            already writes user-facing
 *                                            messages); logged centrally
 * - any other value                      -> generic fallback
 */
function toClientError(error) {
  if (error instanceof AppError) {
    if (error.expose || error.code === "UNAUTHORIZED") {
      return { code: error.code, message: error.message }
    }
    return { code: "INTERNAL", message: INTERNAL_MESSAGE }
  }

  if (error instanceof Error) {
    return { code: "ERROR", message: error.message || INTERNAL_MESSAGE }
  }

  if (error && typeof error.message === "string") {
    return { code: "ERROR", message: error.message }
  }

  return { code: "UNKNOWN", message: INTERNAL_MESSAGE }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  InternalError,
  toClientError,
}
