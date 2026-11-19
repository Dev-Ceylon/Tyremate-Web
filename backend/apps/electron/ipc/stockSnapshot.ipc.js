const stockSnapshotService = require("../../../packages/services/stockSnapshotService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("stockSnapshots:getAll", {}, () => stockSnapshotService.getStockSnapshots())

registerIpcHandler("stockSnapshots:getByTyreId", {}, (_event, tyreId) => stockSnapshotService.getStockSnapshotByTyreId(tyreId))
