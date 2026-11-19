const soCustomerService = require("../../../packages/services/soCustomerService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("soCustomers:getAll", {}, () => soCustomerService.getSoCustomers())

registerIpcHandler("soCustomers:getByPair", {}, (_event, soId, customerId) => soCustomerService.getSoCustomer(soId, customerId))

registerIpcHandler("soCustomers:create", {}, (_event, payload) => soCustomerService.createSoCustomer(payload))

registerIpcHandler("soCustomers:update", {}, (_event, currentSoId, currentCustomerId, payload) => soCustomerService.updateSoCustomer(currentSoId, currentCustomerId, payload))

registerIpcHandler("soCustomers:delete", {}, (_event, soId, customerId) => soCustomerService.deleteSoCustomer(soId, customerId))
