import type { Product } from "../models/product"

export const productClient = {
  getAll(): Promise<Product[]> {
    return window.api.products.getProducts()
  },
}
