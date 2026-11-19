const notificationEvents = require("../../../packages/events/notificationEvents");

let mainWindow = null;

function setMainWindow(window) {
  mainWindow = window;
}

notificationEvents.on("notificationCreated", (payload) => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("notification-changed", payload);
    }
  } catch (error) {
    console.error("notificationCreated IPC send error", error);
  }
});

notificationEvents.on("notificationUpdated", (payload) => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("notification-changed", payload);
    }
  } catch (error) {
    console.error("notificationUpdated IPC send error", error);
  }
});

notificationEvents.on("notificationDeleted", (payload) => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("notification-changed", payload);
    }
  } catch (error) {
    console.error("notificationDeleted IPC send error", error);
  }
});

notificationEvents.on("notificationsCleared", (payload) => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("notification-changed", payload);
    }
  } catch (error) {
    console.error("notificationsCleared IPC send error", error);
  }
});

notificationEvents.on("inquiry-notification", (payload) => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("inquiry-notification", payload);
    }
  } catch (error) {
    console.error("inquiry-notification IPC send error", error);
  }
});


module.exports = {
  setMainWindow
};
