import { AppModal } from "../../../shared/ui/modal/AppModal"
import { Icons } from "../../../shared/ui/icons/icon"
import { usePrinters } from "../hooks/usePrinters"
import { usePrinterStore } from "../../../shared/state/printerStore"
import { printerService } from "../services/printerService"

type PrinterModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function PrinterModal({ isOpen, onClose }: PrinterModalProps) {
  const { printers, loading, testing, error, testPrint } = usePrinters()
  const selectedPrinter = usePrinterStore((s) => s.selectedPrinter)
  const setSelectedPrinter = usePrinterStore((s) => s.setSelectedPrinter)

  const handleSelect = async (name: string) => {
    await printerService.setSelected(name)
    setSelectedPrinter(name)
  }

  return (
    <AppModal isOpen={isOpen} title="Printers" onClose={onClose}>
      <div className="notification-modal-content">
        {loading ? (
          <p className="table-empty">Loading printers...</p>
        ) : error ? (
          <p className="table-empty">{error}</p>
        ) : printers.length === 0 ? (
          <p className="table-empty">No printers found.</p>
        ) : (
          <div className="notification-list" role="list">
            {printers.map((printer) => {
              const isSelected = printer.name === selectedPrinter
              return (
                <div
                  key={printer.name}
                  className="notification-list-item"
                >
                  <div className="notification-list-item-header">
                    <strong>{printer.displayName}</strong>
                    <div className="notification-list-item-header-actions">
                      {printer.isDefault && (
                        <span className="notification-code">Default</span>
                      )}
                      {isSelected ? (
                        <span className="notification-code">Selected</span>
                      ) : (
                        <button
                          className="icon-button"
                          type="button"
                          aria-label="Select printer"
                          onClick={() => handleSelect(printer.name)}
                        >
                          <Icons.Check size={16} />
                        </button>
                      )}
                      <button
                        className="icon-button"
                        type="button"
                        aria-label="Test print"
                        disabled={testing}
                        onClick={() => testPrint(printer.name)}
                      >
                        <Icons.Printer size={16} />
                      </button>
                    </div>
                  </div>
                  <p>{printer.description || "No description"}</p>
                  <span className="notification-link-hint">
                    Status: {printer.status === 0 ? "Ready" : "Offline"}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppModal>
  )
}
