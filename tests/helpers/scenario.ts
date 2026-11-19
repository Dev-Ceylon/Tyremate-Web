/**
 * End-to-end business scenario driven through the IPC channels the renderer
 * uses. Produces a normalised transcript so different database engines can be
 * compared step by step.
 */
import type { BootedBackend } from "./backend"

export interface Step {
  step: string
  ok: boolean
  value?: unknown
  error?: string
}

const ISO_DATE = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?/g
const DATE_ONLY = /\b\d{4}-\d{2}-\d{2}\b/g

/** Removes run-dependent values (timestamps) so transcripts are comparable. */
export function normalise(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value ?? null, (k, v) => {
      // Stack traces recorded in ErrorAuditLog legitimately differ per engine.
      if (k === "StackTrace" || k === "stack") return "<stack>"
      if (typeof v === "string") return v.replace(ISO_DATE, "<ts>").replace(DATE_ONLY, "<date>")
      if (typeof v === "number" && !Number.isInteger(v)) return Math.round(v * 1e6) / 1e6
      return v
    }),
  )
}

export async function runScenario(backend: BootedBackend): Promise<Step[]> {
  const steps: Step[] = []
  const call = async (step: string, channel: string, ...args: unknown[]) => {
    try {
      const value = await backend.invoke(channel, ...args)
      steps.push({ step, ok: true, value: normalise(value) })
      return value as any
    } catch (error) {
      steps.push({ step, ok: false, error: String((error as Error).message).replace(ISO_DATE, "<ts>") })
      return undefined
    }
  }

  // Unauthenticated access is rejected exactly like the desktop app.
  await call("unauthenticated list", "customers:getAll")

  await call("login wrong password", "auth-login", { username: "admin", password: "nope" })
  const user = await call("login", "auth-login", { username: "admin", password: "1234" })
  if (!user) return steps

  await call("sample master data + stock", "admin:seedSampleData", { includeStock: true })

  const customers = (await call("customers", "customers:getAll")) ?? []
  await call("suppliers", "suppliers:getAll")
  await call("contractors", "contractors:getAll")
  await call("branches", "branches:getAll")
  const tyres = (await call("tyres", "tyres:getAll")) ?? []
  await call("storage locations", "storageLocations:getAll")
  await call("bank details", "bank-details:get-all")
  const stock = (await call("storage managers", "storageManagers:getAll")) ?? []
  await call("stock snapshot", "stockSnapshots:getAll")

  const newCustomer = await call("create customer", "customers:create", {
    CustomerCode: "WEB-CUST-1",
    Name: "Web Edition Customer",
    TinNo: "TIN-1",
    Contacts: [{ PhoneNumber: "0771234567", IsPrimary: 1 }],
    Emails: [{ EmailAddress: "customer@example.com", IsPrimary: 1 }],
    Addresses: [],
  })
  await call("create customer (auto code)", "customers:create", { CustomerCode: "", Name: "Second Customer" })
  if (newCustomer) {
    const id = newCustomer.CustomerID ?? newCustomer.Id ?? newCustomer.id
    await call("update customer", "customers:update", id, { CustomerCode: "WEB-CUST-1", Name: "Web Edition Customer (edited)" })
    await call("get customer", "customers:getById", id)
  }
  await call("suggest customers", "customers:suggest", "Name", "Web")

  // Sales order from stock with a full cash payment.
  const lot = stock.find((row: any) => Number(row.Qty) >= 2)
  const customer = customers[0]
  let soId: number | undefined
  if (lot && customer) {
    const price = 25000
    const qty = 2
    const so = await call("create SO with stock + cash", "so:createWithAutoPO", {
      Date: "2026-11-19",
      CustomerID: customer.CustomerID ?? customer.Id,
      Lines: [
        {
          TyreID: lot.TyreId,
          Price: price,
          Discount: 0,
          Allocations: [{ StorageManagerID: lot.Id ?? lot.ID ?? lot.StorageManagerID, Qty: qty, TakeNowQty: qty }],
          NeedToOrderQty: 0,
          TakeNowQty: qty,
        },
      ],
      Payment: {
        CashPayment: { PaymentTypeCode: "csh", AmountReceived: price * qty, BalanceToReturn: 0 },
        ChequePayment: null,
        BankTransferPayment: null,
      },
    })
    soId = so?.so?.SoID
  }
  await call("list SOs", "so:getAll")
  if (soId) {
    await call("get SO", "so:getById", soId)
    await call("SO tyres", "so:getTyresBySoId", soId)
    await call("SO delivery progress", "so:getDeliveryProgress", soId)
    await call("SO deliveries", "so:getDeliveries", soId)
    await call("SO warehouse dispatch", "so:getWarehouseDispatch", soId)
  }
  await call("stock after sale", "storageManagers:getAll")

  // Sales order that needs ordering (auto PO).
  const orderTyre = tyres[tyres.length - 1]
  if (orderTyre && customer) {
    await call("create SO needing auto PO", "so:createWithAutoPO", {
      Date: "2026-11-19",
      CustomerID: customer.CustomerID ?? customer.Id,
      Lines: [
        {
          TyreID: orderTyre.TyreID ?? orderTyre.Id,
          Price: 18000,
          Discount: 0,
          Allocations: [{ StorageManagerID: null, Qty: 4 }],
          NeedToOrderQty: 4,
        },
      ],
    })
  }
  await call("list POs", "po:getAll")
  await call("pending goods receipts", "goodsReceipts:getPending", {})

  if (soId) {
    const delivery = (await call("SO deliveries (for invoice)", "so:getDeliveries", soId))?.[0]
    const invoice = delivery
      ? await call("invoice from delivery", "invoice:generateFromDelivery", delivery.DeliveryID ?? delivery.Id ?? delivery.ID)
      : await call("invoice from SO", "invoice:generateFromSO", soId)
    const invoiceId = invoice?.InvoiceID ?? invoice?.invoice?.InvoiceID
    if (invoiceId) await call("get invoice", "invoice:getById", invoiceId)
  }
  await call("invoices", "invoice:getAll")
  await call("outstanding invoices", "invoice:getOutstanding")
  await call("today's sales", "so:getTodaySalesSummary", "2026-11-19")
  await call("sales report overview", "reports:getOverview", { preset: "custom", fromDate: "2026-01-01", toDate: "2026-12-31" })
  await call("sales report transactions", "reports:getTransactions", { preset: "custom", fromDate: "2026-01-01", toDate: "2026-12-31" })
  await call("cash flow overview", "reports:getCashFlowOverview", { preset: "custom", fromDate: "2026-01-01", toDate: "2026-12-31" })
  await call("PO report overview", "reports:getPoOverview", { preset: "custom", fromDate: "2026-01-01", toDate: "2026-12-31" })
  await call("sales CSV", "reports:exportToCsv", { preset: "custom", fromDate: "2026-01-01", toDate: "2026-12-31" })

  await call("notifications", "notifications:getAll")
  await call("reminders", "reminders:getAll")
  await call("violations", "violations:getAll", {})
  await call("error audit log", "errorAuditLogs:getAll")

  // Users & passwords (web edition admin channels).
  await call("roles", "admin:listRoles")
  const created = await call("create cashier", "admin:createUser", {
    username: "cashier1",
    displayName: "Cashier One",
    password: "secret-1",
    roleIds: [3],
  })
  await call("users", "admin:listUsers")
  await call("logout", "auth:clearUser")
  const cashier = await call("login cashier", "auth-login", { username: "cashier1", password: "secret-1" })
  if (cashier) {
    await call("cashier denied admin channel", "admin:listUsers")
    await call("cashier denied PO create", "po:createStandalone", {})
    await call("cashier change password", "auth:changePassword", "secret-1", "secret-2")
  }
  await call("logout cashier", "auth:clearUser")
  await call("login cashier new password", "auth-login", { username: "cashier1", password: "secret-2" })
  if (created) await call("cashier sees SOs", "so:getAll")
  // Dashboard widget outside the cashier's permissions: forbidden, NOT a lost session.
  await call("cashier PO count forbidden", "po:getPendingPOCount")
  await call("cashier still signed in", "auth:getUser")

  return steps
}

/**
 * Invokes every registered IPC channel (as admin) with no arguments and with a
 * plausible id argument. Most write channels reject the input; what matters is
 * that each engine behaves identically (same result or same error).
 */
export async function sweepChannels(backend: BootedBackend): Promise<Step[]> {
  const steps: Step[] = []
  await backend.invoke("auth-login", { username: "admin", password: "1234" })
  const skip = new Set(["auth:clearUser", "auth-login", "auth:changePassword", "admin:seedSampleData"])
  const channels: string[] = backend.electron.listChannels().filter((c: string) => !skip.has(c))
  for (const channel of channels) {
    for (const args of [[], [1]]) {
      try {
        const value = await backend.invoke(channel, ...args)
        steps.push({ step: `${channel}(${args.join(",")})`, ok: true, value: normalise(value) })
      } catch (error) {
        steps.push({ step: `${channel}(${args.join(",")})`, ok: false, error: String((error as Error).message).replace(ISO_DATE, "<ts>") })
      }
    }
  }
  return steps
}
