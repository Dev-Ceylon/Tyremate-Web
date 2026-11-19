import { AppModal } from "../../../../shared/ui/modal/AppModal"
import type { DagPaymentDetail, DagPaymentSaleLine } from "../../models/dag"
import { formatCurrency } from "../../utils/dagDetails"

type PaymentSaleDetailsProps = {
  payment: DagPaymentDetail
  title: string
  onClose: () => void
}

export function PaymentSaleDetails({ payment, title, onClose }: PaymentSaleDetailsProps) {
  const lines: DagPaymentSaleLine[] = payment.SaleLines ?? []
  const total = lines.reduce((sum, line) => sum + (line.Amount ?? 0), 0)

  return (
    <AppModal isOpen title={title} onClose={onClose}>
      <div className="app-modal-body">
        <div className="detail-card-grid">
          <div className="detail-card-row">
            <span className="detail-card-key">Settled Amount</span>
            <span className="detail-card-val font-bold">${formatCurrency(payment.Amount)}</span>
          </div>
          {payment.BankName && (
            <div className="detail-card-row">
              <span className="detail-card-key">Bank Name</span>
              <span className="detail-card-val">{payment.BankName}</span>
            </div>
          )}
          {payment.ChequeNumber && (
            <div className="detail-card-row">
              <span className="detail-card-key">Cheque Number</span>
              <span className="detail-card-val">{payment.ChequeNumber}</span>
            </div>
          )}
        </div>

        <p className="section-label" style={{ marginTop: "var(--space-4)" }}>
          Tyres Released ({lines.length})
        </p>

        {lines.length === 0 ? (
          <p className="secondary-text">No tyres are linked to this payment.</p>
        ) : (
          <div className="tm-table-scroll">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Tyre (Name - Code)</th>
                  <th>Serial Number</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.ID}>
                    <td>
                      <div className="font-medium">{line.TyreName || "Unknown Tyre"}</div>
                      <div className="cell-sub">{line.TyreCode || "-"}</div>
                    </td>
                    <td className="mono-text">{line.SerialNumber || "-"}</td>
                    <td className="text-right font-bold">${formatCurrency(line.Amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lines.length > 0 && (
          <div className="allocated-tyres-take-bar" style={{ marginTop: "var(--space-4)" }}>
            <span className="stat-badge">
              {lines.length} tyre{lines.length !== 1 ? "s" : ""}
            </span>
            <span className="allocated-tyres-take-total">${formatCurrency(total)}</span>
          </div>
        )}
      </div>
    </AppModal>
  )
}
