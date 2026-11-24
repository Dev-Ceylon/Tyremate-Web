const supplierService = require("../../../packages/services/supplierService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("suppliers:getAll", {}, () => supplierService.getSuppliers())

registerIpcHandler("suppliers:getTypes", {}, () => supplierService.getSupplierTypes())

registerIpcHandler("suppliers:getById", {}, (_event, supplierId) => supplierService.getSupplierById(supplierId))

registerServiceHandler("suppliers:create", {}, supplierService, "createSupplier")

registerServiceHandler("suppliers:update", {}, supplierService, "updateSupplier")

registerServiceHandler("suppliers:delete", {}, supplierService, "deleteSupplier")
