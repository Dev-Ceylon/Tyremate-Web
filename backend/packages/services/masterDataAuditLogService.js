const masterDataAuditLogRepo = require("../repositories/masterDataAuditLogRepository")

const toJson = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  try {
    return JSON.stringify(value)
  } catch (error) {
    return null
  }
}

exports.snapshot = toJson

const getRecordId = (record) =>
  record?.Id ?? record?.ID ?? record?.SupplierID ?? record?.CustomerID ?? null

const describeEntity = (entityType, record) => {
  if (!record) {
    return ""
  }

  switch (entityType) {
    case "Tyre": {
      const parts = [record.Brand, record.Size, record.Pattern].filter(Boolean)
      return parts.length > 0 ? parts.join(" ") : `Tyre #${record.Id}`
    }
    case "Supplier": {
      const label = [record.SupplierCode, record.Name].filter(Boolean).join(" - ")
      return label || `Supplier #${record.SupplierID}`
    }
    case "Customer": {
      const label = [record.CustomerCode, record.Name].filter(Boolean).join(" - ")
      return label || `Customer #${record.CustomerID}`
    }
    case "Contractor":
      return record.Name || `Contractor #${record.ID}`
    case "Branch": {
      const label = [record.BranchCode, record.BranchName].filter(Boolean).join(" - ")
      return label || `Branch #${record.Id}`
    }
    case "Consumable":
      return record.Name || `Consumable #${record.Id}`
    case "Storage Location": {
      const label = [record.LocationCode, record.LocationName].filter(Boolean).join(" - ")
      return label || `Storage location #${record.Id}`
    }
    case "Storage Location Type": {
      const label = [record.LocationTypeCode, record.LocationTypeName].filter(Boolean).join(" - ")
      return label || `Storage location type #${record.Id}`
    }
    case "Bank Details":
      return record.AccountName || record.AccountNumber || `Bank details #${record.ID}`
    case "Consumable Location": {
      const label = [record.LocationCode, record.LocationName].filter(Boolean).join(" - ")
      return label || `Consumable location #${record.Id}`
    }
    default:
      return `#${getRecordId(record)}`
  }
}

exports.describeEntity = describeEntity

exports.recordAction = ({ action, entityType, entityId, entityName, before, after, ctx }) => {
  try {
    const record = after || before

    masterDataAuditLogRepo.insertMasterDataAuditLog({
      action,
      entityType,
      entityId: entityId ?? getRecordId(record),
      entityName: entityName || describeEntity(entityType, record) || "",
      beforeData: toJson(before),
      afterData: toJson(after),
      changedBy: ctx?.changedBy ?? "system",
    })
  } catch (error) {
    console.error(`[MasterDataAuditLog] failed to record ${action} on ${entityType}`, error)
  }
}
