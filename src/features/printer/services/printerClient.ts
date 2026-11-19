import type { PrinterInfo } from "../../../shared/models/printer"

export type SelectedPrinter = {
  ID: number
  Name: string
}

export const printerClient = {
  getAll(): Promise<PrinterInfo[]> {
    return window.api.printer.getAll()
  },

  testPrint(printerName: string): Promise<{ success: boolean }> {
    return window.api.printer.testPrint(printerName)
  },

  getSelected(): Promise<SelectedPrinter | undefined> {
    return window.api.printer.getSelected()
  },

  setSelected(name: string): Promise<SelectedPrinter> {
    return window.api.printer.setSelected(name)
  },

  clearSelected(): Promise<{ changes: number }> {
    return window.api.printer.clearSelected()
  },

  printTemplate(templateName: string, data: Record<string, unknown> | Record<string, unknown>[], deviceName: string): Promise<{ success: boolean }> {
    return window.api.printer.printTemplate(templateName, data, deviceName)
  },

  downloadTemplatePdf(templateName: string, data: Record<string, unknown> | Record<string, unknown>[], defaultFileName: string): Promise<{ success: boolean; canceled?: boolean; filePath?: string }> {
    return window.api.printer.downloadTemplatePdf(templateName, data, defaultFileName)
  },
}
