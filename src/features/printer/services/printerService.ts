import type { PrinterInfo } from "../../../shared/models/printer"
import { printerClient, type SelectedPrinter } from "./printerClient"

export const printerService = {
  getPrinters(): Promise<PrinterInfo[]> {
    return printerClient.getAll()
  },

  testPrint(printerName: string): Promise<{ success: boolean }> {
    return printerClient.testPrint(printerName)
  },

  getSelected(): Promise<SelectedPrinter | undefined> {
    return printerClient.getSelected()
  },

  setSelected(name: string): Promise<SelectedPrinter> {
    return printerClient.setSelected(name)
  },

  clearSelected(): Promise<{ changes: number }> {
    return printerClient.clearSelected()
  },

  printTemplate(templateName: string, data: Record<string, unknown> | Record<string, unknown>[], deviceName: string): Promise<{ success: boolean }> {
    return printerClient.printTemplate(templateName, data, deviceName)
  },

  downloadTemplatePdf(templateName: string, data: Record<string, unknown> | Record<string, unknown>[], defaultFileName: string): Promise<{ success: boolean; canceled?: boolean; filePath?: string }> {
    return printerClient.downloadTemplatePdf(templateName, data, defaultFileName)
  },
}
