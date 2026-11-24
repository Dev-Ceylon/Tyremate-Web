const customerService = require("../../../packages/services/customerService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("customers:getAll", {}, () => customerService.getCustomers())

registerIpcHandler("customers:getById", {}, (_event, customerId) => customerService.getCustomerById(customerId))

registerServiceHandler("customers:create", { permission: "customers.manage" }, customerService, "createCustomer")

registerServiceHandler("customers:update", { permission: "customers.manage" }, customerService, "updateCustomer")

registerServiceHandler("customers:delete", { permission: "customers.manage" }, customerService, "deleteCustomer")
