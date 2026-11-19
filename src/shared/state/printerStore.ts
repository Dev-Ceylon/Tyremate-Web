import { create } from "zustand"
import { printerService } from "../../features/printer/services/printerService"

interface PrinterState {
  selectedPrinter: string | null
  init: () => Promise<void>
  setSelectedPrinter: (name: string) => void
  clear: () => void
}

export const usePrinterStore = create<PrinterState>((set) => ({
  selectedPrinter: null,

  init: async () => {
    const result = await printerService.getSelected()
    if (result) {
      set({ selectedPrinter: result.Name })
    }
  },

  setSelectedPrinter: (name) =>
    set({ selectedPrinter: name }),

  clear: () =>
    set({ selectedPrinter: null }),
}))
