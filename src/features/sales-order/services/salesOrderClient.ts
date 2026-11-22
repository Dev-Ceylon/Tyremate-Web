import type { SalesOrderPaymentPayload, SalesOrderPaymentResult, CompleteChequePaymentResult } from "../models/payment"
import type { CustomerRecord } from "../../master-data/customers/models/customer"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type { BatteryRecord } from "../../master-data/batteries/models/battery"
import type { SalesTrendPoint } from "../../../shared/models/salesTrend"
import type {
  CreateSalesOrderPayload,
  CreateSalesOrderWithAutoPOResult,
  CompleteSalesOrderResult,
  SoCustomerPayload,
  SoCustomerRecord,
  SoPayload,
  SoDetailedRecord,
  SoRecord,
  SoReturnTyresPayload,
  SoTodaySalesSummary,
  SoTyrePayload,
  SoTyreRecord,
  SoBatteryRecord,
  SoBatteryStorageAllocationRecord,
  SoWarehouseDispatch,
} from "../models/salesOrder"
import type { SoDeliveryProgress, SoDeliveryRecord, SOGatePassRecord, RecordSoDeliveryPayload } from "../models/delivery"

export const salesOrderClient = {
  getCustomers(): Promise<CustomerRecord[]> {
    return window.api.customers.getCustomers()
  },

  getTyres(): Promise<TyreRecord[]> {
    return window.api.tyres.getTyresWithAvailableQuantity()
  },

  getBatteries(): Promise<BatteryRecord[]> {
    return window.api.batteries?.getBatteriesWithAvailableQuantity
      ? window.api.batteries.getBatteriesWithAvailableQuantity()
      : window.api.batteries?.getBatteries
        ? window.api.batteries.getBatteries()
        : Promise.resolve([])
  },

  getSOs(category?: string): Promise<SoDetailedRecord[]> {
    return window.api.so.getSOs(category)
  },

  getTodaySalesSummary(date: string): Promise<SoTodaySalesSummary> {
    return window.api.so.getTodaySalesSummary(date)
  },

  getSalesTrendSummary(fromDate: string, toDate: string): Promise<SalesTrendPoint[]> {
    return window.api.so.getSalesTrendSummary(fromDate, toDate)
  },

  getSOById(soId: number): Promise<SoDetailedRecord> {
    return window.api.so.getSOById(soId)
  },

  getTyresBySoId(soId: number): Promise<SoTyreRecord[]> {
    return window.api.so.getTyresBySoId(soId)
  },

  getBatteriesBySoId(soId: number): Promise<SoBatteryRecord[]> {
    return window.api.so.getBatteriesBySoId(soId)
  },

  getAllocationsBySoBatteryId(soBatteryId: number): Promise<SoBatteryStorageAllocationRecord[]> {
    return window.api.so.getAllocationsBySoBatteryId(soBatteryId)
  },

  getWarehouseDispatch(soId: number): Promise<SoWarehouseDispatch> {
    return window.api.so.getWarehouseDispatch(soId)
  },

  getDeliveryWarehouseDispatch(soId: number, deliveryId: number): Promise<SoWarehouseDispatch> {
    return window.api.so.getDeliveryWarehouseDispatch(soId, deliveryId)
  },

  getDeliveryProgress(soId: number): Promise<SoDeliveryProgress> {
    return window.api.so.getDeliveryProgress(soId)
  },

  getDeliveries(soId: number): Promise<SoDeliveryRecord[]> {
    return window.api.so.getDeliveries(soId)
  },

  getDeliveryById(deliveryId: number): Promise<SoDeliveryRecord | null> {
    return window.api.so.getDeliveryById(deliveryId)
  },

  getSOGatePasses(): Promise<SOGatePassRecord[]> {
    return window.api.so.getGatePasses()
  },

  getPendingSOGatePasses(): Promise<SOGatePassRecord[]> {
    return window.api.so.getPendingGatePasses()
  },

  recordDelivery(soId: number, payload: RecordSoDeliveryPayload): Promise<SoDeliveryRecord> {
    return window.api.so.recordDelivery(soId, payload)
  },

  issueDeliveryGatePass(soId: number, deliveryId: number, overridePaymentIncomplete = false): Promise<SoDeliveryRecord> {
    return window.api.so.issueDeliveryGatePass(soId, deliveryId, { overridePaymentIncomplete })
  },

  createSO(data: SoPayload): Promise<SoRecord> {
    return window.api.so.createSO(data)
  },

  createSOWithAutoPO(data: CreateSalesOrderPayload): Promise<CreateSalesOrderWithAutoPOResult> {
    return window.api.so.createSOWithAutoPO(data)
  },

  makeAPaymentForSo(soId: number, payment: SalesOrderPaymentPayload): Promise<SalesOrderPaymentResult> {
    return window.api.so.makeAPaymentForSo(soId, payment)
  },

  completeChequePayment(soId: number, paymentId: number): Promise<CompleteChequePaymentResult> {
    return window.api.so.completeChequePayment(soId, paymentId)
  },

  completeSO(soId: number): Promise<CompleteSalesOrderResult> {
    return window.api.so.completeSO(soId)
  },

  createSoCustomer(data: SoCustomerPayload): Promise<SoCustomerRecord> {
    return window.api.soCustomers.createSoCustomer(data)
  },

  createSoTyre(data: SoTyrePayload): Promise<SoTyreRecord> {
    return window.api.soTyres.createSoTyre(data)
  },

  createSoTyreReturn(soId: number, data: SoReturnTyresPayload): Promise<SoTyreRecord> {
    return window.api.so.createReturn(soId, data)
  },

  getReturnsBySoId(soId: number) {
    return window.api.so.getReturnsBySoId(soId)
  },

  getAllocationsBySoTyreId(soTyreId: number) {
    return window.api.so.getAllocationsBySoTyreId(soTyreId)
  },

  updateSO(soId: number, data: any): Promise<SoRecord> {
    return window.api.so.updateSO(soId, data)
  },

  deleteSO(soId: number): Promise<{ success: boolean }> {
    return window.api.so.deleteSO(soId)
  },

  getViolationsBySoId(soId: number): Promise<any[]> {
    return window.api.violations.getBySoId(soId)
  },
}
