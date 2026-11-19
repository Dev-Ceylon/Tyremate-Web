const reminderRepo = require("../../repositories/reminderRepository");
const notificationEvents = require("../../events/notificationEvents");
const notificationService = require("../notificationService");
const { enrichReminder, batchEnrichReminders } = require("./reminderEnrichmentService");
const { buildNotificationPayload } = require("./reminderNotificationPayloadService");

const POLL_INTERVAL_MS = 60000;
//const POLL_INTERVAL_MS = 2000;

let intervalId = null;
let lastSnapshotKey = null;

const syncPendingReminderNotifications = () => {
  let pendingReminders = [];
  try {
    pendingReminders = reminderRepo.getPendingReminders();
  } catch (error) {
    console.error("Notification monitor: failed to fetch pending reminders", error);
    return { count: 0, reminders: [] };
  }

  let enrichedReminders = [];
  try {
    enrichedReminders = batchEnrichReminders(pendingReminders);
  } catch (error) {
    console.error("Notification monitor: failed to enrich reminders", error);
    enrichedReminders = pendingReminders;
  }

  const snapshotKey = enrichedReminders
    .map((reminder) => `${reminder.ReminderTypeCode}:${reminder.ID}:${reminder.Date || ""}`)
    .sort()
    .join("|");

  let payloads = [];
  for (const reminder of enrichedReminders) {
    try {
      payloads.push(buildNotificationPayload(reminder));
    } catch (error) {
      console.error(`Notification monitor: failed to build payload for reminder ${reminder.ID}`, error);
    }
  }

  try {
    notificationService.createNotificationsBatch(payloads);
  } catch (error) {
    console.error("Notification monitor: failed to create notifications batch", error);
  }

  let existingNotifications = [];
  try {
    existingNotifications = notificationService.getAllNotifications();
  } catch (error) {
    console.error("Notification monitor: failed to fetch existing notifications", error);
  }

  if (existingNotifications.length > 0 ) {
    const randomIndex = Math.floor(Math.random() * existingNotifications.length);

    try {
      notificationEvents.emit("inquiry-notification", {
        action: "pending-found",
        count: enrichedReminders.length,
        reminders: enrichedReminders,
        existingNotifications: [existingNotifications[randomIndex]],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Notification monitor: failed to emit inquiry-notification event", error);
    }
  }

  lastSnapshotKey = snapshotKey || null;

  return {
    count: enrichedReminders.length,
    reminders: enrichedReminders
  };
};

function start() {
  if (intervalId) {
    return;
  }

  try {
    syncPendingReminderNotifications();
  } catch (error) {
    console.error("Notification monitor error", error);
  }

  intervalId = setInterval(() => {
    try {
      syncPendingReminderNotifications();
    } catch (error) {
      console.error("Notification monitor error", error);
    }
  }, POLL_INTERVAL_MS);
}

function stop() {
  if (!intervalId) {
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
  lastSnapshotKey = null;
}

module.exports = {
  buildNotificationPayload,
  enrichReminder,
  syncPendingReminderNotifications,
  start,
  stop
};
