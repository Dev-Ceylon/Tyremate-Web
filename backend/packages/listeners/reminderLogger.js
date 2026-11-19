/**
 * @file Sample event listener for Reminder module events.
 * This file demonstrates how to subscribe to reminder events and log their changes.
 */

const reminderEvents = require("../events/reminderEvents");

/**
 * Logs reminder creation events.
 * @param {object} payload - The event payload.
 * @param {string} payload.action - The action performed (e.g., "created").
 * @param {number} payload.reminderId - The ID of the reminder.
 * @param {string} payload.timestamp - ISO string of when the event occurred.
 * @param {object} payload.changedData - The full reminder object that was created.
 * @param {string} payload.message - A descriptive message for the event.
 */
reminderEvents.on("reminderCreated", (payload) => {
  console.log(`[Reminder Event - Created] ${payload.message}`);
  console.log("Payload:", JSON.stringify(payload, null, 2));
});

/**
 * Logs reminder update events.
 * @param {object} payload - The event payload.
 */
reminderEvents.on("reminderUpdated", (payload) => {
  console.log(`[Reminder Event - Updated] ${payload.message}`);
  console.log("Payload:", JSON.stringify(payload, null, 2));
});

/**
 * Logs reminder completion events.
 * @param {object} payload - The event payload.
 */
reminderEvents.on("reminderCompleted", (payload) => {
  console.log(`[Reminder Event - Completed] ${payload.message}`);
  console.log("Payload:", JSON.stringify(payload, null, 2));
});

/**
 * Logs reminder deletion events.
 * @param {object} payload - The event payload.
 */
reminderEvents.on("reminderDeleted", (payload) => {
  console.log(`[Reminder Event - Deleted] ${payload.message}`);
  console.log("Payload:", JSON.stringify(payload, null, 2));
});

reminderEvents.on(
  "reminderPendingFound",
  (payload) => {
    console.log(
      `[Reminder Monitor] ${payload.count} pending reminders`
    );
  }
);

console.log("Reminder event logger initialized.");