const tyreSupplierService = require("../../../packages/services/tyreSupplierService")
const { registerIpcHandler } = require("./errorMiddleware")

/**
 * Retrieves all suppliers associated with a specific tyre ID.
 * Exposes the tyreSupplierService.getSuppliersByTyreId functionality.
 */
registerIpcHandler("tyre:getSuppliers", {}, (_event, tyreId) => tyreSupplierService.getSuppliersByTyreId(tyreId))

registerIpcHandler("tyreSuppliers:getSuppliersByTyreId", {}, (_event, tyreId) => tyreSupplierService.getSuppliersByTyreId(tyreId))

registerIpcHandler("tyreSuppliers:create", {}, (_event, payload) => tyreSupplierService.create(payload))
