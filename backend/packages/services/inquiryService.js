const db = require("../database/connection");
const inquiryRepo = require("../repositories/inquiryRepository");
const walkinCustomerRepo = require("../repositories/walkinCustomerRepository");
const inquiryWalkinLinkRepo = require("../repositories/inquiryWalkinLinkRepository");
const reminderRepo = require("../repositories/inquiryReminderRepository");
const inquiryPoService = require("./inquiryPoService");
const inquirySoService = require("./inquirySoService");
const genericReminderRepo = require("../repositories/reminderRepository");
const customerRepo = require("../repositories/customerRepository");
const notificationService = require("./notificationService");
const { normalizeText } = require("../validation");
const {
  getReminderTypeId,
  REMINDER_TYPE_CODES
} = require("../constants/reminderTypeConstants");

const normalizeId = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`);
  }
  return parsed;
};

// Registered and walk-in customers are mutually exclusive, so an absent
// CustomerID is normalised to null rather than rejected.
const normalizeOptionalCustomerId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return normalizeId(value, "CustomerID");
};

const toWalkinCustomerPayload = (walkinCustomer = {}) => {
  const customerName = normalizeText(walkinCustomer.CustomerName);
  const customerPhone = normalizeText(walkinCustomer.CustomerPhone);
  const customerAddress = normalizeText(walkinCustomer.CustomerAddress);

  if (!customerName) throw new Error("Customer name is required");
  if (!customerPhone) throw new Error("Customer phone is required");
  if (!customerAddress) throw new Error("Customer address is required");

  return {
    CustomerName: customerName,
    CustomerPhone: customerPhone,
    CustomerAddress: customerAddress,
    CustomerEmail: normalizeText(walkinCustomer.CustomerEmail) || null,
    VehicleNumber: normalizeText(walkinCustomer.VehicleNumber) || null,
    TinNo: normalizeText(walkinCustomer.TinNo) || null,
    VatNo: normalizeText(walkinCustomer.VatNo) || null,
  };
};

const toCustomerSummary = (inquiry, walkinCustomer) =>
  walkinCustomer
    ? {
        IsWalkinCustomer: true,
        CustomerName: walkinCustomer.CustomerName,
        CustomerPhone: walkinCustomer.CustomerPhone,
        CustomerAddress: walkinCustomer.CustomerAddress,
        CustomerEmail: walkinCustomer.CustomerEmail,
        VehicleNumber: walkinCustomer.VehicleNumber,
        TinNo: walkinCustomer.TinNo,
        VatNo: walkinCustomer.VatNo,
      }
    : {
        IsWalkinCustomer: false,
        CustomerName: inquiry.CustomerName,
        CustomerCode: inquiry.CustomerCode,
      };

exports.getInquiries = () => {
  return inquiryRepo.getAllInquiries().map((inquiry) => ({
    ...inquiry,
    Customer: toCustomerSummary(
      inquiry,
      inquiryWalkinLinkRepo.getWalkinCustomerForInquiry(inquiry.InquiryID)
    ),
  }));
};

exports.getInquiryById = (id) => {
  const normalizedId = normalizeId(id, "InquiryID");
  const inquiry = inquiryRepo.getInquiryById(normalizedId);
  if (!inquiry) throw new Error("Inquiry not found");

  const tyres = inquiryRepo.getInquiryTyresByInquiryId(normalizedId);
  const walkinCustomer = inquiryWalkinLinkRepo.getWalkinCustomerForInquiry(normalizedId);
  const reminders = reminderRepo.getInquiryRemindersByInquiryId(normalizedId);
  const tyresWithOrders = tyres.map((tyre) => {
    const available = Number(tyre.AvailableQuantity ?? 0);
    const qty = Number(tyre.Qty ?? 0);
    return {
      ...tyre,
      AvailableQuantity: available,
      NeedToOrderQty: qty <= available ? 0 : qty - available,
    };
  });
  return {
    ...inquiry,
    tyres: tyresWithOrders,
    Customer: toCustomerSummary(inquiry, walkinCustomer),
    RequestedDate: reminders.length > 0 ? reminders[0].ReminderDate : null,
    LinkedPOs: inquiryPoService.getLinkedPosByInquiryId(normalizedId),
    LinkedSOs: inquirySoService.getLinkedSosByInquiryId(normalizedId),
  };
};

exports.getInquiryDetailsByReminderId = (reminderId) => {
  const normalizedReminderId = normalizeId(reminderId, "ReminderID");
  const inquiry = inquiryRepo.getInquiryByReminderId(normalizedReminderId);

  if (!inquiry) throw new Error("Inquiry not found for the given reminder");

  const tyres = inquiryRepo.getInquiryTyresByInquiryId(inquiry.InquiryID);
  const walkinCustomer = inquiryWalkinLinkRepo.getWalkinCustomerForInquiry(inquiry.InquiryID);
  const tyresWithOrders = tyres.map((tyre) => {
    const available = Number(tyre.AvailableQuantity ?? 0);
    const qty = Number(tyre.Qty ?? 0);
    return {
      ...tyre,
      AvailableQuantity: available,
      NeedToOrderQty: qty <= available ? 0 : qty - available,
    };
  });

  // Walk-in inquiries have no CustomerM row, so contact lookups are skipped.
  const contacts = inquiry.CustomerID
    ? customerRepo.getCustomerContactsByCustomerId(inquiry.CustomerID)
    : [];
  const emails = inquiry.CustomerID
    ? customerRepo.getCustomerEmailsByCustomerId(inquiry.CustomerID)
    : [];

  return {
    ...inquiry,
    tyres: tyresWithOrders,
    contacts,
    emails,
    Customer: toCustomerSummary(inquiry, walkinCustomer),
  };
};

exports.createInquiry = (payload) => {
  let inquiryId;
  const customerId = normalizeOptionalCustomerId(payload.CustomerID);
  const walkinData = customerId ? null : toWalkinCustomerPayload(payload.WalkinCustomer);

  const createTransaction = db.transaction(() => {
    const inquiryData = {
      Date: new Date().toISOString().slice(0, 10),
      CustomerID: customerId,
      Notes: payload.Notes || "",
      IsAdminApproved: 0,
      ConvertedSOID: null
    };

    inquiryId = inquiryRepo.createInquiry(inquiryData);

    if (walkinData) {
      const wc = walkinCustomerRepo.createWalkinCustomer(walkinData);
      inquiryWalkinLinkRepo.linkInquiryToWalkinCustomer(inquiryId, wc.ID);
    }

    if (payload.ReminderDate) {
      const reminderTypeId = getReminderTypeId('INQUIRY_FOLLOW_UP');
      const genericReminder = genericReminderRepo.createReminder({
        ReminderTypeID: reminderTypeId,
        IsCompleted: 0,
        Date: payload.ReminderDate
      });

      reminderRepo.createInquiryReminder({
        InquiryID: inquiryId,
        ReminderID: genericReminder.ID,
        ReminderDate: payload.ReminderDate,
        ReminderNote: payload.Notes || "Initial Follow-up",
        IsDone: 0
      });
    }

    if (payload.tyres && Array.isArray(payload.tyres)) {
      payload.tyres.forEach((tyre) => {
        inquiryRepo.createInquiryTyre({
          InquiryID: inquiryId,
          TyreID: normalizeId(tyre.TyreID, "TyreID"),
          Price: Number(tyre.Price) || 0,
          Discount: Number(tyre.Discount) || 0,
          Qty: Number(tyre.Qty) || 1,
          IsAdminApproved: 0
        });
      });
    }
  });

  createTransaction();

  notificationService.createNotification({
    code: `${REMINDER_TYPE_CODES.INQUIRY_FOLLOW_UP}${inquiryId}`,
    title: `Inquiry Follow-up ${inquiryId}`,
    description: payload.Notes || `Follow-up created for inquiry ${inquiryId}`,
    navigationPath: `/inquiries/${inquiryId}`
  });

  return this.getInquiryById(inquiryId);
};

exports.updateInquiry = (id, payload) => {
  const normalizedId = normalizeId(id, "InquiryID");
  const existing = inquiryRepo.getInquiryById(normalizedId);
  if (!existing) throw new Error("Inquiry not found");

  // An absent CustomerID means "keep the existing customer" on update, so only
  // an explicitly supplied value switches between registered and walk-in.
  const customerId =
    payload.CustomerID !== undefined
      ? normalizeOptionalCustomerId(payload.CustomerID)
      : existing.CustomerID;
  const isWalkin = customerId === null;
  const walkinData = isWalkin ? toWalkinCustomerPayload(payload.WalkinCustomer) : null;

  const updatedData = {
    Date: payload.Date || existing.Date,
    CustomerID: customerId,
    Notes: payload.Notes !== undefined ? payload.Notes : existing.Notes,
    IsAdminApproved: payload.IsAdminApproved !== undefined ? (payload.IsAdminApproved ? 1 : 0) : existing.IsAdminApproved,
    ConvertedSOID: payload.ConvertedSOID !== undefined ? payload.ConvertedSOID : existing.ConvertedSOID
  };

  const updateTransaction = db.transaction(() => {
    inquiryRepo.updateInquiry(normalizedId, updatedData);

    if (isWalkin) {
      const existing = inquiryWalkinLinkRepo.getWalkinCustomerForInquiry(normalizedId);
      if (existing) {
        walkinCustomerRepo.updateWalkinCustomer(existing.ID, walkinData);
      } else {
        const wc = walkinCustomerRepo.createWalkinCustomer(walkinData);
        inquiryWalkinLinkRepo.linkInquiryToWalkinCustomer(normalizedId, wc.ID);
      }
    } else {
      inquiryWalkinLinkRepo.unlinkInquiryWalkin(normalizedId);
    }

    if (payload.tyres && Array.isArray(payload.tyres)) {
      inquiryRepo.deleteInquiryTyresByInquiryId(normalizedId);
      payload.tyres.forEach((tyre) => {
        inquiryRepo.createInquiryTyre({
          InquiryID: normalizedId,
          TyreID: normalizeId(tyre.TyreID, "TyreID"),
          Price: Number(tyre.Price) || 0,
          Discount: Number(tyre.Discount) || 0,
          Qty: Number(tyre.Qty) || 1,
          IsAdminApproved: updatedData.IsAdminApproved
        });
      });
    }
  });

  updateTransaction();

  return this.getInquiryById(normalizedId);
};

exports.deleteInquiry = (id) => {
  const normalizedId = normalizeId(id, "InquiryID");

  const deleteTransaction = db.transaction(() => {
    inquiryWalkinLinkRepo.unlinkInquiryWalkin(normalizedId);
    inquiryRepo.deleteInquiryTyresByInquiryId(normalizedId);
    reminderRepo.deleteInquiryRemindersByInquiryId(normalizedId);
    const result = inquiryRepo.deleteInquiry(normalizedId);
    if (result.changes === 0) throw new Error("Inquiry not found");
  });

  deleteTransaction();

  return { success: true };
};

exports.updateInquiryStatus = (id, status) => {
  const normalizedId = normalizeId(id, "InquiryID");
  const approvalBit = status ? 1 : 0;

  const statusTransaction = db.transaction(() => {
    inquiryRepo.updateApprovalStatus(normalizedId, approvalBit);

    if (approvalBit) {
      inquiryRepo.approveAllTyresForInquiry(normalizedId);
    }
  });

  statusTransaction();

  return this.getInquiryById(normalizedId);
};

exports.addReminder = (inquiryId, payload) => {
  const normalizedInquiryId = normalizeId(inquiryId, "InquiryID");

  const reminderTypeId = getReminderTypeId('INQUIRY_FOLLOW_UP');
  const genericReminder = genericReminderRepo.createReminder({
    ReminderTypeID: reminderTypeId,
    IsCompleted: payload.IsDone ? 1 : 0,
    Date: payload.ReminderDate
  });

  return reminderRepo.createInquiryReminder({
    InquiryID: normalizedInquiryId,
    ReminderID: genericReminder.ID,
    ReminderDate: payload.ReminderDate,
    ReminderNote: payload.ReminderNote,
    IsDone: payload.IsDone ? 1 : 0
  });
};

exports.updateReminder = (reminderId, payload) => {
  const normalizedReminderId = normalizeId(reminderId, "ReminderID");
  const existing = reminderRepo.getInquiryReminderById(normalizedReminderId);
  if (!existing) throw new Error("Reminder not found");

  return reminderRepo.updateInquiryReminder(normalizedReminderId, {
    InquiryID: payload.InquiryID || existing.InquiryID,
    ReminderDate: payload.ReminderDate || existing.ReminderDate,
    ReminderNote: payload.ReminderNote || existing.ReminderNote,
    IsDone: payload.IsDone !== undefined ? (payload.IsDone ? 1 : 0) : existing.IsDone
  });
};

exports.markReminderDone = (reminderId, isDone) => {
  const normalizedReminderId = normalizeId(reminderId, "ReminderID");
  return reminderRepo.markInquiryReminderDone(normalizedReminderId, isDone ? 1 : 0);
};

exports.deleteReminder = (reminderId) => {
  const normalizedReminderId = normalizeId(reminderId, "ReminderID");
  const result = reminderRepo.deleteInquiryReminder(normalizedReminderId);
  if (result.changes === 0) throw new Error("Reminder not found");
  return { success: true };
};

exports.prepareForSOConversion = (id) => {
  const inquiry = this.getInquiryById(id);

  if (inquiry.IsAdminApproved !== 1) {
    throw new Error("Cannot convert to Sales Order: Inquiry must be Admin Approved first.");
  }

  if (inquiry.ConvertedSOID) {
    throw new Error("This Inquiry has already been converted to a Sales Order.");
  }

  return inquiry;
};

exports.markAsConverted = (id, soId) => {
  const inquiry = inquiryRepo.getInquiryById(id);
  if (!inquiry) throw new Error("Inquiry not found");

  const updatedData = {
    ...inquiry,
    ConvertedSOID: normalizeId(soId, "SoID")
  };
  inquiryRepo.updateInquiry(id, updatedData);
  return { success: true };
};
