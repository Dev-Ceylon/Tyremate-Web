import type { BankDetailPayload, BankDetailRecord } from "../models/bankDetail"

export const bankDetailsClient = {
  suggest(field: string, query: string): Promise<string[]> {
    return window.api.bankDetails.suggest(field, query)
  },

  getAll(): Promise<BankDetailRecord[]> {
    return window.api.bankDetails.getBankDetails()
  },

  getById(id: number): Promise<BankDetailRecord> {
    return window.api.bankDetails.getBankDetailById(id)
  },

  create(data: BankDetailPayload): Promise<BankDetailRecord> {
    return window.api.bankDetails.createBankDetail(data)
  },

  update(id: number, data: BankDetailPayload): Promise<BankDetailRecord> {
    return window.api.bankDetails.updateBankDetail(id, data)
  },

  remove(id: number): Promise<{ success: true }> {
    return window.api.bankDetails.deleteBankDetail(id)
  },
}