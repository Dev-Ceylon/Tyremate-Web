const { getAll, testPrint, printTemplate, downloadTemplatePdf } = require("../services/PrinterService");
const selectedPrinterService = require("../../../packages/services/selectedPrinterService");
const { registerIpcHandler } = require("./errorMiddleware");

function registerPrinterIpc() {
    registerIpcHandler("printer:getAll", {}, () => getAll());

    registerIpcHandler("printer:testPrint", {}, (_event, printerName) => testPrint(printerName));

    registerIpcHandler("printer:getSelected", { silent: true }, () => selectedPrinterService.getSelectedPrinter());

    registerIpcHandler("printer:setSelected", {}, (_event, name) => selectedPrinterService.setSelectedPrinter(name));

    registerIpcHandler("printer:clearSelected", {}, () => selectedPrinterService.clearSelectedPrinter());

    registerIpcHandler("printer:printTemplate", {}, (_event, templateName, data, deviceName) => printTemplate(templateName, data, deviceName));

    registerIpcHandler("printer:downloadTemplatePdf", {}, (_event, templateName, data, defaultFileName) => downloadTemplatePdf(templateName, data, defaultFileName));
}

module.exports = registerPrinterIpc;
