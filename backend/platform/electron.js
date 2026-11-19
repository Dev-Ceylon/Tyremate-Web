/**
 * Minimal stand-in for the `electron` module used by the backend
 * (aliased at bundle time). Only the surface the TyreMate main process used
 * is implemented; everything is routed through the platform runtime host.
 */
const { getHost } = require("./runtime")

const handlers = new Map()

const ipcMain = {
  handle(channel, fn) {
    if (handlers.has(channel)) {
      throw new Error(`Attempted to register a second handler for '${channel}'`)
    }
    handlers.set(channel, fn)
  },
  removeHandler(channel) {
    handlers.delete(channel)
  },
}

/** Dispatches an IPC invocation exactly like ipcRenderer.invoke -> ipcMain.handle. */
async function invokeHandler(channel, args, event = {}) {
  const fn = handlers.get(channel)
  if (!fn) throw new Error(`No handler registered for '${channel}'`)
  return fn({ sender: webContents, ...event }, ...(args || []))
}

function listChannels() {
  return [...handlers.keys()].sort()
}

const webContents = {
  send(channel, payload) {
    getHost().emit(channel, payload)
  },
  isDestroyed: () => false,
}

const mainWindow = {
  webContents,
  isDestroyed: () => false,
}

const BrowserWindow = {
  getAllWindows: () => [mainWindow],
  getFocusedWindow: () => mainWindow,
  fromWebContents: () => mainWindow,
}

const dialog = {
  /** Opens the browser file picker on the UI thread. filePaths are opaque file tokens. */
  async showOpenDialog(options = {}) {
    const properties = options.properties || []
    const extensions = (options.filters || []).flatMap((f) => f.extensions || [])
    const tokens = await getHost().requestMain("pickFiles", {
      multiple: properties.includes("multiSelections"),
      accept: extensions.map((ext) => `.${ext}`).join(","),
    })
    return { canceled: !tokens || tokens.length === 0, filePaths: tokens || [] }
  },
  async showSaveDialog(options = {}) {
    return { canceled: false, filePath: options.defaultPath || "download" }
  },
  showErrorBox(title, content) {
    console.error(title, content)
  },
}

const shell = {
  async openExternal(url) {
    await getHost().requestMain("openUrl", { url })
  },
  async openPath() {
    return "Opening local paths is not supported in the browser"
  },
}

const app = {
  getPath: () => "/tyremate",
  getName: () => "tyremate",
  setName: () => {},
  setPath: () => {},
}

const safeStorage = {
  isEncryptionAvailable: () => false,
}

module.exports = {
  app,
  ipcMain,
  dialog,
  shell,
  BrowserWindow,
  safeStorage,
  invokeHandler,
  listChannels,
  mainWindow,
}
