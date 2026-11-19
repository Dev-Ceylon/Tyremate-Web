import type { CustomerPayload, CustomerRecord } from "../models/customer"

export const customerClient = {
  suggest(field: string, query: string): Promise<string[]> {
    return window.api.customers.suggest(field, query)
  },

  getAll(): Promise<CustomerRecord[]> {
    return window.api.customers.getCustomers()
  },

  getById(customerId: number): Promise<CustomerRecord> {
    return window.api.customers.getCustomerById(customerId)
  },

  create(data: CustomerPayload): Promise<CustomerRecord> {
    return window.api.customers.createCustomer(data)
  },

  update(customerId: number, data: CustomerPayload): Promise<CustomerRecord> {
    return window.api.customers.updateCustomer(customerId, data)
  },

  remove(customerId: number): Promise<{ success: true }> {
    return window.api.customers.deleteCustomer(customerId)
  },
}
