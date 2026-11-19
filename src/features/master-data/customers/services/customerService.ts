import type { CustomerPayload } from "../models/customer"
import { customerClient } from "./customerClient"

export const customerService = {
  suggest(field: string, query: string) {
    return customerClient.suggest(field, query)
  },

  getCustomers() {
    return customerClient.getAll()
  },

  getCustomerById(customerId: number) {
    return customerClient.getById(customerId)
  },

  createCustomer(data: CustomerPayload) {
    return customerClient.create(data)
  },

  updateCustomer(customerId: number, data: CustomerPayload) {
    return customerClient.update(customerId, data)
  },

  deleteCustomer(customerId: number) {
    return customerClient.remove(customerId)
  },
}
