const selectedPrinterRepo = require("../repositories/selectedPrinterRepository");

exports.getSelectedPrinter = () => {
  return selectedPrinterRepo.getSelectedPrinter();
};

exports.setSelectedPrinter = (name) => {
  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new Error("Printer name is required");
  }

  return selectedPrinterRepo.upsertSelectedPrinter(name.trim());
};

exports.clearSelectedPrinter = () => {
  return selectedPrinterRepo.deleteSelectedPrinter();
};
