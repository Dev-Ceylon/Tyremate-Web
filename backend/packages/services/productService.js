const productRepo = require("../repositories/productRepository")

exports.getProducts = () => {

  const products = productRepo.getAllProducts()

  return products

}