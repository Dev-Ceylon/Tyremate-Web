const authService = require("../../../packages/services/authService")
const { sessionStore } = require("../auth/sessionStore")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("auth-login", { auth: false }, async (_event, { username, password }) => {
  const user = await authService.login(username, password)

  sessionStore.setUser(user)

  return user
})
