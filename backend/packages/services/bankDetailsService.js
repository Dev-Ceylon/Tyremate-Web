const bankDetailsRepo = require("../repositories/bankDetailsRepository");
const masterDataAuditLogService = require("./masterDataAuditLogService");
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants");

const ENTITY_TYPE = "Bank Details";

const normalizeId = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`);
  }
  return parsed;
};

const normalizeRequiredText = (value, fieldName) => {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`);
  }
  const normalized = String(value).trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
};

exports.getBankDetails = () => {
  return bankDetailsRepo.getAllBankDetails();
};

exports.getBankDetailsById = (id) => {
  const normalizedId = normalizeId(id, "ID");
  const details = bankDetailsRepo.getBankDetailsById(normalizedId);

  if (!details) {
    throw new Error("Bank details not found");
  }

  return details;
};

exports.createBankDetails = (payload, ctx) => {
  const data = {
    BankName: normalizeRequiredText(payload.BankName, "BankName"),
    AccountNumber: normalizeRequiredText(payload.AccountNumber, "AccountNumber"),
    AccountName: normalizeRequiredText(payload.AccountName, "AccountName"),
    Branch: normalizeRequiredText(payload.Branch, "Branch"),
  };

  const createdBankDetails = bankDetailsRepo.createBankDetails(data);

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, createdBankDetails),
    after: createdBankDetails,
    ctx,
  });

  return createdBankDetails;
};

exports.updateBankDetails = (id, payload, ctx) => {
  const normalizedId = normalizeId(id, "ID");

  const current = bankDetailsRepo.getBankDetailsById(normalizedId);
  if (!current) {
    throw new Error("Bank details not found");
  }

  const data = {
    BankName: normalizeRequiredText(payload.BankName, "BankName"),
    AccountNumber: normalizeRequiredText(payload.AccountNumber, "AccountNumber"),
    AccountName: normalizeRequiredText(payload.AccountName, "AccountName"),
    Branch: normalizeRequiredText(payload.Branch, "Branch"),
  };

  const result = bankDetailsRepo.updateBankDetails(normalizedId, data);

  if (result.changes === 0) {
    throw new Error("Bank details not found");
  }

  const after = { ID: normalizedId, ...data };

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, after),
    before: current,
    after,
    ctx,
  });

  return after;
};

exports.deleteBankDetails = (id, ctx) => {
  const normalizedId = normalizeId(id, "ID");
  const before = bankDetailsRepo.getBankDetailsById(normalizedId);
  const result = bankDetailsRepo.deleteBankDetails(normalizedId);

  if (result.changes === 0) {
    throw new Error("Bank details not found");
  }

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.DELETE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, before),
    before,
    ctx,
  });

  return { success: true };
};