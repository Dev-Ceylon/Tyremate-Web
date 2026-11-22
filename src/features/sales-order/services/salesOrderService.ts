import type {
  SalesOrderPaymentPayload,
  SalesOrderPaymentResult,
  CompleteChequePaymentResult,
} from "../models/payment"
import type { CustomerRecord } from "../../master-data/customers/models/customer"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type { BatteryRecord } from "../../master-data/batteries/models/battery"
import type {
  CreateSalesOrderPayload,
  CreateSalesOrderWithAutoPOResult,
  CompleteSalesOrderResult,
  SoDetailedRecord,
  SoRecord,
  SoReturnTyresPayload,
  SoTodaySalesSummary,
  SoTyreRecord,
  SoBatteryRecord,
  SoBatteryStorageAllocationRecord,
  SoWarehouseDispatch,
} from "../models/salesOrder"
import type { SalesTrendPoint } from "../../../shared/models/salesTrend"
import type { SoDeliveryProgress, SoDeliveryRecord, SOGatePassRecord, RecordSoDeliveryPayload } from "../models/delivery"
import { salesOrderClient } from "./salesOrderClient"

export const salesOrderService = {
  getCustomers(): Promise<CustomerRecord[]> {
    return salesOrderClient.getCustomers()
  },

  getTyres(): Promise<TyreRecord[]> {
    return salesOrderClient.getTyres()
  },

  getBatteries(): Promise<BatteryRecord[]> {
    return salesOrderClient.getBatteries()
  },

  getSOs(category?: string): Promise<SoDetailedRecord[]> {
    return salesOrderClient.getSOs(category)
  },

  getTodaySalesSummary(date: string): Promise<SoTodaySalesSummary> {
    return salesOrderClient.getTodaySalesSummary(date)
  },

  getSalesTrendSummary(fromDate: string, toDate: string): Promise<SalesTrendPoint[]> {
    return salesOrderClient.getSalesTrendSummary(fromDate, toDate)
  },

  getSOById(soId: number): Promise<SoDetailedRecord> {
    return salesOrderClient.getSOById(soId)
  },

  getTyresBySoId(soId: number): Promise<SoTyreRecord[]> {
    return salesOrderClient.getTyresBySoId(soId)
  },

  getBatteriesBySoId(soId: number): Promise<SoBatteryRecord[]> {
    return salesOrderClient.getBatteriesBySoId(soId)
  },

  getAllocationsBySoBatteryId(soBatteryId: number): Promise<SoBatteryStorageAllocationRecord[]> {
    return salesOrderClient.getAllocationsBySoBatteryId(soBatteryId)
  },

  getWarehouseDispatch(soId: number): Promise<SoWarehouseDispatch> {
    return salesOrderClient.getWarehouseDispatch(soId)
  },

  getDeliveryWarehouseDispatch(soId: number, deliveryId: number): Promise<SoWarehouseDispatch> {
    return salesOrderClient.getDeliveryWarehouseDispatch(soId, deliveryId)
  },

  getDeliveryProgress(soId: number): Promise<SoDeliveryProgress> {
    return salesOrderClient.getDeliveryProgress(soId)
  },

  getDeliveries(soId: number): Promise<SoDeliveryRecord[]> {
    return salesOrderClient.getDeliveries(soId)
  },

  getDeliveryById(deliveryId: number): Promise<SoDeliveryRecord | null> {
    return salesOrderClient.getDeliveryById(deliveryId)
  },

  getSOGatePasses(): Promise<SOGatePassRecord[]> {
    return salesOrderClient.getSOGatePasses()
  },

  getPendingSOGatePasses(): Promise<SOGatePassRecord[]> {
    return salesOrderClient.getPendingSOGatePasses()
  },

  recordDelivery(soId: number, payload: RecordSoDeliveryPayload): Promise<SoDeliveryRecord> {
    return salesOrderClient.recordDelivery(soId, payload)
  },

  issueDeliveryGatePass(soId: number, deliveryId: number, overridePaymentIncomplete = false): Promise<SoDeliveryRecord> {
    return salesOrderClient.issueDeliveryGatePass(soId, deliveryId, overridePaymentIncomplete)
  },

  async createSalesOrder(payload: CreateSalesOrderPayload): Promise<CreateSalesOrderWithAutoPOResult> {
    return salesOrderClient.createSOWithAutoPO(payload)
  },

  async makeAPaymentForSo(soId: number, payment: SalesOrderPaymentPayload): Promise<SalesOrderPaymentResult> {
    return salesOrderClient.makeAPaymentForSo(soId, payment)
  },

  async completeChequePayment(soId: number, paymentId: number): Promise<CompleteChequePaymentResult> {
    return salesOrderClient.completeChequePayment(soId, paymentId)
  },

  async completeSalesOrder(soId: number): Promise<CompleteSalesOrderResult> {
    return salesOrderClient.completeSO(soId)
  },

  createSoTyreReturn(soId: number, data: SoReturnTyresPayload): Promise<SoTyreRecord> {
    return salesOrderClient.createSoTyreReturn(soId, data)
  },

  updateSalesOrder(soId: number, data: any): Promise<SoRecord> {
    return salesOrderClient.updateSO(soId, data)
  },

  deleteSalesOrder(soId: number): Promise<{ success: boolean }> {
    return salesOrderClient.deleteSO(soId)
  },

  getReturnsBySoId(soId: number) {
    return salesOrderClient.getReturnsBySoId(soId)
  },

  getAllocationsBySoTyreId(soTyreId: number) {
    return salesOrderClient.getAllocationsBySoTyreId(soTyreId)
  },

  getViolationsBySoId(soId: number): Promise<any[]> {
    return salesOrderClient.getViolationsBySoId(soId)
  },
}
