// Web edition of the printer service. Browsers cannot enumerate printers or
// print silently, so documents are rendered here (worker) and handed to the UI
// thread, which prints them through the browser print dialog (where the user
// can also pick a physical printer or "Save as PDF").
const { getHost } = require("../../../platform/runtime");
const printTemplateService = require("./PrintTemplateService");

const BROWSER_PRINTER = {
    name: "browser-default",
    displayName: "Browser print dialog",
    description: "Uses the browser's print dialog (choose any installed printer or Save as PDF)",
    status: 0,
    isDefault: true,
    options: {},
};

function _render(templateName, data) {
    return Array.isArray(data)
        ? printTemplateService.renderMany(templateName, data)
        : printTemplateService.render(templateName, data);
}

async function getAll() {
    return [BROWSER_PRINTER];
}

async function _doPrint(html, title) {
    await getHost().requestMain("print", { html, title });
    return { success: true };
}

async function downloadTemplatePdf(templateName, data, defaultFileName = "document.pdf") {
    const html = _render(templateName, data);
    await getHost().requestMain("print", { html, title: defaultFileName.replace(/\.pdf$/i, ""), pdf: true });
    return { success: true, filePath: defaultFileName };
}

async function testPrint(printerName) {
    const html = printTemplateService.render("test-print.html", {
        printerName: printerName || BROWSER_PRINTER.displayName,
        date: new Date().toLocaleString()
    });

    return _doPrint(html, "Test print");
}

async function printTemplate(templateName, data) {
    const html = _render(templateName, data);
    return _doPrint(html, templateName.replace(/\.html$/i, ""));
}

module.exports = {
    getAll,
    testPrint,
    printTemplate,
    downloadTemplatePdf,
    BROWSER_PRINTER,
};
