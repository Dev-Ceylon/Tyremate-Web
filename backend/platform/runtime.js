/**
 * Host runtime for the TyreMate backend when it runs outside Electron
 * (browser Web Worker, or Node in tests).
 *
 * The worker installs the database and a "host" object before any backend
 * module is required. Backend modules reach browser-only capabilities
 * (printing, downloads, file pickers, session persistence) through the host.
 */

const state = {
  db: null,
  host: null,
  files: new Map(),
  migrationReport: { applied: [], failed: [] },
}

function setDatabase(db) {
  state.db = db
}

function getDatabase() {
  if (!state.db) {
    throw new Error("Database not initialised. Configure the database from the admin panel.")
  }
  return state.db
}

const noopHost = {
  // Ask the main (UI) thread to do something only it can do. Returns a Promise.
  requestMain: async (type) => {
    throw new Error(`Host capability "${type}" is not available in this environment`)
  },
  // Push an event to renderer listeners (ipcRenderer.on).
  emit: () => {},
  // Persist the logged-in user so a page reload keeps the session.
  persistSession: () => {},
  initialSession: null,
}

function setHost(host) {
  state.host = { ...noopHost, ...host }
}

function getHost() {
  return state.host || noopHost
}

/** Files handed over from the UI thread (drag & drop / file picker). */
function registerFile(token, file) {
  state.files.set(token, file)
}

function getFile(token) {
  return state.files.get(token) || null
}

function releaseFile(token) {
  state.files.delete(token)
}

function getMigrationReport() {
  return state.migrationReport
}

module.exports = {
  setDatabase,
  getDatabase,
  setHost,
  getHost,
  registerFile,
  getFile,
  releaseFile,
  getMigrationReport,
}
