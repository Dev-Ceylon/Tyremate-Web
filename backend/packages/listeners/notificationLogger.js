const notificationEvents = require("../events/notificationEvents");

notificationEvents.on("notificationCreated", (payload) => {
  console.log(`[Notification Event - Created] ${payload.message}`);
  console.log("Payload:", JSON.stringify(payload, null, 2));
});

notificationEvents.on("notificationUpdated", (payload) => {
  console.log(`[Notification Event - Updated] ${payload.message}`);
  console.log("Payload:", JSON.stringify(payload, null, 2));
});

notificationEvents.on("notificationDeleted", (payload) => {
  console.log(`[Notification Event - Deleted] ${payload.message}`);
  console.log("Payload:", JSON.stringify(payload, null, 2));
});

notificationEvents.on("notificationsCleared", (payload) => {
  console.log(`[Notification Event - Cleared] ${payload.message}`);
  console.log("Payload:", JSON.stringify(payload, null, 2));
});

notificationEvents.on(
  "inquiry-notification",
  (payload) => {
    console.log(
      `[Reminder Monitor] ${payload.count} pending reminders`
    );
  }
);

console.log("notification event logger initialized.");

