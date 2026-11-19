// packages/listeners/reminderIpcListener.js

const reminderEvents = require("../../../packages/events/reminderEvents");

let mainWindow = null;

function setMainWindow(window) {
  mainWindow = window;
}

reminderEvents.on("reminderCreated", (payload) => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("reminder-changed", payload);
    }
  } catch (error) {
    console.error("reminderCreated IPC send error", error);
  }
});

reminderEvents.on("reminderUpdated", (payload) => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("reminder-changed", payload);
    }
  } catch (error) {
    console.error("reminderUpdated IPC send error", error);
  }
});

reminderEvents.on("reminderDeleted", (payload) => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("reminder-changed", payload);
    }
  } catch (error) {
    console.error("reminderDeleted IPC send error", error);
  }
});

reminderEvents.on("reminderCompleted", (payload) => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("reminder-changed", payload);
    }
  } catch (error) {
    console.error("reminderCompleted IPC send error", error);
  }
});

reminderEvents.on("reminderPendingFound", (payload) => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("reminder-pending-found", payload);
    }
  } catch (error) {
    console.error("reminderPendingFound IPC send error", error);
  }
});

module.exports = {
  setMainWindow
};
