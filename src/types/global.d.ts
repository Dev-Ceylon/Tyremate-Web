import type { SupplierPayload, SupplierRecord, SupplierTypeRecord } from "../features/master-data/suppliers/models/supplier"
import type { ContractorPayload, ContractorRecord } from "../features/master-data/contractors/models/contractor"
import type { CustomerPayload, CustomerRecord } from "../features/master-data/customers/models/customer"
import type { BranchPayload, BranchRecord } from "../features/master-data/branches/models/branch"
import type {
  InquiryPayload,
  InquiryRecord,
  InquiryReminderPayload,
  InquiryReminderRecord,
} from "../features/inquiry/models/inquiry"
import type { LinkedPoRecord, LinkedInquiryRecord } from "../features/inquiry/models/inquiryPo"
import type { LinkedSoRecord, SoLinkedInquiryRecord } from "../features/inquiry/models/inquirySo"
import type {
  ReminderPayload,
  ReminderRecord,
  PendingReminderRecord,
} from "../features/reminder/models/reminder"
import type {
  StorageLocationPayload,
  StorageLocationRecord,
} from "../features/master-data/storage-locations/models/storageLocation"
export type StorageLocationTypePayload = {
  LocationTypeCode: string
  LocationTypeName: string
}
export type StorageLocationTypeRecord = {
  Id: number
  LocationTypeCode: string
  LocationTypeName: string
}
import type { TyrePayload, TyreRecord } from "../features/master-data/tyres/models/tyre"
import type { BatteryPayload, BatteryRecord } from "../features/master-data/batteries/models/battery"
import type {
  BankDetailPayload,
  BankDetailRecord,
} from "../features/master-data/bank-details/models/bankDetail"
import type { TyreSupplier, TyreSupplierApiRecord } from "../features/tyre-suppliers/models/tyreSupplier"
import type { BatterySupplier, BatterySupplierApiRecord } from "../features/battery-suppliers/models/batterySupplier"
import type { User } from "../features/auth/models/user"
import type {
  SalesOrderPaymentPayload,
  CompleteChequePaymentResult as SOCompleteChequePaymentResult,
} from "../features/sales-order/models/payment"
import type { CashReceiptMetadata } from "../shared/payment/models/payment"
import type {
  CreateDagWithTyresPayload,
  CreateDagWithTyresResult,
  DagPayload,
  DagRecord,
  DagTyrePayload,
  DagTyreRecord,
  DagDetailedRecord,
  SellDagTyresPayload,
  SellDagTyresResult,
  UpdateDagTyreSerialCostResult,
  DagContractorApprovalRecord,
  DagContractorApprovalStatus,
  DagContractorAssignmentPayload,
  CompleteDagChequePaymentResult,
} from "../features/dag/models/dag"
import type { DagPaymentPayload } from "../features/dag/models/payment"
import type {
  DAGGatePassPayload,
  DAGGatePassRecord,
} from "../features/gatepass/dag-gatepass/models/dagGatePass"
import type {
  StorageManagerPayload,
  StorageManagerBatchRecord,
  StorageManagerLocationBatchRecord,
  StorageManagerLocationRecord,
  StorageManagerRecord,
} from "../features/storage-manager/models/storageManager"
import type {
  BatteryStorageManagerPayload,
  BatteryStorageManagerBatchPayload,
  BatteryStorageManagerBatchRecord,
  BatteryStorageManagerLocationBatchRecord,
  BatteryStorageManagerLocationRecord,
  BatteryStorageManagerRecord,
} from "../features/storage-manager/models/batteryStorageManager"
import type { ConsumablePayload, ConsumableRecord } from "../shared/models/consumables/consumable"
import type { ConsumableLocationPayload, ConsumableLocationRecord } from "../shared/models/consumables/consumableLocation"
import type { BatteryLocationPayload, BatteryLocationRecord } from "../features/master-data/battery-locations/models/batteryLocation"
import type { ConsumableStorageManagerPayload, ConsumableStorageManagerRecord } from "../shared/models/consumables/consumableStorageManager"
import type { StockSnapshotRecord } from "../features/stock-snapshot/models/stockSnapshot"
import type {
  CreateSalesOrderPayload,
  CreateSalesOrderWithAutoPOResult,
  CompleteSalesOrderResult,
  PoPayload,
  PoTyrePayload,
  PoTyreRecord,
  PoTyreBatchPayload,
  PoTyreBatchRecord,
  PoTyreBatchStatusRecord,
  PoRecord,
  SoCustomerPayload,
  SoCustomerRecord,
  SoPayload,
  SoRecord,
  PoTyreAllocationPayload,
  SoDetailedRecord,
  SoReturnTyresPayload,
  SoTodaySalesSummary,
  SoTyrePayload,
  SoTyreRecord,
  SoWarehouseDispatch,
  SoTyreStorageAllocationRecord,
  ReturnAllocationItem,
} from "../features/sales-order/models/salesOrder"
import type { SoDeliveryProgress, SoDeliveryRecord, SOGatePassRecord, RecordSoDeliveryPayload } from "../features/sales-order/models/delivery"
import type { PoPendingCount } from "../features/purchase-order/models/purchaseOrder"
import type { CountRecord } from "../shared/models/common/count"
import type { SalesTrendPoint } from "../shared/models/salesTrend"
import type { StatusRecord } from "../shared/model/status"
import type { DevTempLockStatus } from "../features/dev-temp-lock/models/devTempLock"
import type { PrinterInfo } from "../shared/models/printer"
import type {
  NotificationCrudPayload,
  NotificationPayload,
  NotificationRecord,
  ReminderNotificationPayload
} from "../features/notification/models/notification"
import type {
  OtherServicePayload,
  OtherServiceRecord,
  OtherServiceDetailedRecord,
  OtherServicePaymentPayload,
  CompleteChequePaymentResult as OSCompleteChequePaymentResult,
  CompleteOtherServiceResult,
  MakeOSPaymentResult
} from "../features/other-service/models/otherService"
import type {
  ReportQueryParams,
  ExportReportParams,
  SalesReportOverview,
  SalesTransactionsReportResult,
  ReportExportResult,
  SaveCsvResult,
} from "../features/reports/sales-reports/models/salesReport"
import type {
  PoReportQueryParams,
  ExportPoReportParams,
  PoReportOverview,
  PoTransactionsReportResult,
} from "../features/reports/po-reports/models/poReport"
import type {
  CashFlowReportQueryParams,
  ExportCashFlowParams,
  CashFlowOverview,
  CashFlowLedgerResult,
} from "../features/reports/cash-flow-reports/models/cashFlowReport"
import type {
  BatteryReportQueryParams,
  ExportBatteryReportParams,
  BatteryReportOverview,
  BatteryTransactionsReportResult,
} from "../features/reports/battery-reports/models/batteryReport"
import type { GoodsReceiptPayload, GoodsReceiptLineRecord, PendingGoodsReceiptFilters, PendingGoodsReceiptRecord, PendingDagGoodsReceiptRecord, DagGoodsReceiptPayload, DagGoodsReceiptResult } from "../features/goods-receipt/models/goodsReceipt"
import type {
  InvoiceRecord,
  InvoiceDetailedRecord,
  DirectInvoicePayload,
  UpdateInvoicePayload,
  CancelInvoicePayload,
  CreditNotePayload,
} from "../features/invoice/models/invoice"

export { }

type IpcErrorInfo = {
  channel: string
  message: string
}

type ErrorAuditLogRecord = {
  Id: number
  Channel: string | null
  Code: string | null
  ErrorName: string
  Message: string
  StackTrace: string | null
  Details: string | null
  Source: string
  ChangedBy: string | null
  CreatedDateTime: string
}

type ErrorAuditLogQuery = {
  channel?: string
  code?: string
  limit?: number
}

type RendererErrorReportPayload = {
  channel?: string
  code?: string
  details?: unknown
  errorName?: string
  message: string
  source: "ipc" | "render" | "unhandled"
  stackTrace?: string | null
}

declare global {
  interface Window {
    api: {
      devTempLock: {
        getStatus: () => Promise<DevTempLockStatus>
      }
      //products
      products: {
        getProducts: () => Promise<any[]>
      }

      //suppliers
      suppliers: {
        suggest: (field: string, query: string) => Promise<string[]>
        getSuppliers: () => Promise<SupplierRecord[]>
        getSupplierById: (supplierId: number) => Promise<SupplierRecord>
        getSupplierTypes: () => Promise<SupplierTypeRecord[]>
        createSupplier: (data: SupplierPayload) => Promise<SupplierRecord>
        updateSupplier: (supplierId: number, data: SupplierPayload) => Promise<SupplierRecord>
        deleteSupplier: (supplierId: number) => Promise<{ success: true }>
      }

      contractors: {
        suggest: (field: string, query: string) => Promise<string[]>
        getContractors: () => Promise<ContractorRecord[]>
        getContractorById: (contractorId: number) => Promise<ContractorRecord>
        createContractor: (data: ContractorPayload) => Promise<ContractorRecord>
        updateContractor: (contractorId: number, data: ContractorPayload) => Promise<ContractorRecord>
        deleteContractor: (contractorId: number) => Promise<{ success: true }>
      }

      customers: {
        suggest: (field: string, query: string) => Promise<string[]>
        getCustomers: () => Promise<CustomerRecord[]>
        getCustomerById: (customerId: number) => Promise<CustomerRecord>
        createCustomer: (data: CustomerPayload) => Promise<CustomerRecord>
        updateCustomer: (customerId: number, data: CustomerPayload) => Promise<CustomerRecord>
        deleteCustomer: (customerId: number) => Promise<{ success: true }>
      }

      inquiries: {
        getInquiries: () => Promise<InquiryRecord[]>
        getInquiryById: (inquiryId: number) => Promise<InquiryRecord>
        createInquiry: (data: InquiryPayload) => Promise<InquiryRecord>
        updateInquiry: (inquiryId: number, data: InquiryPayload) => Promise<InquiryRecord>
        deleteInquiry: (inquiryId: number) => Promise<{ success: true }>
        updateInquiryStatus: (inquiryId: number, status: number) => Promise<InquiryRecord>
        addReminder: (inquiryId: number, data: InquiryReminderPayload) => Promise<InquiryReminderRecord>
        updateReminder: (reminderId: number, data: InquiryReminderPayload) => Promise<InquiryReminderRecord>
        markReminderDone: (reminderId: number, isDone: boolean) => Promise<InquiryReminderRecord>
        deleteReminder: (reminderId: number) => Promise<{ success: true }>
}

      //inquiry <-> purchase order links
      inquiryPo: {
        getByInquiryId: (inquiryId: number) => Promise<LinkedPoRecord[]>
        getByPoId: (poId: number) => Promise<LinkedInquiryRecord[]>
        link: (inquiryId: number, poId: number) => Promise<LinkedPoRecord[]>
        unlink: (inquiryId: number, poId: number) => Promise<LinkedPoRecord[]>
      }

      //inquiry <-> sales order links
      inquirySo: {
        getByInquiryId: (inquiryId: number) => Promise<LinkedSoRecord[]>
        getBySoId: (soId: number) => Promise<SoLinkedInquiryRecord[]>
        link: (inquiryId: number, soId: number) => Promise<LinkedSoRecord[]>
        unlink: (inquiryId: number, soId: number) => Promise<LinkedSoRecord[]>
      }

      //reminders
      reminders: {
        getReminders: () => Promise<ReminderRecord[]>
        getTodaysPendingReminders: () => Promise<PendingReminderRecord[]>
        getPendingReminders: () => Promise<ReminderRecord[]>
        getReminderById: (reminderId: number) => Promise<ReminderRecord>
        getReminderDetails: (reminderId: number) => Promise<any>
        createReminder: (data: ReminderPayload) => Promise<ReminderRecord>
        updateReminder: (reminderId: number, data: ReminderPayload) => Promise<ReminderRecord>
        markReminderCompleted: (reminderId: number, isCompleted: boolean) => Promise<ReminderRecord>
        deleteReminder: (reminderId: number) => Promise<{ success: true }>
        getSoIdBySOReminderId: (reminderId: number) => Promise<number | null>
        syncBatteryReminders: () => Promise<any>
        syncTyreExpiryReminders: () => Promise<any>
      }

      notifications: {
        getNotifications: () => Promise<NotificationRecord[]>
        getNotificationById: (notificationId: number) => Promise<NotificationRecord>
        getNotificationByCode: (code: string) => Promise<NotificationRecord>
        createNotification: (data: NotificationPayload) => Promise<NotificationRecord>
        updateNotification: (
          notificationId: number,
          data: NotificationPayload
        ) => Promise<NotificationRecord>
        deleteNotification: (notificationId: number) => Promise<{ success: true }>
        deleteAllNotifications: () => Promise<any>
      }

      errorAuditLogs: {
        getErrorAuditLogs: (options?: ErrorAuditLogQuery) => Promise<ErrorAuditLogRecord[]>
      }

      errorReporter: {
        report: (payload: RendererErrorReportPayload) => Promise<{ success: true }>
      }

      reminderEvents: {
        onChanged: (callback: (payload: any) => void) => (() => void) | void
      }

      storageLocations: {
        suggest: (field: string, query: string) => Promise<string[]>
        getStorageLocations: () => Promise<StorageLocationRecord[]>
        getStorageLocationsByBranch: (branchId: number) => Promise<StorageLocationRecord[]>
        getStorageLocationsByLocationType: (locationTypeId: number) => Promise<StorageLocationRecord[]>
        getStorageLocationById: (id: number) => Promise<StorageLocationRecord>
        createStorageLocation: (data: StorageLocationPayload) => Promise<StorageLocationRecord>
        updateStorageLocation: (id: number, data: StorageLocationPayload) => Promise<StorageLocationRecord>
        deleteStorageLocation: (id: number) => Promise<{ success: true }>
      }

      storageLocationTypes: {
        suggest: (field: string, query: string) => Promise<string[]>
        getStorageLocationTypes: () => Promise<StorageLocationTypeRecord[]>
        getStorageLocationTypeById: (id: number) => Promise<StorageLocationTypeRecord>
        createStorageLocationType: (data: StorageLocationTypePayload) => Promise<StorageLocationTypeRecord>
        updateStorageLocationType: (id: number, data: StorageLocationTypePayload) => Promise<StorageLocationTypeRecord>
        deleteStorageLocationType: (id: number) => Promise<{ success: true }>
      }

      branches: {
        suggest: (field: string, query: string) => Promise<string[]>
        getBranches: () => Promise<BranchRecord[]>
        getBranchById: (id: number) => Promise<BranchRecord>
        createBranch: (data: BranchPayload) => Promise<BranchRecord>
        updateBranch: (id: number, data: BranchPayload) => Promise<BranchRecord>
        deleteBranch: (id: number) => Promise<{ success: true }>
      }

      bankDetails: {
        suggest: (field: string, query: string) => Promise<string[]>
        getBankDetails: () => Promise<BankDetailRecord[]>
        getBankDetailById: (id: number) => Promise<BankDetailRecord>
        createBankDetail: (data: BankDetailPayload) => Promise<BankDetailRecord>
        updateBankDetail: (id: number, data: BankDetailPayload) => Promise<BankDetailRecord>
        deleteBankDetail: (id: number) => Promise<{ success: true }>
      }

      storageManagers: {
        getStorageManagers: () => Promise<StorageManagerRecord[]>
        getStorageManagersByLocation: (locationId: number) => Promise<StorageManagerLocationRecord[]>
        getStorageManagerById: (id: number) => Promise<StorageManagerRecord>
        getStorageManagersByTyreId: (tyreId: number) => Promise<StorageManagerRecord[]>
        getBatchesByTyreId: (tyreId: number) => Promise<StorageManagerBatchRecord[]>
        getBatchesByStorageManagerId: (id: number) => Promise<StorageManagerBatchRecord[]>
        getBatchesByLocation: (locationId: number) => Promise<StorageManagerLocationBatchRecord[]>
        createStorageManager: (data: StorageManagerPayload) => Promise<StorageManagerRecord>
        updateStorageManager: (id: number, data: StorageManagerPayload) => Promise<StorageManagerRecord>
        deleteStorageManager: (id: number) => Promise<{ success: true }>
      }

      consumables: {
        suggest: (field: string, query: string) => Promise<string[]>
        getConsumables: () => Promise<ConsumableRecord[]>
        getConsumableById: (id: number) => Promise<ConsumableRecord>
        getConsumablesByCategory: (category: string) => Promise<ConsumableRecord[]>
        getConsumablesWithStock: () => Promise<ConsumableRecord[]>
        getLowStockCount: () => Promise<CountRecord>
        createConsumable: (data: ConsumablePayload) => Promise<ConsumableRecord>
        updateConsumable: (id: number, data: ConsumablePayload) => Promise<ConsumableRecord>
        deleteConsumable: (id: number) => Promise<{ success: true }>
      }

      consumableLocations: {
        suggest: (field: string, query: string) => Promise<string[]>
        getConsumableLocations: () => Promise<ConsumableLocationRecord[]>
        getConsumableLocationsByBranch: (branchId: number) => Promise<ConsumableLocationRecord[]>
        getConsumableLocationById: (id: number) => Promise<ConsumableLocationRecord>
        createConsumableLocation: (data: ConsumableLocationPayload) => Promise<ConsumableLocationRecord>
        updateConsumableLocation: (id: number, data: ConsumableLocationPayload) => Promise<ConsumableLocationRecord>
        deleteConsumableLocation: (id: number) => Promise<{ success: true }>
      }

      batteryLocations: {
        suggest: (field: string, query: string) => Promise<string[]>
        getBatteryLocations: () => Promise<BatteryLocationRecord[]>
        getBatteryLocationsByBranch: (branchId: number) => Promise<BatteryLocationRecord[]>
        getBatteryLocationById: (id: number) => Promise<BatteryLocationRecord>
        createBatteryLocation: (data: BatteryLocationPayload) => Promise<BatteryLocationRecord>
        updateBatteryLocation: (id: number, data: BatteryLocationPayload) => Promise<BatteryLocationRecord>
        deleteBatteryLocation: (id: number) => Promise<{ success: true }>
      }

      consumableStorageManagers: {
        getConsumableStorageManagers: () => Promise<ConsumableStorageManagerRecord[]>
        getConsumableStorageManagersByLocation: (locationId: number) => Promise<ConsumableStorageManagerRecord[]>
        getConsumableStorageManagerById: (id: number) => Promise<ConsumableStorageManagerRecord>
        createConsumableStorageManager: (data: ConsumableStorageManagerPayload) => Promise<ConsumableStorageManagerRecord>
        updateConsumableStorageManager: (id: number, data: ConsumableStorageManagerPayload) => Promise<ConsumableStorageManagerRecord>
        deleteConsumableStorageManager: (id: number) => Promise<{ success: true }>
      }

      batteryStorageManagers: {
        getBatteryStorageManagers: () => Promise<BatteryStorageManagerRecord[]>
        getBatteryStorageManagersByLocation: (locationId: number) => Promise<BatteryStorageManagerLocationRecord[]>
        getBatteryStorageManagerById: (id: number) => Promise<BatteryStorageManagerRecord>
        getBatteryStorageManagersByBatteryId: (batteryId: number) => Promise<BatteryStorageManagerRecord[]>
        getBatchesByBatteryId: (batteryId: number) => Promise<BatteryStorageManagerBatchRecord[]>
        getBatchesByStorageManagerId: (id: number) => Promise<BatteryStorageManagerBatchRecord[]>
        getBatchesByLocation: (locationId: number) => Promise<BatteryStorageManagerLocationBatchRecord[]>
        getStorageLocationsByBranch: (branchId: number) => Promise<StorageLocationRecord[]>
        getStorageLocationById: (id: number) => Promise<StorageLocationRecord>
        createBatteryStorageManager: (data: BatteryStorageManagerPayload) => Promise<BatteryStorageManagerRecord>
        updateBatteryStorageManager: (id: number, data: BatteryStorageManagerPayload) => Promise<BatteryStorageManagerRecord>
        deleteBatteryStorageManager: (id: number) => Promise<{ success: true }>
        createBatch: (storageManagerId: number, data: BatteryStorageManagerBatchPayload) => Promise<BatteryStorageManagerBatchRecord>
        updateBatch: (id: number, data: BatteryStorageManagerBatchPayload) => Promise<BatteryStorageManagerBatchRecord>
        deleteBatch: (id: number) => Promise<{ success: true }>
      }

      otherServices: {
        getOtherServices: () => Promise<OtherServiceRecord[]>
        getOtherServiceById: (id: number) => Promise<OtherServiceDetailedRecord>
        createOtherService: (data: OtherServicePayload) => Promise<OtherServiceRecord>
        updateOtherService: (id: number, data: OtherServicePayload) => Promise<OtherServiceRecord>
        deleteOtherService: (id: number) => Promise<{ success: true }>
        makeAPaymentForOS: (osId: number, payload: OtherServicePaymentPayload) => Promise<MakeOSPaymentResult>
        completeChequePayment: (osId: number, paymentId: number) => Promise<OSCompleteChequePaymentResult>
        completeOtherService: (osId: number) => Promise<CompleteOtherServiceResult>
      }

      invoices: {
        getInvoices: () => Promise<InvoiceRecord[]>
        getOutstandingInvoices: () => Promise<InvoiceRecord[]>
        getInvoiceById: (invoiceId: number) => Promise<InvoiceDetailedRecord>
        generateFromSO: (soId: number) => Promise<InvoiceDetailedRecord>
        generateFromOtherService: (osId: number) => Promise<InvoiceDetailedRecord>
        generateFromDelivery: (deliveryId: number) => Promise<InvoiceDetailedRecord>
        createDirect: (data: DirectInvoicePayload) => Promise<InvoiceDetailedRecord>
        updateInvoice: (invoiceId: number, data: UpdateInvoicePayload) => Promise<InvoiceDetailedRecord>
        cancelInvoice: (invoiceId: number, data: CancelInvoicePayload) => Promise<InvoiceDetailedRecord>
        createCreditNote: (invoiceId: number, data: CreditNotePayload) => Promise<InvoiceDetailedRecord>
        recordPayment: (invoiceId: number, data: { Payment: unknown }) => Promise<InvoiceDetailedRecord>
      }

      stockSnapshots: {
        getStockSnapshots: () => Promise<StockSnapshotRecord[]>
        getStockSnapshotByTyreId: (tyreId: number) => Promise<StockSnapshotRecord>
      }

      tyres: {
        suggest: (field: string, query: string) => Promise<string[]>
        getTyres: () => Promise<TyreRecord[]>
        getTyresWithAvailableQuantity: () => Promise<TyreRecord[]>
        getLowStockCount: () => Promise<CountRecord>
        getTyreById: (tyreId: number) => Promise<TyreRecord>
        getTyreByIdWithAvailableQuantity: (tyreId: number) => Promise<TyreRecord>
        createTyre: (data: TyrePayload) => Promise<TyreRecord>
        updateTyre: (tyreId: number, data: TyrePayload) => Promise<TyreRecord>
        deleteTyre: (tyreId: number) => Promise<{ success: true }>
      }

      tyreSuppliers: {
        getSuppliersByTyreId: (tyreId: number) => Promise<TyreSupplierApiRecord[]>
        getAll: () => Promise<TyreSupplierApiRecord[]>
      }

      batteries: {
        suggest: (field: string, query: string) => Promise<string[]>
        getBatteries: () => Promise<BatteryRecord[]>
        getBatteriesWithAvailableQuantity: () => Promise<BatteryRecord[]>
        getLowStockCount: () => Promise<CountRecord>
        getBatteryById: (batteryId: number) => Promise<BatteryRecord>
        getBatteryByIdWithAvailableQuantity: (batteryId: number) => Promise<BatteryRecord>
        createBattery: (data: BatteryPayload) => Promise<BatteryRecord>
        updateBattery: (batteryId: number, data: BatteryPayload) => Promise<BatteryRecord>
        deleteBattery: (batteryId: number) => Promise<{ success: true }>
      }

      batterySuppliers: {
        getSuppliersByBatteryId: (batteryId: number) => Promise<BatterySupplierApiRecord[]>
        createBatterySupplier?: (data: { batteryId: number; supplierId: number; price: number }) => Promise<unknown>
        getAll?: () => Promise<BatterySupplierApiRecord[]>
      }

      so: {
        getSOs: (category?: string) => Promise<SoDetailedRecord[]>
        getTodaySalesSummary: (date: string) => Promise<SoTodaySalesSummary>
        getSalesTrendSummary: (fromDate: string, toDate: string) => Promise<SalesTrendPoint[]>
        getSOById: (soId: number) => Promise<SoDetailedRecord>
        getTyresBySoId: (soId: number) => Promise<SoTyreRecord[]>
        getBatteriesBySoId: (soId: number) => Promise<any[]>
        getWarehouseDispatch: (soId: number) => Promise<SoWarehouseDispatch>
        getDeliveryWarehouseDispatch: (soId: number, deliveryId: number) => Promise<SoWarehouseDispatch>
        getDeliveryProgress: (soId: number) => Promise<SoDeliveryProgress>
        getDeliveries: (soId: number) => Promise<SoDeliveryRecord[]>
        getDeliveryById: (deliveryId: number) => Promise<SoDeliveryRecord | null>
        getGatePasses: () => Promise<SOGatePassRecord[]>
        getPendingGatePasses: () => Promise<SOGatePassRecord[]>
        recordDelivery: (soId: number, payload: RecordSoDeliveryPayload) => Promise<SoDeliveryRecord>
        issueDeliveryGatePass: (soId: number, deliveryId: number, options?: { overridePaymentIncomplete?: boolean }) => Promise<SoDeliveryRecord>
        createSO: (data: SoPayload) => Promise<SoRecord>
        createSOWithAutoPO: (data: CreateSalesOrderPayload) => Promise<CreateSalesOrderWithAutoPOResult>
        updateSO: (soId: number, data: SoPayload) => Promise<SoRecord>
        deleteSO: (soId: number) => Promise<{ success: true }>
        makeAPaymentForSo(
          soId: number,
          paymentPayload: SalesOrderPaymentPayload
        ): Promise<{ success: boolean; soId: number; isPaymentCompleted: 0 | 1 }>;
        completeChequePayment(
          soId: number,
          paymentId: number
        ): Promise<SOCompleteChequePaymentResult>;
        completeSO: (soId: number) => Promise<CompleteSalesOrderResult>;
        createReturn: (soId: number, data: SoReturnTyresPayload) => Promise<SoTyreRecord>
        getReturnsBySoId: (soId: number) => Promise<any[]>
        getAllocationsBySoTyreId: (soTyreId: number) => Promise<SoTyreStorageAllocationRecord[]>
        getAllocationsBySoBatteryId: (soBatteryId: number) => Promise<any[]>
      }

      paymentReceipt: {
        choose: () => Promise<(CashReceiptMetadata & { previewDataUrl: string }) | null>
        chooseMultiple: () => Promise<(CashReceiptMetadata & { previewDataUrl: string })[]>
        saveFromPath: (sourcePath: string) => Promise<
          CashReceiptMetadata & { previewDataUrl: string }
        >
        read: (meta: CashReceiptMetadata) => Promise<{ dataUrl: string }>
        open: (meta: CashReceiptMetadata) => Promise<{ success: boolean; filePath: string }>
        delete: (meta: CashReceiptMetadata) => Promise<{ success: boolean }>
        attach: (payload: {
          PaymentID: number
          PaymentTypeCode: string
          receipts: CashReceiptMetadata[]
        }) => Promise<{ attached: number }>
        remove: (payload: {
          PaymentID: number
          PaymentTypeCode: string
          receiptId: number
        }) => Promise<{ changes: number }>
      }

      getPathForFile: (file: File) => string

      soCustomers: {
        getSoCustomers: () => Promise<SoCustomerRecord[]>
        getSoCustomerByPair: (soId: number, customerId: number) => Promise<SoCustomerRecord>
        createSoCustomer: (data: SoCustomerPayload) => Promise<SoCustomerRecord>
        updateSoCustomer: (
          currentSoId: number,
          currentCustomerId: number,
          data: SoCustomerPayload
        ) => Promise<SoCustomerRecord>
        deleteSoCustomer: (soId: number, customerId: number) => Promise<{ success: true }>
      }

      soTyres: {
        getSoTyres: () => Promise<SoTyreRecord[]>
        getSoTyreByPair: (soId: number, tyreId: number) => Promise<SoTyreRecord>
        createSoTyre: (data: SoTyrePayload) => Promise<SoTyreRecord>
        updateSoTyre: (soId: number, tyreId: number, data: SoTyrePayload) => Promise<SoTyreRecord>
        deleteSoTyre: (soId: number, tyreId: number) => Promise<{ success: true }>
      }

      po: {
        getPOs: (category?: string) => Promise<PoRecord[]>
        getPendingPOCount: (category?: string) => Promise<PoPendingCount>
        getPOById: (id: number) => Promise<PoRecord>
        createPO: (data: PoPayload) => Promise<PoRecord>
        createStandalonePO: (data: CreatePoPayload | any) => Promise<PoRecord>
        updatePO: (id: number, data: PoPayload) => Promise<PoRecord>
        updateStandalonePO: (id: number, data: UpdateStandalonePoPayload | any) => Promise<PoRecord>
        deletePO: (id: number) => Promise<{ success: true }>
        updateSupplierApproval: (id: number, isApproved: boolean | null) => Promise<any>
        updateSupplierDeliveryDate: (id: number, dates: { ExpectedDeliveryDate?: string | null; ActualDeliveryDate?: string | null }) => Promise<any>
        setSupplierExpectedDeliveryDate: (id: number, expectedDeliveryDate: string | null) => Promise<any>
        setSupplierActualDeliveryDate: (id: number, actualDeliveryDate: string | null) => Promise<any>
        updatePOStatus: (id: number, statusCode: string) => Promise<any>
        allocateLocation: (payloads: PoTyreAllocationPayload[]) => Promise<any>
      }

      poTyres: {
        getPoTyres: () => Promise<PoTyreRecord[]>
        getPoTyreByPair: (poId: number, tyreId: number) => Promise<PoTyreRecord>
        createPoTyre: (data: PoTyrePayload) => Promise<PoTyreRecord>
        updatePoTyre: (poId: number, tyreId: number, data: PoTyrePayload) => Promise<PoTyreRecord>
        updatePoTyreStatus: (poTyresId: number, statusCode: string) => Promise<PoTyreRecord>
        deletePoTyre: (poId: number, tyreId: number) => Promise<{ success: true }>
        getPoTyreBatches: (poTyresId: number) => Promise<PoTyreBatchRecord[]>
        savePoTyreBatches: (poTyresId: number, batches: PoTyreBatchPayload[]) => Promise<PoTyreBatchRecord[]>
        getPoTyreBatchStatusByPoId: (poId: number) => Promise<PoTyreBatchStatusRecord[]>
      }

      goodsReceipts: {
        getByPOId: (poId: number) => Promise<GoodsReceiptLineRecord[]>
        getPending: (filters?: PendingGoodsReceiptFilters) => Promise<PendingGoodsReceiptRecord[]>
        post: (payload: GoodsReceiptPayload) => Promise<GoodsReceiptLineRecord>
        getPendingDag: () => Promise<PendingDagGoodsReceiptRecord[]>
        postDag: (payload: DagGoodsReceiptPayload) => Promise<DagGoodsReceiptResult>
      }

      dag: {
        getDAGs: () => Promise<DagRecord[]>
        getDAGById: (id: number) => Promise<DagRecord>
        getDetailedDAGById: (id: number) => Promise<DagDetailedRecord>
        createDAG: (data: DagPayload) => Promise<DagRecord>
        createDAGWithTyres: (data: CreateDagWithTyresPayload) => Promise<CreateDagWithTyresResult>
        processPayments: (id: number, payments: DagPaymentPayload) => Promise<void>
        sellTyres: (id: number, payload: SellDagTyresPayload) => Promise<SellDagTyresResult>
        updateDAG: (id: number, data: DagPayload) => Promise<DagRecord>
        updateDAGTyreSerialCost: (id: number, cost: number | null) => Promise<UpdateDagTyreSerialCostResult>
        deleteDAG: (id: number) => Promise<{ success: true }>
        issueGatePass: (id: number) => Promise<DagRecord>
        updateDAGStatus: (id: number, statusCode: string) => Promise<DagRecord>
        markDAGArrived: (id: number) => Promise<DagRecord>
        markDAGArriving: (id: number, deliveryDate: string) => Promise<DagRecord>
        updateDAGDeliveryDate: (id: number, deliveryDate: string) => Promise<DagRecord>
        assignContractor: (
          id: number,
          payload: DagContractorAssignmentPayload
        ) => Promise<DagContractorApprovalRecord>
        updateContractorApproval: (
          approvalId: number,
          approvalStatus: DagContractorApprovalStatus
        ) => Promise<DagContractorApprovalRecord>
        getContractorApprovals: (id: number) => Promise<DagContractorApprovalRecord[]>
        completeChequePayment: (
          id: number,
          paymentId: number
        ) => Promise<CompleteDagChequePaymentResult>
      }

      dagTyres: {
        getDAGTyres: () => Promise<DagTyreRecord[]>
        getDAGTyresByDAGId: (dagId: number) => Promise<DagTyreRecord[]>
        getDAGTyreById: (id: number) => Promise<DagTyreRecord>
        createDAGTyre: (data: DagTyrePayload) => Promise<DagTyreRecord>
        updateDAGTyre: (id: number, data: DagTyrePayload) => Promise<DagTyreRecord>
        deleteDAGTyre: (id: number) => Promise<{ success: true }>
      }

      dagGatePass: {
        getDAGGatePasses: () => Promise<DAGGatePassRecord[]>
        getDAGGatePassById: (id: number) => Promise<DAGGatePassRecord>
        getDAGGatePassByDAGId: (dagId: number) => Promise<DAGGatePassRecord>
        createDAGGatePass: (data: DAGGatePassPayload) => Promise<DAGGatePassRecord>
        updateDAGGatePass: (id: number, data: DAGGatePassPayload) => Promise<DAGGatePassRecord>
        deleteDAGGatePass: (id: number) => Promise<{ success: true }>
      }

      statuses: {
        getStatuses: () => Promise<StatusRecord[]>
        getStatusById: (id: number) => Promise<StatusRecord>
        getStatusByCode: (statusCode: string) => Promise<StatusRecord>
      }

      notificationEvents: {
        onChanged: (
          callback: (payload: NotificationCrudPayload) => void
        ) => (() => void) | void
        inquiryNotification: (
          callback: (
            payload: ReminderNotificationPayload
          ) => void
        ) => (() => void) | void
        removeAllListeners: () => void
      }

      chequePayments: {
        getChequePaymentByPaymentId(
          paymentId: number
        ): Promise<any>;

        createChequePayment(
          payload: any
        ): Promise<any>;

        deleteChequePaymentByPaymentId(
          paymentId: number
        ): Promise<any>;

        getSoIdByChequeReminderId(
          chequeReminderId: number
        ): Promise<number>;
      };

      printer: {
        getAll: () => Promise<PrinterInfo[]>
        testPrint: (printerName: string) => Promise<{ success: boolean }>
        getSelected: () => Promise<{ ID: number; Name: string } | undefined>
        setSelected: (name: string) => Promise<{ ID: number; Name: string }>
        clearSelected: () => Promise<{ changes: number }>
        printTemplate: (templateName: string, data: Record<string, unknown> | Record<string, unknown>[], deviceName: string) => Promise<{ success: boolean }>
        downloadTemplatePdf: (templateName: string, data: Record<string, unknown> | Record<string, unknown>[], defaultFileName: string) => Promise<{ success: boolean; canceled?: boolean; filePath?: string }>
      }

      salesReturn: {
        createRequest: (data: any) => Promise<any>
        inspectAndApprove: (data: any) => Promise<any>
        receiveToQuarantine: (data: any) => Promise<any>
        transferToSaleable: (data: any) => Promise<any>
        moveToScrapOrSupplier: (data: any) => Promise<any>
        reject: (data: any) => Promise<any>
        linkExchangeSalesOrder: (data: any) => Promise<any>
        list: () => Promise<any[]>
        getById: (salesReturnId: number) => Promise<any>
        getDetails: (salesReturnId: number) => Promise<any>
      }

      quarantine: {
        receiveToQuarantine: (data: any) => Promise<any>
        transferToSaleable: (data: any) => Promise<any>
        moveToScrapOrSupplier: (data: any) => Promise<any>
      }

      creditNote: {
        create: (data: any) => Promise<any>
        generateFromSalesReturn: (salesReturnId: number) => Promise<any>
        approve: (id: number) => Promise<any>
        cancel: (id: number, reason: string) => Promise<any>
        createRefund: (creditNoteId: number, data: any) => Promise<any>
        completeRefund: (refundId: number) => Promise<any>
        failRefund: (refundId: number, reason: string) => Promise<any>
        cancelRefund: (refundId: number, reason: string) => Promise<any>
        issueStoreCredit: (creditNoteId: number) => Promise<any>
        applyCustomerCredit: (customerId: number, invoiceId: number, amount: number) => Promise<any>
        getById: (id: number) => Promise<any>
        getByInvoiceId: (invoiceId: number) => Promise<any>
        getBySalesReturnId: (salesReturnId: number) => Promise<any>
        getCustomerCredit: (customerId: number) => Promise<any>
        getCustomerCreditTransactions: (customerId: number, limit?: number) => Promise<any>
        getRefundsByCreditNoteId: (creditNoteId: number) => Promise<any>
        getRefundsBySalesReturnId: (salesReturnId: number) => Promise<any>
        getPendingRefunds: () => Promise<any>
        getRefundMethods: () => Promise<Array<{ MethodId: number; MethodCode: string; MethodName: string }>>
        getCustomerCredit: (customerId: number) => Promise<any>
      }

      //auth
      auth: {
        login: (data: { username: string; password: string }) => Promise<User>
        getUser: () => Promise<User | null>
        clearUser: () => Promise<void>
        changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean }>
        onUnauthorized: (callback: () => void) => () => void
      }

      // Web edition: admin panel channels (see backend/apps/electron/ipc/admin.ipc.js)
      admin: {
        getCloudinaryConfig: () => Promise<any>
        setCloudinaryConfig: (config: any) => Promise<any>
        listUsers: () => Promise<any[]>
        listRoles: () => Promise<any[]>
        createUser: (payload: any) => Promise<{ id: number }>
        updateUser: (userId: number, payload: any) => Promise<{ success: boolean }>
        resetPassword: (userId: number, newPassword: string) => Promise<{ success: boolean }>
        getSchemaStatus: () => Promise<any>
        getTableCounts: () => Promise<{ name: string; rows: number }[]>
        seedSampleData: (options: { includeStock?: boolean }) => Promise<any>
      }

      onError: (callback: (info: IpcErrorInfo) => void) => () => void

      violations: {
        getBySoId: (soId: number) => Promise<any[]>
        getByTyreId: (soTyreId: number) => Promise<any[]>
        getAll: (filters?: any) => Promise<any[]>
        getPending: () => Promise<any[]>
        getById: (violationId: number) => Promise<any>
        approve: (violationId: number, payload: any) => Promise<any>
        reject: (violationId: number, rejectReason: string) => Promise<any>
        create: (data: any) => Promise<any>
        getDOTsByViolationId: (violationId: number) => Promise<any[]>
      }

      reports: {
        getOverview: (params?: ReportQueryParams) => Promise<SalesReportOverview>
        getTransactions: (params?: ReportQueryParams) => Promise<SalesTransactionsReportResult>
        exportToCsv: (params?: ExportReportParams) => Promise<ReportExportResult>
        saveCsv: (params?: ExportReportParams) => Promise<SaveCsvResult>

        getPoOverview: (params?: PoReportQueryParams) => Promise<PoReportOverview>
        getPoTransactions: (params?: PoReportQueryParams) => Promise<PoTransactionsReportResult>
        exportPoToCsv: (params?: ExportPoReportParams) => Promise<ReportExportResult>
        savePoCsv: (params?: ExportPoReportParams) => Promise<SaveCsvResult>

        getCashFlowOverview: (params?: CashFlowReportQueryParams) => Promise<CashFlowOverview>
        getCashFlowLedger: (params?: CashFlowReportQueryParams) => Promise<CashFlowLedgerResult>
        exportCashFlowToCsv: (params?: ExportCashFlowParams) => Promise<ReportExportResult>
        saveCashFlowCsv: (params?: ExportCashFlowParams) => Promise<SaveCsvResult>

        getBatteryOverview: (params?: BatteryReportQueryParams) => Promise<BatteryReportOverview>
        getBatteryTransactions: (params?: BatteryReportQueryParams) => Promise<BatteryTransactionsReportResult>
        exportBatteryToCsv: (params?: ExportBatteryReportParams) => Promise<ReportExportResult>
        saveBatteryCsv: (params?: ExportBatteryReportParams) => Promise<SaveCsvResult>
      }
    }
  }
}
