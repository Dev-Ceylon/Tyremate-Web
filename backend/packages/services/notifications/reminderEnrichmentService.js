const inquiryService = require("../inquiryService");
const inquiryRepo = require("../../repositories/inquiryRepository");
const chequePaymentService = require("../chequePaymentService");
const soReminderService = require("../soReminderService");
const chequePaymentRepo = require("../../repositories/chequePaymentRepository");
const soReminderRepo = require("../../repositories/soReminderRepository");
const tyreExpiryReminderRepo = require("../../repositories/tyreExpiryReminderRepository");
const { REMINDER_TYPE_CODES } = require("../../constants/reminderTypeConstants");

exports.enrichReminder = (reminder) => {
  let inquiryDetails = null;
  let chequeDetails = null;
  let soDetails = null;
  let tyreExpiryDetails = null;

  if (reminder.ReminderTypeCode === REMINDER_TYPE_CODES.INQUIRY_FOLLOW_UP) {
    try {
      inquiryDetails = inquiryService.getInquiryDetailsByReminderId(reminder.ID);
    } catch (error) {
      console.error(
        `Failed to load inquiry details for reminder ${reminder.ID}`,
        error
      );
    }
  }

  if (reminder.ReminderTypeCode === REMINDER_TYPE_CODES.CHEQUE_FOLLOW_UP) {
    try {
      const soId = chequePaymentService.getSoIdByChequeReminderId(reminder.ID);
      chequeDetails = { SoID: soId };
    } catch (error) {
      console.error(
        `Failed to load cheque details for reminder ${reminder.ID}`,
        error
      );
    }
  }

  if (reminder.ReminderTypeCode === REMINDER_TYPE_CODES.SO_FOLLOW_UP) {
    try {
      const soId = soReminderService.getSoIdByReminderId(reminder.ID);
      soDetails = { SoID: soId };
    } catch (error) {
      console.error(
        `Failed to load SO details for reminder ${reminder.ID}`,
        error
      );
    }
  }

  if (reminder.ReminderTypeCode === REMINDER_TYPE_CODES.TYRE_EXPIRY) {
    try {
      tyreExpiryDetails = tyreExpiryReminderRepo.getTyreExpiryDetailsByReminderId(reminder.ID);
    } catch (error) {
      console.error(
        `Failed to load tyre expiry details for reminder ${reminder.ID}`,
        error
      );
    }
  }

  return {
    ...reminder,
    inquiryDetails,
    chequeDetails,
    soDetails,
    tyreExpiryDetails
  };
};

exports.batchEnrichReminders = (reminders) => {
  if (!reminders.length) return [];

  const inquiryReminders = reminders.filter((r) => r.ReminderTypeCode === REMINDER_TYPE_CODES.INQUIRY_FOLLOW_UP);
  const chequeReminders = reminders.filter((r) => r.ReminderTypeCode === REMINDER_TYPE_CODES.CHEQUE_FOLLOW_UP);
  const soReminders = reminders.filter((r) => r.ReminderTypeCode === REMINDER_TYPE_CODES.SO_FOLLOW_UP);
  const tyreExpiryReminders = reminders.filter((r) => r.ReminderTypeCode === REMINDER_TYPE_CODES.TYRE_EXPIRY);

  const enrichmentMap = {};

  if (inquiryReminders.length > 0) {
    try {
      const reminderIds = inquiryReminders.map((r) => r.ID);
      const inquiries = inquiryRepo.getInquiriesByReminderIds(reminderIds);

      const inquiryMap = {};
      for (const inquiry of inquiries) {
        inquiryMap[inquiry.ReminderID] = {
          InquiryID: inquiry.InquiryID,
          CustomerName: inquiry.CustomerName,
          CustomerCode: inquiry.CustomerCode
        };
      }

      const inquiryIds = inquiries.map((i) => i.InquiryID);
      const tyres = inquiryRepo.getInquiryTyresByInquiryIds(inquiryIds);
      const tyresByInquiry = {};
      for (const tyre of tyres) {
        if (!tyresByInquiry[tyre.InquiryID]) tyresByInquiry[tyre.InquiryID] = [];
        tyresByInquiry[tyre.InquiryID].push(tyre);
      }

      const customerIds = [...new Set(inquiries.map((i) => i.CustomerID))];
      const contacts = inquiryRepo.getCustomerContactsByCustomerIds(customerIds);
      const emails = inquiryRepo.getCustomerEmailsByCustomerIds(customerIds);

      const contactsByCustomer = {};
      for (const contact of contacts) {
        if (!contactsByCustomer[contact.CustomerID]) contactsByCustomer[contact.CustomerID] = [];
        contactsByCustomer[contact.CustomerID].push({ PhoneNumber: contact.PhoneNumber, IsPrimary: contact.IsPrimary });
      }

      const emailsByCustomer = {};
      for (const email of emails) {
        if (!emailsByCustomer[email.CustomerID]) emailsByCustomer[email.CustomerID] = [];
        emailsByCustomer[email.CustomerID].push({ EmailAddress: email.EmailAddress, IsPrimary: email.IsPrimary });
      }

      for (const inquiry of inquiries) {
        enrichmentMap[inquiry.ReminderID] = {
          inquiryDetails: {
            ...inquiryMap[inquiry.ReminderID],
            tyres: tyresByInquiry[inquiry.InquiryID] || [],
            contacts: contactsByCustomer[inquiry.CustomerID] || [],
            emails: emailsByCustomer[inquiry.CustomerID] || []
          }
        };
      }
    } catch (error) {
      console.error("Failed to batch enrich inquiry reminders", error);
    }
  }

  if (chequeReminders.length > 0) {
    try {
      const reminderIds = chequeReminders.map((r) => r.ID);
      const results = chequePaymentRepo.getSoIdsByChequeReminderIds(reminderIds);
      for (const row of results) {
        enrichmentMap[row.ReminderID] = { chequeDetails: { SoID: row.SoID } };
      }
    } catch (error) {
      console.error("Failed to batch enrich cheque reminders", error);
    }
  }

  if (soReminders.length > 0) {
    try {
      const reminderIds = soReminders.map((r) => r.ID);
      const results = soReminderRepo.getSoIdsByReminderIds(reminderIds);
      for (const row of results) {
        enrichmentMap[row.ReminderID] = { soDetails: { SoID: row.SoID } };
      }
    } catch (error) {
      console.error("Failed to batch enrich SO reminders", error);
    }
  }

  if (tyreExpiryReminders.length > 0) {
    try {
      const reminderIds = tyreExpiryReminders.map((r) => r.ID);
      const results = tyreExpiryReminderRepo.getTyreExpiryDetailsByReminderIds(reminderIds);
      for (const row of results) {
        enrichmentMap[row.ReminderID] = { tyreExpiryDetails: row };
      }
    } catch (error) {
      console.error("Failed to batch enrich tyre expiry reminders", error);
    }
  }

  return reminders.map((reminder) => ({
    ...reminder,
    inquiryDetails: enrichmentMap[reminder.ID]?.inquiryDetails || null,
    chequeDetails: enrichmentMap[reminder.ID]?.chequeDetails || null,
    soDetails: enrichmentMap[reminder.ID]?.soDetails || null,
    tyreExpiryDetails: enrichmentMap[reminder.ID]?.tyreExpiryDetails || null
  }));
};
