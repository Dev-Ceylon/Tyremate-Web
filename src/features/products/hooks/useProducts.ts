import { useEffect, useState } from "react"
import { productService } from "../services/productService"
import type { Product } from "../models/product"

export function useProducts() {

  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    productService.getProducts().then(setProducts)
  }, [])

  return { products }

}