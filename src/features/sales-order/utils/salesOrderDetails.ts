import type { SoDetailedRecord } from "../models/salesOrder"

export function getCustomerLabel(order: SoDetailedRecord): string {
  if (order.Customer?.IsWalkinCustomer) {
    return order.Customer.CustomerName
  }

  const name = order.CustomerName ?? order.Customer?.CustomerName ?? "-"
  const code = order.CustomerCode ?? order.Customer?.CustomerCode ?? "-"
  return `${name} (${code})`
}
