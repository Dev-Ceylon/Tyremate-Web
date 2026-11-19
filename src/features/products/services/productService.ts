import { productClient } from "./productClient"

export const productService = {
  getProducts() {
    return productClient.getAll()
  },
}
