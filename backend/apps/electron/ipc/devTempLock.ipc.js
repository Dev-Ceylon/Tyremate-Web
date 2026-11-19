const devTempLockService = require("../../../packages/services/devTempLockService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler(
  "devTempLock:getStatus",
  { auth: false, allowWhenLocked: true, silent: true },
  () => devTempLockService.getStatus(),
)
