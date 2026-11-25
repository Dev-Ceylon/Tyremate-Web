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
    Category: inquiry.Category || "tyre",
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

  const category = (inquiry.Category || "tyre").toLowerCase();
  const isBattery = category === "battery";

  let tyresWithOrders = [];
  let batteriesWithOrders = [];

  if (isBattery) {
    const batteries = inquiryRepo.getInquiryBatteriesByInquiryId(normalizedId);
    batteriesWithOrders = batteries.map((battery) => {
      const available = Number(battery.AvailableQuantity ?? 0);
      const qty = Number(battery.Qty ?? 0);
      return {
        ...battery,
        AvailableQuantity: available,
        NeedToOrderQty: qty <= available ? 0 : qty - available,
      };
    });
  } else {
    const tyres = inquiryRepo.getInquiryTyresByInquiryId(normalizedId);
    tyresWithOrders = tyres.map((tyre) => {
      const available = Number(tyre.AvailableQuantity ?? 0);
      const qty = Number(tyre.Qty ?? 0);
      return {
        ...tyre,
        AvailableQuantity: available,
        NeedToOrderQty: qty <= available ? 0 : qty - available,
      };
    });
  }

  const walkinCustomer = inquiryWalkinLinkRepo.getWalkinCustomerForInquiry(normalizedId);
  const reminders = reminderRepo.getInquiryRemindersByInquiryId(normalizedId);

  return {
    ...inquiry,
    Category: category,
    tyres: tyresWithOrders,
    batteries: batteriesWithOrders,
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

  const category = (inquiry.Category || "tyre").toLowerCase();
  const isBattery = category === "battery";

  let tyresWithOrders = [];
  let batteriesWithOrders = [];

  if (isBattery) {
    const batteries = inquiryRepo.getInquiryBatteriesByInquiryId(inquiry.InquiryID);
    batteriesWithOrders = batteries.map((battery) => {
      const available = Number(battery.AvailableQuantity ?? 0);
      const qty = Number(battery.Qty ?? 0);
      return {
        ...battery,
        AvailableQuantity: available,
        NeedToOrderQty: qty <= available ? 0 : qty - available,
      };
    });
  } else {
    const tyres = inquiryRepo.getInquiryTyresByInquiryId(inquiry.InquiryID);
    tyresWithOrders = tyres.map((tyre) => {
      const available = Number(tyre.AvailableQuantity ?? 0);
      const qty = Number(tyre.Qty ?? 0);
      return {
        ...tyre,
        AvailableQuantity: available,
        NeedToOrderQty: qty <= available ? 0 : qty - available,
      };
    });
  }

  const walkinCustomer = inquiryWalkinLinkRepo.getWalkinCustomerForInquiry(inquiry.InquiryID);

  // Walk-in inquiries have no CustomerM row, so contact lookups are skipped.
  const contacts = inquiry.CustomerID
    ? customerRepo.getCustomerContactsByCustomerId(inquiry.CustomerID)
    : [];
  const emails = inquiry.CustomerID
    ? customerRepo.getCustomerEmailsByCustomerId(inquiry.CustomerID)
    : [];

  return {
    ...inquiry,
    Category: category,
    tyres: tyresWithOrders,
    batteries: batteriesWithOrders,
    contacts,
    emails,
    Customer: toCustomerSummary(inquiry, walkinCustomer),
  };
};

exports.createInquiry = (payload) => {
  let inquiryId;
  const customerId = normalizeOptionalCustomerId(payload.CustomerID);
  const walkinData = customerId ? null : toWalkinCustomerPayload(payload.WalkinCustomer);
  const category = (
    payload.Category ||
    (Array.isArray(payload.batteries) && payload.batteries.length > 0 ? "battery" : "tyre")
  ).toLowerCase();
  const isBattery = category === "battery";

  const createTransaction = db.transaction(() => {
    const inquiryData = {
      Date: new Date().toISOString().slice(0, 10),
      Category: category,
      CustomerID: customerId,
      Notes: payload.Notes || "",
      IsAdminApproved: payload.IsAdminApproved ? 1 : 0,
      ConvertedSOID: null,
      IsCompleted: 0,
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

    if (isBattery) {
      if (payload.batteries && Array.isArray(payload.batteries)) {
        payload.batteries.forEach((bat) => {
          inquiryRepo.createInquiryBattery({
            InquiryID: inquiryId,
            BatteryID: normalizeId(bat.BatteryID, "BatteryID"),
            Price: Number(bat.Price) || 0,
            Discount: Number(bat.Discount) || 0,
            Qty: Number(bat.Qty) || 1,
            IsAdminApproved: 0
          });
        });
      }
    } else {
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
    }
  });

  createTransaction();

  notificationService.createNotification({
    code: `${REMINDER_TYPE_CODES.INQUIRY_FOLLOW_UP}${inquiryId}`,
    title: `Inquiry Follow-up ${inquiryId}`,
    description: payload.Notes || `Follow-up created for inquiry ${inquiryId}`,
    navigationPath: `/inquiries/${inquiryId}`
  });

  return exports.getInquiryById(inquiryId);
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
  const category = (
    payload.Category ||
    existing.Category ||
    (Array.isArray(payload.batteries) && payload.batteries.length > 0 ? "battery" : "tyre")
  ).toLowerCase();
  const isBattery = category === "battery";

  const updatedData = {
    Date: payload.Date || existing.Date,
    Category: category,
    CustomerID: customerId,
    Notes: payload.Notes !== undefined ? payload.Notes : existing.Notes,
    IsAdminApproved: payload.IsAdminApproved !== undefined ? (payload.IsAdminApproved ? 1 : 0) : existing.IsAdminApproved,
    ConvertedSOID: payload.ConvertedSOID !== undefined ? payload.ConvertedSOID : existing.ConvertedSOID,
    IsCompleted: payload.IsCompleted !== undefined ? (payload.IsCompleted ? 1 : 0) : (existing.IsCompleted ? 1 : 0),
  };

  const updateTransaction = db.transaction(() => {
    inquiryRepo.updateInquiry(normalizedId, updatedData);

    if (isWalkin) {
      const existingWalkin = inquiryWalkinLinkRepo.getWalkinCustomerForInquiry(normalizedId);
      if (existingWalkin) {
        walkinCustomerRepo.updateWalkinCustomer(existingWalkin.ID, walkinData);
      } else {
        const wc = walkinCustomerRepo.createWalkinCustomer(walkinData);
        inquiryWalkinLinkRepo.linkInquiryToWalkinCustomer(normalizedId, wc.ID);
      }
    } else {
      inquiryWalkinLinkRepo.unlinkInquiryWalkin(normalizedId);
    }

    if (isBattery) {
      if (payload.batteries && Array.isArray(payload.batteries)) {
        inquiryRepo.deleteInquiryBatteriesByInquiryId(normalizedId);
        payload.batteries.forEach((bat) => {
          inquiryRepo.createInquiryBattery({
            InquiryID: normalizedId,
            BatteryID: normalizeId(bat.BatteryID, "BatteryID"),
            Price: Number(bat.Price) || 0,
            Discount: Number(bat.Discount) || 0,
            Qty: Number(bat.Qty) || 1,
            IsAdminApproved: updatedData.IsAdminApproved
          });
        });
      }
    } else {
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
    }
  });

  updateTransaction();

  return exports.getInquiryById(normalizedId);
};

exports.deleteInquiry = (id) => {
  const normalizedId = normalizeId(id, "InquiryID");

  const deleteTransaction = db.transaction(() => {
    inquiryWalkinLinkRepo.unlinkInquiryWalkin(normalizedId);
    inquiryRepo.deleteInquiryTyresByInquiryId(normalizedId);
    inquiryRepo.deleteInquiryBatteriesByInquiryId(normalizedId);
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
      inquiryRepo.approveAllBatteriesForInquiry(normalizedId);
    }
  });

  statusTransaction();

  return exports.getInquiryById(normalizedId);
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
  const inquiry = exports.getInquiryById(id);

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
