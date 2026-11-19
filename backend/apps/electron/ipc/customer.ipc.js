const customerService = require("../../../packages/services/customerService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("customers:getAll", {}, () => customerService.getCustomers())

registerIpcHandler("customers:getById", {}, (_event, customerId) => customerService.getCustomerById(customerId))

registerServiceHandler("customers:create", {}, customerService, "createCustomer")

registerServiceHandler("customers:update", {}, customerService, "updateCustomer")

registerServiceHandler("customers:delete", {}, customerService, "deleteCustomer")
