// Web edition: the logged-in user lives in worker memory and is mirrored to the
// UI thread (sessionStorage/localStorage) through the platform host so that a
// page reload keeps the session.
const { getHost } = require("../../../platform/runtime")

let currentUser
let loaded = false

function load() {
  if (!loaded) {
    loaded = true
    currentUser = getHost().initialSession || null
  }
}

const sessionStore = {
  setUser(user) {
    load()
    currentUser = user || null
    getHost().persistSession(currentUser)
  },

  getUser() {
    load()
    return currentUser || null
  },

  clearUser() {
    load()
    currentUser = null
    getHost().persistSession(null)
  },
}

module.exports = { sessionStore }
