import type { InvoiceStatus } from "../models/invoice"

const STATUS_META: Record<InvoiceStatus, { label: string; className: string }> = {
  dft: { label: "Draft", className: "status-draft" },
  iss: { label: "Issued", className: "status-sent" },
  par: { label: "Partially Paid", className: "status-pending" },
  paid: { label: "Paid", className: "status-approved" },
  ovd: { label: "Overdue", className: "status-rejected" },
  can: { label: "Cancelled", className: "status-rejected" },
}

export function InvoiceStatusBadge({
  status,
  isOverdue,
}: {
  status: InvoiceStatus
  isOverdue?: number
}) {
  const meta = STATUS_META[status] ?? { label: status, className: "status-pending" }
  const overdue = isOverdue === 1 && status !== "paid" && status !== "can"
  return (
    <span className={`status-badge ${overdue ? "status-rejected" : meta.className}`}>
      {overdue ? "Overdue" : meta.label}
    </span>
  )
}
