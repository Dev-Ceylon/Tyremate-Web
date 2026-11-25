import { useNavigate } from "@/lib/router"
import type { InvoiceRecord } from "../models/invoice"
import { InvoiceStatusBadge } from "./InvoiceStatusBadge"

type InvoiceTableProps = {
  data: InvoiceRecord[]
}

const SOURCE_LABELS: Record<string, string> = {
  so: "Sales Order",
  other_service: "Other Service",
  direct: "Direct",
  delivery: "Delivery",
  dag: "DAG Retreading",
}

const fmt = (n: number) => (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })

export const InvoiceTable = ({ data }: InvoiceTableProps) => {
  const navigate = useNavigate()

  if (data.length === 0) {
    return <p className="table-empty">No invoices found.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Source</th>
            <th className="text-right">Total</th>
            <th className="text-right">Balance</th>
            <th className="text-center">Status</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((invoice) => {
            const sourceLabel = SOURCE_LABELS[invoice.SourceType] || invoice.SourceType
            const sourceText =
              invoice.SourceID !== null ? `${sourceLabel} #${invoice.SourceID}` : sourceLabel

            return (
              <tr key={invoice.InvoiceID}>
                <td className="mono-text">
                  {invoice.InvoiceNumber}
                  {invoice.IsCreditNote === 1 && <span className="notification-code">CN</span>}
                </td>
                <td className="secondary-text">{invoice.InvoiceDate}</td>
                <td>
                  <span className="font-medium">{invoice.CustomerName || "Walk-in"}</span>
                </td>
                <td className="secondary-text">{sourceText}</td>
                <td className="text-right">${fmt(invoice.Total)}</td>
                <td className="text-right font-bold">${fmt(invoice.BalanceDue)}</td>
                <td className="text-center">
                  <InvoiceStatusBadge status={invoice.Status} isOverdue={invoice.IsOverdue} />
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="secondary-action table-action"
                      onClick={() => navigate(`/invoices/${invoice.InvoiceID}`)}
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
