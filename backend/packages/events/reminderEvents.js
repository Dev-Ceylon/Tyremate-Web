const EventEmitter = require("events");

// Create a singleton instance of EventEmitter for reminder-related events.
const reminderEventEmitter = new EventEmitter();

module.exports = reminderEventEmitter;