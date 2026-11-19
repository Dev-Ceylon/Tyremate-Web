const { REMINDER_TYPE_CODES } = require("../../constants/reminderTypeConstants");

const INQUIRY_REMINDER_TYPE_CODES = new Set([
  REMINDER_TYPE_CODES.INQUIRY_FOLLOW_UP,
  REMINDER_TYPE_CODES.INQUIRY_CALL,
  REMINDER_TYPE_CODES.INQUIRY_VISIT,
]);

exports.buildNotificationPayload = (reminder) => {
  const code = `${reminder.ReminderTypeCode}${reminder.ID}`;
  const reminderLabel = reminder.ReminderTypeName || "Reminder";
  const reminderDate = reminder.Date || "unscheduled";
  const isInquiryReminder = INQUIRY_REMINDER_TYPE_CODES.has(reminder.ReminderTypeCode);
  const inquiryId = isInquiryReminder ? reminder.inquiryDetails?.InquiryID : null;
  const customerName = isInquiryReminder ? reminder.inquiryDetails?.CustomerName : null;
  const isChequeReminder = reminder.ReminderTypeCode === REMINDER_TYPE_CODES.CHEQUE_FOLLOW_UP;
  const chequeSoId = isChequeReminder ? reminder.chequeDetails?.SoID : null;
  const isSoFollowUp = reminder.ReminderTypeCode === REMINDER_TYPE_CODES.SO_FOLLOW_UP;
  const soId = isSoFollowUp ? reminder.soDetails?.SoID : chequeSoId;
  const isTyreExpiry = reminder.ReminderTypeCode === REMINDER_TYPE_CODES.TYRE_EXPIRY;
  const tyreExpiryDetails = isTyreExpiry ? reminder.tyreExpiryDetails : null;

  let description = `Pending ${reminderLabel.toLowerCase()} scheduled for ${reminderDate}`;

  if (inquiryId) {
    description = customerName
      ? `Pending inquiry follow-up for ${customerName} on ${reminderDate}`
      : `Pending inquiry follow-up for inquiry ${inquiryId} on ${reminderDate}`;
  } else if (isSoFollowUp && soId) {
    description = `Pending SO follow-up for sales order ${soId} on ${reminderDate}`;
  } else if (soId) {
    description = `Pending cheque follow-up for sales order ${soId} on ${reminderDate}`;
  } else if (isTyreExpiry && tyreExpiryDetails) {
    const tyreLabel = [
      tyreExpiryDetails.Brand,
      tyreExpiryDetails.Size,
      tyreExpiryDetails.Pattern
    ]
      .filter(Boolean)
      .join(" ") || `tyre ${tyreExpiryDetails.TyreID}`;
    const locationLabel = tyreExpiryDetails.LocationName || "unknown location";
    const branchLabel = tyreExpiryDetails.BranchName ? ` (${tyreExpiryDetails.BranchName})` : "";
    const dotLabel = tyreExpiryDetails.DOT ? ` DOT ${tyreExpiryDetails.DOT}` : "";
    description = `Tyre ${tyreLabel}${dotLabel} at ${locationLabel}${branchLabel} expires on ${tyreExpiryDetails.ExpiryDate || reminderDate}`;
  }

  const tyreExpiryLocationPath =
    tyreExpiryDetails?.LocationID && tyreExpiryDetails?.BranchId
      ? `/storage-manager/tyres/locations/${tyreExpiryDetails.LocationID}/branches/${tyreExpiryDetails.BranchId}`
      : null;

  const navigationPath = tyreExpiryLocationPath
    ? tyreExpiryLocationPath
    : tyreExpiryDetails
      ? `/storage-manager/tyres`
      : inquiryId
        ? `/inquiries/${inquiryId}`
        : soId
          ? `/sales-orders/${soId}`
          : `/reminders/${reminder.ID}`;

  return {
    code,
    title: `${reminderLabel} ${reminder.ID}`,
    description,
    navigationPath
  };
};
