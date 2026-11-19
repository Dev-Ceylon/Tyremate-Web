const reminderRepo = require("../repositories/reminderRepository");
const inquiryReminderRepo = require("../repositories/inquiryReminderRepository");
const inquiryService = require("./inquiryService");
const tyreExpiryReminderRepo = require("../repositories/tyreExpiryReminderRepository");
const reminderEvents = require("../events/reminderEvents"); // Import the event bus
const { REMINDER_TYPE_CODES } = require("../constants/reminderTypeConstants");

const normalizeId = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`);
  }
  return parsed;
};

const assertReminderTypeExists = (id) => {
  const exists = reminderRepo.reminderTypeExists(id);
  if (!exists) {
    throw new Error(`Reminder Type with ID ${id} not found`);
  }
};

exports.getReminders = () => {
  return reminderRepo.getAllReminders();
};

exports.getTodaysPendingReminders = () => {
  return reminderRepo.getTodaysPendingReminders();
};

exports.getPendingReminders = () => {
  return reminderRepo.getPendingReminders();
};

exports.getReminderById = (id) => {
  const normalizedId = normalizeId(id, "ID");
  const reminder = reminderRepo.getReminderById(normalizedId);
  if (!reminder) throw new Error("Reminder not found");
  return reminder;
};

exports.getReminderByID = (id) => {
  const normalizedId = normalizeId(id, "ID");
  const reminder = reminderRepo.getReminderById(normalizedId);
  if (!reminder) throw new Error("Reminder not found");

  if (reminder.ReminderTypeCode === REMINDER_TYPE_CODES.INQUIRY_FOLLOW_UP) {
    const inquiryDetails = inquiryService.getInquiryDetailsByReminderId(normalizedId);
    return { ...reminder, inquiryDetails };
  }

  return reminder;
};

exports.createReminder = (payload) => {
  if (payload.ReminderTypeID === undefined) {
    throw new Error("ReminderTypeID is required");
  }
  
  const reminderTypeId = normalizeId(payload.ReminderTypeID, "ReminderTypeID");
  assertReminderTypeExists(reminderTypeId);

  const newReminder = reminderRepo.createReminder({
    ReminderTypeID: reminderTypeId,
    Date: payload.Date || null,
    IsCompleted: payload.IsCompleted ? 1 : 0
  });

  // Emit 'created' event
  try {
    reminderEvents.emit("reminderCreated", {
      action: "created",
      reminderId: newReminder.ID,
      timestamp: new Date().toISOString(),
      changedData: newReminder,
      message: `Reminder ${newReminder.ID} created successfully.`,
    });
  } catch (error) {
    console.error("Failed to emit reminderCreated event", error);
  }

  return newReminder;
};

exports.updateReminder = (id, payload) => {
  const normalizedId = normalizeId(id, "ID");
  const existing = reminderRepo.getReminderById(normalizedId);
  if (!existing) throw new Error("Reminder not found");

  let reminderTypeId = existing.ReminderTypeID;
  if (payload.ReminderTypeID !== undefined) {
    reminderTypeId = normalizeId(payload.ReminderTypeID, "ReminderTypeID");
    assertReminderTypeExists(reminderTypeId);
  }

  const updated = reminderRepo.updateReminder(normalizedId, {
    ReminderTypeID: reminderTypeId,
    Date: payload.Date !== undefined ? payload.Date : existing.Date,
    IsCompleted: payload.IsCompleted !== undefined
      ? (payload.IsCompleted ? 1 : 0)
      : existing.IsCompleted
  });

  // Emit 'updated' event
  try {
    reminderEvents.emit("reminderUpdated", {
      action: "updated",
      reminderId: normalizedId,
      timestamp: new Date().toISOString(),
      changedData: updated,
      message: `Reminder ${normalizedId} updated successfully.`,
    });
  } catch (error) {
    console.error("Failed to emit reminderUpdated event", error);
  }

  return updated;
};

exports.markReminderCompleted = (id, isCompleted = true) => {
  const normalizedId = normalizeId(id, "ID");

  const existing = reminderRepo.getReminderById(normalizedId);

  if (!existing) {
    throw new Error("Reminder not found");
  }

  const updated = reminderRepo.updateReminder(normalizedId, {
    ReminderTypeID: existing.ReminderTypeID,
    IsCompleted: isCompleted ? 1 : 0,
  });

  try {
    reminderEvents.emit("reminderCompleted", {
      action: "completed",
      reminderId: normalizedId,
      timestamp: new Date().toISOString(),
      changedData: updated,
      message: `Reminder ${normalizedId} marked as completed.`,
    });
  } catch (error) {
    console.error("Failed to emit reminderCompleted event", error);
  }

  return updated;
};

exports.deleteReminder = (id) => {
  const normalizedId = normalizeId(id, "ID");
  const result = reminderRepo.deleteReminder(normalizedId);

  if (result.changes === 0) {
    throw new Error("Reminder not found");
  }
  try {
    reminderEvents.emit("reminderDeleted", {
      action: "deleted",
      reminderId: normalizedId,
      timestamp: new Date().toISOString(),
      changedData: { id: normalizedId },
      message: `Reminder ${normalizedId} deleted successfully.`,
    });
  } catch (error) {
    console.error("Failed to emit reminderDeleted event", error);
  }

  return { success: true };
};

  

exports.getInquiryReminderDetails = (reminderId) => {
  const normalizedId = normalizeId(reminderId, "ReminderID");
  const inquiryReminder = inquiryReminderRepo.getInquiryReminderByReminderId(normalizedId);
  if (!inquiryReminder) throw new Error("Inquiry reminder not found");
  return inquiryReminder;
};

exports.getReminderDetails = (reminderId) => {
  const normalizedId = normalizeId(reminderId, "ReminderID");
  const reminderDetails = reminderRepo.getReminderDetailsById(normalizedId);

  if (!reminderDetails) {
    throw new Error("Reminder not found");
  }

  let inquiryReminderDetails = null;
  let tyreExpiryDetails = null;

  if (reminderDetails.ReminderTypeCode === REMINDER_TYPE_CODES.INQUIRY_FOLLOW_UP) {
    inquiryReminderDetails = inquiryReminderRepo.getInquiryReminderByReminderId(normalizedId);
  }

  if (reminderDetails.ReminderTypeCode === REMINDER_TYPE_CODES.TYRE_EXPIRY) {
    tyreExpiryDetails = tyreExpiryReminderRepo.getTyreExpiryDetailsByReminderId(normalizedId);
  }

  return {
    ...reminderDetails,
    inquiryDetails: inquiryReminderDetails,
    tyreExpiryDetails
  };
};