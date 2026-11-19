import type { ContractorPayload, ContractorRecord } from "../models/contractor"

export const contractorClient = {
  suggest(field: string, query: string): Promise<string[]> {
    return window.api.contractors.suggest(field, query)
  },

  getAll(): Promise<ContractorRecord[]> {
    return window.api.contractors.getContractors()
  },

  getById(contractorId: number): Promise<ContractorRecord> {
    return window.api.contractors.getContractorById(contractorId)
  },

  create(data: ContractorPayload): Promise<ContractorRecord> {
    return window.api.contractors.createContractor(data)
  },

  update(contractorId: number, data: ContractorPayload): Promise<ContractorRecord> {
    return window.api.contractors.updateContractor(contractorId, data)
  },

  remove(contractorId: number): Promise<{ success: true }> {
    return window.api.contractors.deleteContractor(contractorId)
  },
}
