import { salesReturnClient, quarantineClient } from "./salesReturnClient"
import type {
  CreateSalesReturnPayload,
  InspectAndApprovePayload,
  MoveToScrapOrSupplierPayload,
  ReceiveToQuarantinePayload,
  RejectSalesReturnPayload,
  SalesReturnDetails,
  SalesReturnRecord,
  TransferToSaleablePayload,
} from "../models/salesReturn"

export const salesReturnService = {
  async list(): Promise<SalesReturnRecord[]> {
    return salesReturnClient.list()
  },

  async createRequest(data: CreateSalesReturnPayload): Promise<SalesReturnRecord> {
    return salesReturnClient.createRequest(data)
  },

  async inspectAndApprove(data: InspectAndApprovePayload): Promise<SalesReturnRecord> {
    return salesReturnClient.inspectAndApprove(data)
  },

  async receiveToQuarantine(data: ReceiveToQuarantinePayload): Promise<any[]> {
    return salesReturnClient.receiveToQuarantine(data)
  },

  async transferToSaleable(data: TransferToSaleablePayload): Promise<any[]> {
    return salesReturnClient.transferToSaleable(data)
  },

  async moveToScrapOrSupplier(data: MoveToScrapOrSupplierPayload): Promise<any[]> {
    return salesReturnClient.moveToScrapOrSupplier(data)
  },

  async reject(data: RejectSalesReturnPayload): Promise<SalesReturnRecord> {
    return salesReturnClient.reject(data)
  },

  async linkExchangeSalesOrder(data: { salesReturnId: number; exchangeSoId: number }): Promise<SalesReturnRecord> {
    return salesReturnClient.linkExchangeSalesOrder(data)
  },

  async getById(salesReturnId: number): Promise<SalesReturnRecord> {
    return salesReturnClient.getById(salesReturnId)
  },

  async getDetails(salesReturnId: number): Promise<SalesReturnDetails> {
    return salesReturnClient.getDetails(salesReturnId)
  },
}

export const quarantineService = {
  async receiveToQuarantine(data: ReceiveToQuarantinePayload): Promise<any[]> {
    return quarantineClient.receiveToQuarantine(data)
  },

  async transferToSaleable(data: TransferToSaleablePayload): Promise<any[]> {
    return quarantineClient.transferToSaleable(data)
  },

  async moveToScrapOrSupplier(data: MoveToScrapOrSupplierPayload): Promise<any[]> {
    return quarantineClient.moveToScrapOrSupplier(data)
  },
}
