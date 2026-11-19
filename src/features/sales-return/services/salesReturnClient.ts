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

export const salesReturnClient = {
  list(): Promise<SalesReturnRecord[]> {
    return window.api.salesReturn.list()
  },

  createRequest(data: CreateSalesReturnPayload): Promise<SalesReturnRecord> {
    return window.api.salesReturn.createRequest(data)
  },

  inspectAndApprove(data: InspectAndApprovePayload): Promise<SalesReturnRecord> {
    return window.api.salesReturn.inspectAndApprove(data)
  },

  receiveToQuarantine(data: ReceiveToQuarantinePayload): Promise<any[]> {
    return window.api.salesReturn.receiveToQuarantine(data)
  },

  transferToSaleable(data: TransferToSaleablePayload): Promise<any[]> {
    return window.api.salesReturn.transferToSaleable(data)
  },

  moveToScrapOrSupplier(data: MoveToScrapOrSupplierPayload): Promise<any[]> {
    return window.api.salesReturn.moveToScrapOrSupplier(data)
  },

  reject(data: RejectSalesReturnPayload): Promise<SalesReturnRecord> {
    return window.api.salesReturn.reject(data)
  },

  linkExchangeSalesOrder(data: { salesReturnId: number; exchangeSoId: number }): Promise<SalesReturnRecord> {
    return window.api.salesReturn.linkExchangeSalesOrder(data)
  },

  getById(salesReturnId: number): Promise<SalesReturnRecord> {
    return window.api.salesReturn.getById(salesReturnId)
  },

  getDetails(salesReturnId: number): Promise<SalesReturnDetails> {
    return window.api.salesReturn.getDetails(salesReturnId)
  },
}

export const quarantineClient = {
  receiveToQuarantine(data: ReceiveToQuarantinePayload): Promise<any[]> {
    return window.api.quarantine.receiveToQuarantine(data)
  },

  transferToSaleable(data: TransferToSaleablePayload): Promise<any[]> {
    return window.api.quarantine.transferToSaleable(data)
  },

  moveToScrapOrSupplier(data: MoveToScrapOrSupplierPayload): Promise<any[]> {
    return window.api.quarantine.moveToScrapOrSupplier(data)
  },
}
