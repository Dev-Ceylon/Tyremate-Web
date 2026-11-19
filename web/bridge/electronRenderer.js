// Stand-in for the renderer half of `electron` used by preload.js.
// ipcRenderer talks to the backend worker instead of the Electron main process.
import { invoke, off, offAll, on, registerFile } from "./backendClient"

export const ipcRenderer = {
  invoke: (channel, ...args) => invoke(channel, ...args),
  on: (channel, listener) => {
    on(channel, listener)
    return ipcRenderer
  },
  removeListener: (channel, listener) => {
    off(channel, listener)
    return ipcRenderer
  },
  removeAllListeners: (channel) => {
    offAll(channel)
    return ipcRenderer
  },
}

export const contextBridge = {
  exposeInMainWorld: (key, api) => {
    window[key] = api
  },
}

export const webUtils = {
  // Electron returns the absolute file path; the web edition returns an opaque
  // token that the worker resolves back to the File object.
  getPathForFile: (file) => registerFile(file),
}
