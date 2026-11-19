/**
 * @file Central IPC handler middleware for the TyreMate main process.
 *
 * Every ipcMain.handle registration should go through registerIpcHandler /
 * registerServiceHandler so that auth gating, error mapping, central logging,
 * and the renderer toast contract are enforced in exactly one place.
 *
 * Error contract (Electron serializes only Error.message over IPC):
 *   - Thrown errors are mapped via toClientError() to a client-safe message.
 *   - "Unauthorized" (message includes the word) triggers the preload session
 *     redirect, so auth failures are thrown as UnauthorizedError("Unauthorized").
 *   - Errors thrown with { silent: true } carry an in-band marker so the
 *     preload can suppress the global toast (used for background polling).
 */

const { ipcMain } = require("electron")
const { sessionStore } = require("../auth/sessionStore")
const devTempLockService = require("../../../packages/services/devTempLockService")
const { UnauthorizedError, ForbiddenError, toClientError } = require("../../../packages/errors/appErrors")
const { logError } = require("../../../packages/errors/errorLogger")

/**
 * In-band marker embedded in the Error message for silent failures.
 * The preload strips it and skips the global error toast.
 */
const SILENT_PREFIX = "\u0000TM_SILENT\u0000"

function buildContext(user) {
  return {
    user,
    changedBy: user ? String(user.id) : null,
    requestedAt: new Date().toISOString(),
  }
}

function buildClientError(error, { channel, silent, user }) {
  const client = toClientError(error)

  logError(error, {
    channel,
    code: client.code,
    source: "ipc",
    ctx: user ? { changedBy: String(user.id) } : { changedBy: null },
  })

  const message = silent ? `${SILENT_PREFIX}${client.message}` : client.message
  return new Error(message)
}

/**
 * Registers an ipcMain.handle for a custom inline handler.
 *
 * @param {string} channel IPC channel name
 * @param {{ auth?: boolean, silent?: boolean }} options
 * @param {(event, ...args) => any} fn - same signature as before (no ctx injected)
 */
function checkPermission(user, permission) {
  if (!user || !user.permissions) return false
  if (user.permissions.includes("god")) return true
  return user.permissions.includes(permission)
}

function registerIpcHandler(channel, options = {}, fn) {
  const { auth = true, permission = null, silent = false, allowWhenLocked = false } = options

  ipcMain.handle(channel, async (event, ...args) => {
    const user = sessionStore.getUser() ?? null

    if (!allowWhenLocked) {
      try {
        if (devTempLockService.getStatus().locked) {
          throw new Error("This application is locked because its development access period has expired.")
        }
      } catch (error) {
        throw buildClientError(error, { channel, silent: true, user })
      }
    }

    if (auth && !user) {
      throw buildClientError(new UnauthorizedError("Unauthorized"), {
        channel,
        silent: true,
        user,
      })
    }

    if (permission && !checkPermission(user, permission)) {
      throw buildClientError(new ForbiddenError(`You do not have permission to perform this action (${permission})`), {
        channel,
        silent: true,
        user,
      })
    }

    try {
      return await fn(event, ...args)
    } catch (error) {
      throw buildClientError(error, { channel, silent, user })
    }
  })
}

/**
 * Registers an ipcMain.handle that delegates to a service method, injecting
 * the audit ctx ({ user, changedBy, requestedAt }) as the last argument.
 *
 * @param {string} channel IPC channel name
 * @param {{ auth?: boolean, silent?: boolean }} options
 * @param {object} service service instance
 * @param {string} method service method name
 */
function registerServiceHandler(channel, options, service, method) {
  registerIpcHandler(channel, options, (_event, ...args) => {
    const user = sessionStore.getUser() ?? null
    const ctx = buildContext(user)
    return service[method](...args, ctx)
  })
}

module.exports = {
  registerIpcHandler,
  registerServiceHandler,
  SILENT_PREFIX,
}
