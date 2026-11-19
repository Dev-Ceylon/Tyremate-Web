import { bankDetailsClient } from "./bankDetailsClient"
import type { BankDetailPayload, BankDetailRecord } from "../models/bankDetail"

export const bankDetailsService = {
  suggest(field: string, query: string) {
    return bankDetailsClient.suggest(field, query)
  },

  getBankDetails(): Promise<BankDetailRecord[]> {
    return bankDetailsClient.getAll()
  },

  getBankDetailById(id: number): Promise<BankDetailRecord> {
    return bankDetailsClient.getById(id)
  },

  createBankDetail(data: BankDetailPayload): Promise<BankDetailRecord> {
    return bankDetailsClient.create(data)
  },

  updateBankDetail(id: number, data: BankDetailPayload): Promise<BankDetailRecord> {
    return bankDetailsClient.update(id, data)
  },

  deleteBankDetail(id: number): Promise<{ success: true }> {
    return bankDetailsClient.remove(id)
  },
}