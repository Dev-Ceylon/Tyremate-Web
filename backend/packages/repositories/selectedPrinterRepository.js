const db = require("../database/connection");

const SINGLETON_ID = 1;

exports.getSelectedPrinter = () => {
  return db.prepare("SELECT ID, Name FROM SelectedPrinter WHERE ID = ?").get(SINGLETON_ID);
};

exports.upsertSelectedPrinter = (name) => {
  const existing = exports.getSelectedPrinter();

  if (existing) {
    db.prepare("UPDATE SelectedPrinter SET Name = ? WHERE ID = ?").run(name, SINGLETON_ID);
    return exports.getSelectedPrinter();
  }

  db.prepare("INSERT INTO SelectedPrinter (ID, Name) VALUES (?, ?)").run(SINGLETON_ID, name);
  return exports.getSelectedPrinter();
};

exports.deleteSelectedPrinter = () => {
  return db.prepare("DELETE FROM SelectedPrinter WHERE ID = ?").run(SINGLETON_ID);
};
