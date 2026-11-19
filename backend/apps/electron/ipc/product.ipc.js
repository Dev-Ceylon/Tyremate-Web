const productService = require("../../../packages/services/productService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("get-products", {}, () => productService.getProducts())
