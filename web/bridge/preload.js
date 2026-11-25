// Web edition of apps/electron/preload/preload.js. The API surface exposed as
// window.api is unchanged; ipcRenderer is backed by the backend Web Worker.
import { contextBridge, ipcRenderer, webUtils } from "./electronRenderer"
import { pickFiles } from "./mainHandlers"

const RECEIPT_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf"

const unauthorizedListeners = []
const errorListeners = []

function notifyUnauthorized() {
  for (const callback of unauthorizedListeners) {
    try {
      callback()
    } catch (error) {
      console.error("onUnauthorized callback error", error)
    }
  }
}

function registerUnauthorizedListener(callback) {
  unauthorizedListeners.push(callback)

  return () => {
    const index = unauthorizedListeners.indexOf(callback)
    if (index !== -1) {
      unauthorizedListeners.splice(index, 1)
    }
  }
}

function notifyError(info) {
  for (const callback of errorListeners) {
    try {
      callback(info)
    } catch (error) {
      console.error("onError callback error", error)
    }
  }
}

function registerErrorListener(callback) {
  errorListeners.push(callback)

  return () => {
    const index = errorListeners.indexOf(callback)
    if (index !== -1) {
      errorListeners.splice(index, 1)
    }
  }
}

const invoke = ipcRenderer.invoke.bind(ipcRenderer)

// In-band marker matching apps/electron/ipc/errorMiddleware.js. Errors thrown
// with this prefix are expected failures (e.g. background polling) and must not
// surface a global toast.
const SILENT_PREFIX = "\u0000TM_SILENT\u0000"

function toErrorMessage(error) {
  if (error instanceof Error) {
    return error.message || String(error)
  }
  if (error && typeof error.message === "string") {
    return error.message
  }
  return String(error ?? "Unknown error")
}

function parseSilent(message) {
  const markerIndex = message.indexOf(SILENT_PREFIX)

  if (markerIndex === -1) {
    return { silent: false, message }
  }

  return {
    silent: true,
    message: message.slice(0, markerIndex) + message.slice(markerIndex + SILENT_PREFIX.length),
  }
}

function invokeWithAuthGuard(channel, ...args) {
  return invoke(channel, ...args).catch((error) => {
    const raw = toErrorMessage(error)
    const { silent, message } = parseSilent(raw)

    if (message.includes("Unauthorized")) {
      notifyUnauthorized()
    }

    if (!silent) {
      notifyError({
        channel,
        message,
      })
      console.error(`IPC error on channel "${channel}"`, error)
    }

    const sanitized = new Error(message)
    sanitized.original = error
    throw sanitized
  })
}

ipcRenderer.invoke = invokeWithAuthGuard

const api = {
  devTempLock: {
    getStatus: () => ipcRenderer.invoke("devTempLock:getStatus"),
  },
  products: {
    getProducts: () => ipcRenderer.invoke("get-products")
  },

  suppliers: {
    suggest: (field, query) => ipcRenderer.invoke("suppliers:suggest", field, query),
    getSuppliers: () => ipcRenderer.invoke("suppliers:getAll"),
    getSupplierById: (supplierId) => ipcRenderer.invoke("suppliers:getById", supplierId),
    getSupplierTypes: () => ipcRenderer.invoke("suppliers:getTypes"),
    createSupplier: (data) => ipcRenderer.invoke("suppliers:create", data),
    updateSupplier: (supplierId, data) => ipcRenderer.invoke("suppliers:update", supplierId, data),
    deleteSupplier: (supplierId) => ipcRenderer.invoke("suppliers:delete", supplierId)
  },

  contractors: {
    suggest: (field, query) => ipcRenderer.invoke("contractors:suggest", field, query),
    getContractors: () => ipcRenderer.invoke("contractors:getAll"),
    getContractorById: (contractorId) => ipcRenderer.invoke("contractors:getById", contractorId),
    createContractor: (data) => ipcRenderer.invoke("contractors:create", data),
    updateContractor: (contractorId, data) => ipcRenderer.invoke("contractors:update", contractorId, data),
    deleteContractor: (contractorId) => ipcRenderer.invoke("contractors:delete", contractorId)
  },

  customers: {
    suggest: (field, query) => ipcRenderer.invoke("customers:suggest", field, query),
    getCustomers: () => ipcRenderer.invoke("customers:getAll"),
    getCustomerById: (customerId) => ipcRenderer.invoke("customers:getById", customerId),
    createCustomer: (data) => ipcRenderer.invoke("customers:create", data),
    updateCustomer: (customerId, data) => ipcRenderer.invoke("customers:update", customerId, data),
    deleteCustomer: (customerId) => ipcRenderer.invoke("customers:delete", customerId)
  },

  inquiries: {
    getInquiries: () => ipcRenderer.invoke("inquiries:getAll"),
    getInquiryById: (inquiryId) => ipcRenderer.invoke("inquiries:getById", inquiryId),
    createInquiry: (data) => ipcRenderer.invoke("inquiries:create", data),
    updateInquiry: (inquiryId, data) => ipcRenderer.invoke("inquiries:update", inquiryId, data),
    deleteInquiry: (inquiryId) => ipcRenderer.invoke("inquiries:delete", inquiryId),
    updateInquiryStatus: (inquiryId, status) =>
      ipcRenderer.invoke("inquiries:updateStatus", inquiryId, status),
    addReminder: (inquiryId, data) => ipcRenderer.invoke("inquiryReminders:add", inquiryId, data),
    updateReminder: (reminderId, data) =>
      ipcRenderer.invoke("inquiryReminders:update", reminderId, data),
    markReminderDone: (reminderId, isDone) =>
      ipcRenderer.invoke("inquiryReminders:markDone", reminderId, isDone),
    deleteReminder: (reminderId) => ipcRenderer.invoke("inquiryReminders:delete", reminderId)
},

  inquiryPo: {
    getByInquiryId: (inquiryId) => ipcRenderer.invoke("inquiryPo:getByInquiryId", inquiryId),
    getByPoId: (poId) => ipcRenderer.invoke("inquiryPo:getByPoId", poId),
    link: (inquiryId, poId) => ipcRenderer.invoke("inquiryPo:link", inquiryId, poId),
    unlink: (inquiryId, poId) => ipcRenderer.invoke("inquiryPo:unlink", inquiryId, poId)
  },

  inquirySo: {
    getByInquiryId: (inquiryId) => ipcRenderer.invoke("inquirySo:getByInquiryId", inquiryId),
    getBySoId: (soId) => ipcRenderer.invoke("inquirySo:getBySoId", soId),
    link: (inquiryId, soId) => ipcRenderer.invoke("inquirySo:link", inquiryId, soId),
    unlink: (inquiryId, soId) => ipcRenderer.invoke("inquirySo:unlink", inquiryId, soId)
  },

  reminders: {
    getReminders: () => ipcRenderer.invoke("reminders:getAll"),
    getTodaysPendingReminders: () => ipcRenderer.invoke("reminders:getTodaysPending"),
    getPendingReminders: () => ipcRenderer.invoke("reminders:getPending"),
    getReminderById: (reminderId) => ipcRenderer.invoke("reminders:getById", reminderId),
    getReminderDetails: (reminderId) => ipcRenderer.invoke("reminders:getDetails", reminderId),
    createReminder: (data) => ipcRenderer.invoke("reminders:create", data),
    updateReminder: (reminderId, data) => ipcRenderer.invoke("reminders:update", reminderId, data),
    markReminderCompleted: (reminderId, isCompleted) =>
      ipcRenderer.invoke("reminders:markCompleted", reminderId, isCompleted),
    deleteReminder: (reminderId) => ipcRenderer.invoke("reminders:delete", reminderId),
    getSoIdBySOReminderId: (reminderId) => ipcRenderer.invoke("reminders:getSoIdBySOReminderId", reminderId),
    syncBatteryReminders: () => ipcRenderer.invoke("reminders:syncBatteryReminders"),
    syncTyreExpiryReminders: () => ipcRenderer.invoke("reminders:syncTyreExpiryReminders")
  },

  notifications: {
    getNotifications: () => ipcRenderer.invoke("notifications:getAll"),
    getNotificationById: (notificationId) => ipcRenderer.invoke("notifications:getById", notificationId),
    getNotificationByCode: (code) => ipcRenderer.invoke("notifications:getByCode", code),
    createNotification: (data) => ipcRenderer.invoke("notifications:create", data),
    updateNotification: (notificationId, data) =>
      ipcRenderer.invoke("notifications:update", notificationId, data),
    deleteNotification: (notificationId) => ipcRenderer.invoke("notifications:delete", notificationId),
    deleteAllNotifications: () => ipcRenderer.invoke("notifications:deleteAll")
  },

  errorAuditLogs: {
    getErrorAuditLogs: (options) => ipcRenderer.invoke("errorAuditLogs:getAll", options)
  },

  errorReporter: {
    report: (payload) => ipcRenderer.invoke("errors:reportRenderer", payload)
  },

  storageLocations: {
    suggest: (field, query) => ipcRenderer.invoke("storageLocations:suggest", field, query),
    getStorageLocations: () => ipcRenderer.invoke("storageLocations:getAll"),
    getStorageLocationsByBranch: (branchId) => ipcRenderer.invoke("storageLocations:getByBranch", branchId),
    getStorageLocationsByLocationType: (locationTypeId) => ipcRenderer.invoke("storageLocations:getByLocationType", locationTypeId),
    getStorageLocationById: (id) => ipcRenderer.invoke("storageLocations:getById", id),
    createStorageLocation: (data) => ipcRenderer.invoke("storageLocations:create", data),
    updateStorageLocation: (id, data) => ipcRenderer.invoke("storageLocations:update", id, data),
    deleteStorageLocation: (id) => ipcRenderer.invoke("storageLocations:delete", id)
  },

  storageLocationTypes: {
    suggest: (field, query) => ipcRenderer.invoke("storageLocationTypes:suggest", field, query),
    getStorageLocationTypes: () => ipcRenderer.invoke("storageLocationTypes:getAll"),
    getStorageLocationTypeById: (id) => ipcRenderer.invoke("storageLocationTypes:getById", id),
    createStorageLocationType: (data) => ipcRenderer.invoke("storageLocationTypes:create", data),
    updateStorageLocationType: (id, data) => ipcRenderer.invoke("storageLocationTypes:update", id, data),
    deleteStorageLocationType: (id) => ipcRenderer.invoke("storageLocationTypes:delete", id)
  },

  branches: {
    suggest: (field, query) => ipcRenderer.invoke("branches:suggest", field, query),
    getBranches: () => ipcRenderer.invoke("branches:getAll"),
    getBranchById: (id) => ipcRenderer.invoke("branches:getById", id),
    createBranch: (data) => ipcRenderer.invoke("branches:create", data),
    updateBranch: (id, data) => ipcRenderer.invoke("branches:update", id, data),
    deleteBranch: (id) => ipcRenderer.invoke("branches:delete", id)
  },

  storageManagers: {
    getStorageManagers: () => ipcRenderer.invoke("storageManagers:getAll"),
    getStorageManagersByLocation: (locationId) => ipcRenderer.invoke("storageManagers:getByLocation", locationId),
    getStorageManagerById: (id) => ipcRenderer.invoke("storageManagers:getById", id),
    getStorageManagersByTyreId: (tyreId) => ipcRenderer.invoke("storageManagers:getByTyreId", tyreId),
    getBatchesByTyreId: (tyreId) => ipcRenderer.invoke("storageManagers:getBatchesByTyreId", tyreId),
    getBatchesByStorageManagerId: (id) => ipcRenderer.invoke("storageManagers:getBatchesByStorageManagerId", id),
    getBatchesByLocation: (locationId) => ipcRenderer.invoke("storageManagers:getBatchesByLocation", locationId),
    createStorageManager: (data) => ipcRenderer.invoke("storageManagers:create", data),
    updateStorageManager: (id, data) => ipcRenderer.invoke("storageManagers:update", id, data),
    deleteStorageManager: (id) => ipcRenderer.invoke("storageManagers:delete", id)
  },

  consumables: {
    suggest: (field, query) => ipcRenderer.invoke("consumables:suggest", field, query),
    getConsumables: () => ipcRenderer.invoke("consumables:getAll"),
    getConsumableById: (id) => ipcRenderer.invoke("consumables:getById", id),
      getConsumablesByCategory: (category) => ipcRenderer.invoke("consumables:getByCategory", category),
      getConsumablesWithStock: () => ipcRenderer.invoke("consumables:getWithStock"),
      getLowStockCount: () => ipcRenderer.invoke("consumables:getLowStockCount"),
    createConsumable: (data) => ipcRenderer.invoke("consumables:create", data),
    updateConsumable: (id, data) => ipcRenderer.invoke("consumables:update", id, data),
    deleteConsumable: (id) => ipcRenderer.invoke("consumables:delete", id)
  },

  consumableLocations: {
    suggest: (field, query) => ipcRenderer.invoke("consumableLocations:suggest", field, query),
    getConsumableLocations: () => ipcRenderer.invoke("consumableLocations:getAll"),
    getConsumableLocationsByBranch: (branchId) => ipcRenderer.invoke("consumableLocations:getByBranch", branchId),
    getConsumableLocationById: (id) => ipcRenderer.invoke("consumableLocations:getById", id),
    createConsumableLocation: (data) => ipcRenderer.invoke("consumableLocations:create", data),
    updateConsumableLocation: (id, data) => ipcRenderer.invoke("consumableLocations:update", id, data),
    deleteConsumableLocation: (id) => ipcRenderer.invoke("consumableLocations:delete", id)
  },

  batteryLocations: {
    suggest: (field, query) => ipcRenderer.invoke("batteryLocations:suggest", field, query),
    getBatteryLocations: () => ipcRenderer.invoke("batteryLocations:getAll"),
    getBatteryLocationsByBranch: (branchId) => ipcRenderer.invoke("batteryLocations:getByBranch", branchId),
    getBatteryLocationById: (id) => ipcRenderer.invoke("batteryLocations:getById", id),
    createBatteryLocation: (data) => ipcRenderer.invoke("batteryLocations:create", data),
    updateBatteryLocation: (id, data) => ipcRenderer.invoke("batteryLocations:update", id, data),
    deleteBatteryLocation: (id) => ipcRenderer.invoke("batteryLocations:delete", id)
  },

  consumableStorageManagers: {
    getConsumableStorageManagers: () => ipcRenderer.invoke("consumableStorageManagers:getAll"),
    getConsumableStorageManagersByLocation: (locationId) => ipcRenderer.invoke("consumableStorageManagers:getByLocation", locationId),
    getConsumableStorageManagerById: (id) => ipcRenderer.invoke("consumableStorageManagers:getById", id),
    createConsumableStorageManager: (data) => ipcRenderer.invoke("consumableStorageManagers:create", data),
    updateConsumableStorageManager: (id, data) => ipcRenderer.invoke("consumableStorageManagers:update", id, data),
    deleteConsumableStorageManager: (id) => ipcRenderer.invoke("consumableStorageManagers:delete", id)
  },

  stockSnapshots: {
    getStockSnapshots: () => ipcRenderer.invoke("stockSnapshots:getAll"),
    getStockSnapshotByTyreId: (tyreId) => ipcRenderer.invoke("stockSnapshots:getByTyreId", tyreId)
  },

  tyres: {
    suggest: (field, query) => ipcRenderer.invoke("tyres:suggest", field, query),
    getTyres: () => ipcRenderer.invoke("tyres:getAll"),
    getTyresWithAvailableQuantity: () => ipcRenderer.invoke("tyres:getAllWithAvailableQuantity"),
    getLowStockCount: () => ipcRenderer.invoke("tyres:getLowStockCount"),
    getTyreById: (tyreId) => ipcRenderer.invoke("tyres:getById", tyreId),
    getTyreByIdWithAvailableQuantity: (tyreId) => ipcRenderer.invoke("tyres:getByIdWithAvailableQuantity", tyreId),
    createTyre: (data) => ipcRenderer.invoke("tyres:create", data),
    updateTyre: (tyreId, data) => ipcRenderer.invoke("tyres:update", tyreId, data),
    deleteTyre: (tyreId) => ipcRenderer.invoke("tyres:delete", tyreId)
  },

  tyreSuppliers: {
    getSuppliersByTyreId: (tyreId) => ipcRenderer.invoke("tyreSuppliers:getSuppliersByTyreId", tyreId),
    createTyreSupplier: (data) => ipcRenderer.invoke("tyreSuppliers:create", data)
  },

  batteries: {
    suggest: (field, query) => ipcRenderer.invoke("batteries:suggest", field, query),
    getBatteries: () => ipcRenderer.invoke("batteries:getAll"),
    getBatteriesWithAvailableQuantity: () => ipcRenderer.invoke("batteries:getAllWithAvailableQuantity"),
    getLowStockCount: () => ipcRenderer.invoke("batteries:getLowStockCount"),
    getBatteryById: (batteryId) => ipcRenderer.invoke("batteries:getById", batteryId),
    getBatteryByIdWithAvailableQuantity: (batteryId) => ipcRenderer.invoke("batteries:getByIdWithAvailableQuantity", batteryId),
    createBattery: (data) => ipcRenderer.invoke("batteries:create", data),
    updateBattery: (batteryId, data) => ipcRenderer.invoke("batteries:update", batteryId, data),
    deleteBattery: (batteryId) => ipcRenderer.invoke("batteries:delete", batteryId)
  },

  batterySuppliers: {
    getSuppliersByBatteryId: (batteryId) => ipcRenderer.invoke("batterySuppliers:getSuppliersByBatteryId", batteryId),
    createBatterySupplier: (data) => ipcRenderer.invoke("batterySuppliers:create", data)
  },

  batteryStorageManagers: {
    getBatteryStorageManagers: () => ipcRenderer.invoke("batteryStorageManagers:getAll"),
    getBatteryStorageManagersByLocation: (locationId) =>
      ipcRenderer.invoke("batteryStorageManagers:getByLocation", locationId),
    getBatteryStorageManagerById: (id) =>
      ipcRenderer.invoke("batteryStorageManagers:getById", id),
    getBatteryStorageManagersByBatteryId: (batteryId) =>
      ipcRenderer.invoke("batteryStorageManagers:getByBatteryId", batteryId),
    getBatchesByBatteryId: (batteryId) =>
      ipcRenderer.invoke("batteryStorageManagers:getBatchesByBatteryId", batteryId),
    getBatchesByStorageManagerId: (id) =>
      ipcRenderer.invoke("batteryStorageManagers:getBatchesByStorageManagerId", id),
    getBatchesByLocation: (locationId) =>
      ipcRenderer.invoke("batteryStorageManagers:getBatchesByLocation", locationId),
    getStorageLocationsByBranch: (branchId) =>
      ipcRenderer.invoke("batteryStorageManagers:getLocationsByBranch", branchId),
    getStorageLocationById: (id) =>
      ipcRenderer.invoke("batteryStorageManagers:getLocationById", id),
    createBatteryStorageManager: (data) =>
      ipcRenderer.invoke("batteryStorageManagers:create", data),
    updateBatteryStorageManager: (id, data) =>
      ipcRenderer.invoke("batteryStorageManagers:update", id, data),
    deleteBatteryStorageManager: (id) =>
      ipcRenderer.invoke("batteryStorageManagers:delete", id),
    createBatch: (storageManagerId, data) =>
      ipcRenderer.invoke("batteryStorageManagers:createBatch", storageManagerId, data),
    updateBatch: (id, data) =>
      ipcRenderer.invoke("batteryStorageManagers:updateBatch", id, data),
    deleteBatch: (id) =>
      ipcRenderer.invoke("batteryStorageManagers:deleteBatch", id),
  },

  so: {
    getSOs: (category) => ipcRenderer.invoke("so:getAll", category),
    getTodaySalesSummary: (date) => ipcRenderer.invoke("so:getTodaySalesSummary", date),
    getSalesTrendSummary: (fromDate, toDate) => ipcRenderer.invoke("so:getSalesTrendSummary", fromDate, toDate),
    getSOById: (soId) => ipcRenderer.invoke("so:getById", soId),
    getTyresBySoId: (soId) => ipcRenderer.invoke("so:getTyresBySoId", soId),
    getBatteriesBySoId: (soId) => ipcRenderer.invoke("so:getBatteriesBySoId", soId),
    getWarehouseDispatch: (soId) => ipcRenderer.invoke("so:getWarehouseDispatch", soId),
    getDeliveryWarehouseDispatch: (soId, deliveryId) => ipcRenderer.invoke("so:getDeliveryWarehouseDispatch", soId, deliveryId),
    getDeliveryProgress: (soId) => ipcRenderer.invoke("so:getDeliveryProgress", soId),
    getDeliveries: (soId) => ipcRenderer.invoke("so:getDeliveries", soId),
    getDeliveryById: (deliveryId) => ipcRenderer.invoke("so:getDeliveryById", deliveryId),
    getGatePasses: () => ipcRenderer.invoke("so:getGatePasses"),
    getPendingGatePasses: () => ipcRenderer.invoke("so:getPendingGatePasses"),
    recordDelivery: (soId, payload) => ipcRenderer.invoke("so:recordDelivery", soId, payload),
    issueDeliveryGatePass: (soId, deliveryId, options) => ipcRenderer.invoke("so:issueDeliveryGatePass", soId, deliveryId, options),
    createSO: (data) => ipcRenderer.invoke("so:create", data),
    createSOWithAutoPO: (data) => ipcRenderer.invoke("so:createWithAutoPO", data),
    updateSO: (soId, data) => ipcRenderer.invoke("so:update", soId, data),
    deleteSO: (soId) => ipcRenderer.invoke("so:delete", soId),
    makeAPaymentForSo: (soId, data) => ipcRenderer.invoke("so:makeAPayment", soId, data),
    completeChequePayment: (soId, paymentId) => ipcRenderer.invoke("so:completeChequePayment", soId, paymentId),
    createReturn: (soId, data) => ipcRenderer.invoke("so:createReturn", soId, data),
    getReturnsBySoId: (soId) => ipcRenderer.invoke("so:getReturnsBySoId", soId),
    getAllocationsBySoTyreId: (soTyreId) => ipcRenderer.invoke("so:getAllocationsBySoTyreId", soTyreId),
    getAllocationsBySoBatteryId: (soBatteryId) => ipcRenderer.invoke("so:getAllocationsBySoBatteryId", soBatteryId),
    completeSO: (soId) => ipcRenderer.invoke("so:complete", soId)
  },

  paymentReceipt: {
    // Browsers only open file pickers during a user gesture, so the picker is
    // opened here (UI thread) before handing the file to the backend.
    choose: async () => {
      const [file] = await pickFiles({ multiple: false, accept: RECEIPT_ACCEPT })
      if (!file) return null
      return ipcRenderer.invoke("paymentReceipt:saveFromPath", webUtils.getPathForFile(file))
    },
    chooseMultiple: async () => {
      const files = await pickFiles({ multiple: true, accept: RECEIPT_ACCEPT })
      const results = []
      for (const file of files) {
        results.push(await ipcRenderer.invoke("paymentReceipt:saveFromPath", webUtils.getPathForFile(file)))
      }
      return results
    },
    saveFromPath: (sourcePath) => ipcRenderer.invoke("paymentReceipt:saveFromPath", sourcePath),
    read: (meta) => ipcRenderer.invoke("paymentReceipt:read", meta),
    open: (meta) => ipcRenderer.invoke("paymentReceipt:open", meta),
    delete: (meta) => ipcRenderer.invoke("paymentReceipt:delete", meta),
    attach: (payload) => ipcRenderer.invoke("paymentReceipt:attach", payload),
    remove: (payload) => ipcRenderer.invoke("paymentReceipt:remove", payload)
  },

  getPathForFile: (file) => webUtils.getPathForFile(file),

  soCustomers: {
    getSoCustomers: () => ipcRenderer.invoke("soCustomers:getAll"),
    getSoCustomerByPair: (soId, customerId) => ipcRenderer.invoke("soCustomers:getByPair", soId, customerId),
    createSoCustomer: (data) => ipcRenderer.invoke("soCustomers:create", data),
    updateSoCustomer: (currentSoId, currentCustomerId, data) => ipcRenderer.invoke("soCustomers:update", currentSoId, currentCustomerId, data),
    deleteSoCustomer: (soId, customerId) => ipcRenderer.invoke("soCustomers:delete", soId, customerId)
  },

  otherServices: {
    getOtherServices: () => ipcRenderer.invoke("otherServices:getAll"),
    getOtherServiceById: (osId) => ipcRenderer.invoke("otherServices:getById", osId),
    createOtherService: (data) => ipcRenderer.invoke("otherServices:create", data),
    updateOtherService: (osId, data) => ipcRenderer.invoke("otherServices:update", osId, data),
    deleteOtherService: (osId) => ipcRenderer.invoke("otherServices:delete", osId),
    makeAPaymentForOS: (osId, data) => ipcRenderer.invoke("otherServices:makeAPayment", osId, data),
    completeChequePayment: (osId, paymentId) => ipcRenderer.invoke("otherServices:completeChequePayment", osId, paymentId),
    completeOtherService: (osId) => ipcRenderer.invoke("otherServices:complete", osId),
  },

  invoices: {
    getInvoices: () => ipcRenderer.invoke("invoice:getAll"),
    getOutstandingInvoices: () => ipcRenderer.invoke("invoice:getOutstanding"),
    getInvoiceById: (invoiceId) => ipcRenderer.invoke("invoice:getById", invoiceId),
    getBySource: (sourceType, sourceId) => ipcRenderer.invoke("invoice:getBySource", sourceType, sourceId),
    generateFromSO: (soId) => ipcRenderer.invoke("invoice:generateFromSO", soId),
    generateFromDAG: (dagId) => ipcRenderer.invoke("invoice:generateFromDAG", dagId),
    generateFromOtherService: (osId) => ipcRenderer.invoke("invoice:generateFromOtherService", osId),
    generateFromDelivery: (deliveryId) => ipcRenderer.invoke("invoice:generateFromDelivery", deliveryId),
    createDirect: (data) => ipcRenderer.invoke("invoice:createDirect", data),
    updateInvoice: (invoiceId, data) => ipcRenderer.invoke("invoice:update", invoiceId, data),
    cancelInvoice: (invoiceId, data) => ipcRenderer.invoke("invoice:cancel", invoiceId, data),
    createCreditNote: (invoiceId, data) => ipcRenderer.invoke("invoice:createCreditNote", invoiceId, data),
    recordPayment: (invoiceId, data) => ipcRenderer.invoke("invoice:recordPayment", invoiceId, data),
  },

  soTyres: {
    getSoTyres: () => ipcRenderer.invoke("soTyres:getAll"),
    getSoTyreByPair: (soId, tyreId) => ipcRenderer.invoke("soTyres:getByPair", soId, tyreId),
    createSoTyre: (data) => ipcRenderer.invoke("soTyres:create", data),
    updateSoTyre: (soId, tyreId, data) => ipcRenderer.invoke("soTyres:update", soId, tyreId, data),
    deleteSoTyre: (soId, tyreId) => ipcRenderer.invoke("soTyres:delete", soId, tyreId)
  },

  po: {
    getPOs: (category) => ipcRenderer.invoke("po:getAll", category),
    getPendingPOCount: (category) => ipcRenderer.invoke("po:getPendingPOCount", category),
    getPOById: (id) => ipcRenderer.invoke("po:getById", id),
    createPO: (data) => ipcRenderer.invoke("po:create", data),
    createStandalonePO: (data) => ipcRenderer.invoke("po:createStandalone", data),
    updatePO: (id, data) => ipcRenderer.invoke("po:update", id, data),
    updateStandalonePO: (id, data) => ipcRenderer.invoke("po:updateStandalone", id, data),
    deletePO: (id) => ipcRenderer.invoke("po:delete", id),
    updateSupplierApproval: (id, isApproved) => ipcRenderer.invoke("po:updateSupplierApproval", id, isApproved),
    updateSupplierDeliveryDate: (id, dates) => ipcRenderer.invoke("po:updateSupplierDeliveryDate", id, dates),
    setSupplierExpectedDeliveryDate: (id, expectedDeliveryDate) => ipcRenderer.invoke("po:setSupplierExpectedDeliveryDate", id, expectedDeliveryDate),
    setSupplierActualDeliveryDate: (id, actualDeliveryDate) => ipcRenderer.invoke("po:setSupplierActualDeliveryDate", id, actualDeliveryDate),
    updatePOStatus: (id, statusCode) => ipcRenderer.invoke("po:updateStatus", id, statusCode),
    allocateLocation: (payloads) => ipcRenderer.invoke("po:allocateLocation", payloads),
  },

  poTyres: {
    getPoTyres: () => ipcRenderer.invoke("poTyres:getAll"),
    getPoTyreByPair: (poId, tyreId) => ipcRenderer.invoke("poTyres:getByPair", poId, tyreId),
    createPoTyre: (data) => ipcRenderer.invoke("poTyres:create", data),
    updatePoTyre: (poId, tyreId, data) => ipcRenderer.invoke("poTyres:update", poId, tyreId, data),
    updatePoTyreStatus: (poTyresId, statusCode) => ipcRenderer.invoke("poTyres:updateStatus", poTyresId, statusCode),
    deletePoTyre: (poId, tyreId) => ipcRenderer.invoke("poTyres:delete", poId, tyreId),
    getPoTyreBatches: (poTyresId) => ipcRenderer.invoke("poTyres:getBatches", poTyresId),
    savePoTyreBatches: (poTyresId, batches) => ipcRenderer.invoke("poTyres:saveBatches", poTyresId, batches),
    getPoTyreBatchStatusByPoId: (poId) => ipcRenderer.invoke("poTyres:getBatchStatusByPoId", poId),
  },

  manufactureOrders: {
    getManufactureOrders: () => ipcRenderer.invoke("manufactureOrders:getAll"),
    getManufactureOrderById: (id) => ipcRenderer.invoke("manufactureOrders:getById", id),
    createManufactureOrder: (data) => ipcRenderer.invoke("manufactureOrders:create", data),
    updateManufactureOrder: (id, data) => ipcRenderer.invoke("manufactureOrders:update", id, data),
    deleteManufactureOrder: (id) => ipcRenderer.invoke("manufactureOrders:delete", id)
  },

  dag: {
    getDAGs: () => ipcRenderer.invoke("dag:getAll"),
    getDAGById: (id) => ipcRenderer.invoke("dag:getById", id),
    getDetailedDAGById: (id) => ipcRenderer.invoke("dag:getDetailedById", id),
    createDAG: (data) => ipcRenderer.invoke("dag:create", data),
    createDAGWithTyres: (data) => ipcRenderer.invoke("dag:createWithTyres", data),
    processPayments: (id, payments) => ipcRenderer.invoke("dag:processPayments", id, payments),
    sellTyres: (id, payload) => ipcRenderer.invoke("dag:sellTyres", id, payload),
    updateDAG: (id, data) => ipcRenderer.invoke("dag:update", id, data),
    updateDAGTyreSerialCost: (id, cost) => ipcRenderer.invoke("dag:updateTyreSerialCost", id, cost),
    deleteDAG: (id) => ipcRenderer.invoke("dag:delete", id),
    issueGatePass: (id) => ipcRenderer.invoke("dag:issueGatePass", id),
    updateDAGStatus: (id, statusCode) => ipcRenderer.invoke("dag:updateStatus", id, statusCode),
    markDAGArrived: (id) => ipcRenderer.invoke("dag:markArrived", id),
    markDAGArriving: (id, deliveryDate) => ipcRenderer.invoke("dag:markArriving", id, deliveryDate),
    updateDAGDeliveryDate: (id, deliveryDate) => ipcRenderer.invoke("dag:updateDeliveryDate", id, deliveryDate),
    assignContractor: (id, payload) => ipcRenderer.invoke("dag:assignContractor", id, payload),
    updateContractorApproval: (approvalId, approvalStatus) =>
      ipcRenderer.invoke("dag:updateContractorApproval", approvalId, approvalStatus),
    getContractorApprovals: (id) => ipcRenderer.invoke("dag:getContractorApprovals", id),
    completeChequePayment: (id, paymentId) => ipcRenderer.invoke("dag:completeChequePayment", id, paymentId),
  },

  dagTyres: {
    getDAGTyres: () => ipcRenderer.invoke("dagTyres:getAll"),
    getDAGTyresByDAGId: (dagId) => ipcRenderer.invoke("dagTyres:getByDagId", dagId),
    getDAGTyreById: (id) => ipcRenderer.invoke("dagTyres:getById", id),
    createDAGTyre: (data) => ipcRenderer.invoke("dagTyres:create", data),
    updateDAGTyre: (id, data) => ipcRenderer.invoke("dagTyres:update", id, data),
    deleteDAGTyre: (id) => ipcRenderer.invoke("dagTyres:delete", id)
  },

  dagGatePass: {
    getDAGGatePasses: () => ipcRenderer.invoke("dagGatePass:getAll"),
    getDAGGatePassById: (id) => ipcRenderer.invoke("dagGatePass:getById", id),
    getDAGGatePassByDAGId: (dagId) => ipcRenderer.invoke("dagGatePass:getByDAGId", dagId),
    createDAGGatePass: (data) => ipcRenderer.invoke("dagGatePass:create", data),
    updateDAGGatePass: (id, data) => ipcRenderer.invoke("dagGatePass:update", id, data),
    deleteDAGGatePass: (id) => ipcRenderer.invoke("dagGatePass:delete", id)
  },

  statuses: {
    getStatuses: () => ipcRenderer.invoke("statuses:getAll"),
    getStatusById: (id) => ipcRenderer.invoke("statuses:getById", id),
    getStatusByCode: (statusCode) => ipcRenderer.invoke("statuses:getByCode", statusCode)
  },

  bankDetails: {
    suggest: (field, query) => ipcRenderer.invoke("bankDetails:suggest", field, query),
    getBankDetails: () => ipcRenderer.invoke("bank-details:get-all"),
    getBankDetailById: (id) => ipcRenderer.invoke("bank-details:get-by-id", id),
    createBankDetail: (payload) => ipcRenderer.invoke("bank-details:create", payload),
    updateBankDetail: (id, payload) => ipcRenderer.invoke("bank-details:update", id, payload),
    deleteBankDetail: (id) => ipcRenderer.invoke("bank-details:delete", id)
  },

  reminderEvents: {
    onChanged: (callback) => {
      ipcRenderer.on("reminder-changed", (_, payload) => {
        callback(payload);
      });
    },

    removeAllListeners: () => {
      ipcRenderer.removeAllListeners("reminder-changed");
    }
  },

  notificationEvents: {
    onChanged: (callback) => {
      const listener = (_, payload) => {
        callback(payload);
      };

      ipcRenderer.on("notification-changed", listener);

      return () => {
        ipcRenderer.removeListener("notification-changed", listener);
      };
    },

    inquiryNotification: (callback) => {

      const listener = (_, payload) => {
        callback(payload);
      };

      ipcRenderer.on(
        "inquiry-notification",
        listener
      );

      return () => {
        ipcRenderer.removeListener(
          "inquiry-notification",
          listener
        );
      };
    },

    removeAllListeners: () => {
      ipcRenderer.removeAllListeners("notification-changed");
      ipcRenderer.removeAllListeners("inquiry-notification");
    }
  },

  chequePayments: {
    getChequePaymentByPaymentId: (
      paymentId
    ) =>
      ipcRenderer.invoke(
        "cheque-payment:getByPaymentId",
        paymentId
      ),

    createChequePayment: (
      payload
    ) =>
      ipcRenderer.invoke(
        "cheque-payment:create",
        payload
      ),

    deleteChequePaymentByPaymentId: (
      paymentId
    ) =>
      ipcRenderer.invoke(
        "cheque-payment:deleteByPaymentId",
        paymentId
      ),

    getSoIdByChequeReminderId: (
      chequeReminderId
    ) =>
      ipcRenderer.invoke(
        "cheque-payment:getSoIdByChequeReminderId",
        chequeReminderId
      ),
  },

  printer: {
    getAll: () => ipcRenderer.invoke("printer:getAll"),
    testPrint: (printerName) => ipcRenderer.invoke("printer:testPrint", printerName),
    getSelected: () => ipcRenderer.invoke("printer:getSelected"),
    setSelected: (name) => ipcRenderer.invoke("printer:setSelected", name),
    clearSelected: () => ipcRenderer.invoke("printer:clearSelected"),
    printTemplate: (templateName, data, deviceName) => ipcRenderer.invoke("printer:printTemplate", templateName, data, deviceName),
    downloadTemplatePdf: (templateName, data, defaultFileName) => ipcRenderer.invoke("printer:downloadTemplatePdf", templateName, data, defaultFileName),
  },

  auth: {
    login: (data) => ipcRenderer.invoke("auth-login", data),

    getUser: () => ipcRenderer.invoke("auth:getUser"),

    clearUser: () => ipcRenderer.invoke("auth:clearUser"),

    changePassword: (currentPassword, newPassword) =>
      ipcRenderer.invoke("auth:changePassword", currentPassword, newPassword),

    onUnauthorized: registerUnauthorizedListener
  },

    goodsReceipts: {
      getByPOId: (poId) => ipcRenderer.invoke("goodsReceipts:getByPO", poId),
      getPending: (filters) => ipcRenderer.invoke("goodsReceipts:getPending", filters ?? {}),
      post: (payload) => ipcRenderer.invoke("goodsReceipts:post", payload),
      getPendingDag: () => ipcRenderer.invoke("goodsReceipts:getPendingDag"),
      postDag: (payload) => ipcRenderer.invoke("goodsReceipts:postDag", payload),
    },

  salesReturn: {
    createRequest: (data) => ipcRenderer.invoke("salesReturn:createRequest", data),
    inspectAndApprove: (data) => ipcRenderer.invoke("salesReturn:inspectAndApprove", data),
    receiveToQuarantine: (data) => ipcRenderer.invoke("salesReturn:receiveToQuarantine", data),
    transferToSaleable: (data) => ipcRenderer.invoke("salesReturn:transferToSaleable", data),
    moveToScrapOrSupplier: (data) => ipcRenderer.invoke("salesReturn:moveToScrapOrSupplier", data),
    reject: (data) => ipcRenderer.invoke("salesReturn:reject", data),
    linkExchangeSalesOrder: (data) => ipcRenderer.invoke("salesReturn:linkExchangeSalesOrder", data),
    list: () => ipcRenderer.invoke("salesReturn:list"),
    getById: (salesReturnId) => ipcRenderer.invoke("salesReturn:getById", salesReturnId),
    getDetails: (salesReturnId) => ipcRenderer.invoke("salesReturn:getDetails", salesReturnId),
  },

  quarantine: {
    receiveToQuarantine: (data) => ipcRenderer.invoke("quarantine:receiveToQuarantine", data),
    transferToSaleable: (data) => ipcRenderer.invoke("quarantine:transferToSaleable", data),
    moveToScrapOrSupplier: (data) => ipcRenderer.invoke("quarantine:moveToScrapOrSupplier", data),
  },

  creditNote: {
    create: (data) => ipcRenderer.invoke("creditNote:create", data),
    generateFromSalesReturn: (salesReturnId) => ipcRenderer.invoke("creditNote:generateFromSalesReturn", salesReturnId),
    approve: (id) => ipcRenderer.invoke("creditNote:approve", id),
    cancel: (id, reason) => ipcRenderer.invoke("creditNote:cancel", id, reason),
    createRefund: (creditNoteId, data) => ipcRenderer.invoke("creditNote:createRefund", creditNoteId, data),
    completeRefund: (refundId) => ipcRenderer.invoke("creditNote:completeRefund", refundId),
    failRefund: (refundId, reason) => ipcRenderer.invoke("creditNote:failRefund", refundId, reason),
    cancelRefund: (refundId, reason) => ipcRenderer.invoke("creditNote:cancelRefund", refundId, reason),
    issueStoreCredit: (creditNoteId) => ipcRenderer.invoke("creditNote:issueStoreCredit", creditNoteId),
    applyCustomerCredit: (customerId, invoiceId, amount) => ipcRenderer.invoke("creditNote:applyCustomerCredit", customerId, invoiceId, amount),
    getById: (id) => ipcRenderer.invoke("creditNote:getById", id),
    getByInvoiceId: (invoiceId) => ipcRenderer.invoke("creditNote:getByInvoiceId", invoiceId),
    getBySalesReturnId: (salesReturnId) => ipcRenderer.invoke("creditNote:getBySalesReturnId", salesReturnId),
    getCustomerCredit: (customerId) => ipcRenderer.invoke("creditNote:getCustomerCredit", customerId),
    getCustomerCreditTransactions: (customerId, limit) => ipcRenderer.invoke("creditNote:getCustomerCreditTransactions", customerId, limit),
    getRefundsByCreditNoteId: (creditNoteId) => ipcRenderer.invoke("creditNote:getRefundsByCreditNoteId", creditNoteId),
    getRefundsBySalesReturnId: (salesReturnId) => ipcRenderer.invoke("creditNote:getRefundsBySalesReturnId", salesReturnId),
    getPendingRefunds: () => ipcRenderer.invoke("creditNote:getPendingRefunds"),
    getRefundMethods: () => ipcRenderer.invoke("creditNote:getRefundMethods"),
    getCustomerCredit: (customerId) => ipcRenderer.invoke("creditNote:getCustomerCredit", customerId),
  },

  violations: {
    getBySoId: (soId) => ipcRenderer.invoke("violations:getBySoId", soId),
    getByTyreId: (soTyreId) => ipcRenderer.invoke("violations:getByTyreId", soTyreId),
    getAll: (filters) => ipcRenderer.invoke("violations:getAll", filters),
    getPending: () => ipcRenderer.invoke("violations:getPending"),
    getById: (violationId) => ipcRenderer.invoke("violations:getById", violationId),
    approve: (violationId, payload) => ipcRenderer.invoke("violations:approve", violationId, payload),
    reject: (violationId, rejectReason) => ipcRenderer.invoke("violations:reject", violationId, { rejectReason }),
    create: (data) => ipcRenderer.invoke("violations:create", data),
    getDOTsByViolationId: (violationId) => ipcRenderer.invoke("violations:getDOTsByViolationId", violationId),
  },

  reports: {
    getOverview: (params) => ipcRenderer.invoke("reports:getOverview", params),
    getTransactions: (params) => ipcRenderer.invoke("reports:getTransactions", params),
    exportToCsv: (params) => ipcRenderer.invoke("reports:exportToCsv", params),
    saveCsv: (params) => ipcRenderer.invoke("reports:saveCsv", params),

    getPoOverview: (params) => ipcRenderer.invoke("reports:getPoOverview", params),
    getPoTransactions: (params) => ipcRenderer.invoke("reports:getPoTransactions", params),
    exportPoToCsv: (params) => ipcRenderer.invoke("reports:exportPoToCsv", params),
    savePoCsv: (params) => ipcRenderer.invoke("reports:savePoCsv", params),

    getCashFlowOverview: (params) => ipcRenderer.invoke("reports:getCashFlowOverview", params),
    getCashFlowLedger: (params) => ipcRenderer.invoke("reports:getCashFlowLedger", params),
    exportCashFlowToCsv: (params) => ipcRenderer.invoke("reports:exportCashFlowToCsv", params),
    saveCashFlowCsv: (params) => ipcRenderer.invoke("reports:saveCashFlowCsv", params),

    getBatteryOverview: (params) => ipcRenderer.invoke("reports:getBatteryOverview", params),
    getBatteryTransactions: (params) => ipcRenderer.invoke("reports:getBatteryTransactions", params),
    exportBatteryToCsv: (params) => ipcRenderer.invoke("reports:exportBatteryToCsv", params),
    saveBatteryCsv: (params) => ipcRenderer.invoke("reports:saveBatteryCsv", params),
  },

  // Web edition additions -------------------------------------------------
  salesTarget: {
    getAll: (filters) => ipcRenderer.invoke("salesTarget:getAll", filters),
    getById: (id) => ipcRenderer.invoke("salesTarget:getById", id),
    getMyActiveTargets: () => ipcRenderer.invoke("salesTarget:getMyActiveTargets"),
    create: (payload) => ipcRenderer.invoke("salesTarget:create", payload),
    update: (id, payload) => ipcRenderer.invoke("salesTarget:update", id, payload),
    delete: (id) => ipcRenderer.invoke("salesTarget:delete", id),
    getSalesReps: () => ipcRenderer.invoke("salesTarget:getSalesReps"),
  },

  admin: {
    getCloudinaryConfig: () => ipcRenderer.invoke("admin:getCloudinaryConfig"),
    setCloudinaryConfig: (config) => ipcRenderer.invoke("admin:setCloudinaryConfig", config),
    listUsers: () => ipcRenderer.invoke("admin:listUsers"),
    listRoles: () => ipcRenderer.invoke("admin:listRoles"),
    createUser: (payload) => ipcRenderer.invoke("admin:createUser", payload),
    updateUser: (userId, payload) => ipcRenderer.invoke("admin:updateUser", userId, payload),
    resetPassword: (userId, newPassword) => ipcRenderer.invoke("admin:resetPassword", userId, newPassword),
    getSchemaStatus: () => ipcRenderer.invoke("admin:getSchemaStatus"),
    getTableCounts: () => ipcRenderer.invoke("admin:getTableCounts"),
    seedSampleData: (options) => ipcRenderer.invoke("admin:seedSampleData", options ?? {}),
  },

  onError: registerErrorListener
}

export function installApi() {
  contextBridge.exposeInMainWorld("api", api)
}
