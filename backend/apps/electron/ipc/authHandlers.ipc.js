const { sessionStore } = require("../auth/sessionStore")
const { registerIpcHandler } = require("./errorMiddleware")

function registerAuthHandlers() {

  registerIpcHandler("auth:getUser", { auth: false }, () => sessionStore.getUser())

  registerIpcHandler("auth:clearUser", { auth: false }, () => sessionStore.clearUser())

}

module.exports = { registerAuthHandlers }
