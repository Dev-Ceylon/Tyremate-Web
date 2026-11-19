import { useNavigate } from "@/lib/router"
import type { SoDetailedRecord } from "../models/salesOrder"
import type { SoDeliveryProgress } from "../models/delivery"
import { DeliveryStatusBadge } from "./details/DeliveryStatusBadge"

type SalesOrderTableProps = {
  data: SoDetailedRecord[]
  deletingId: number | null
  onDelete: (id: number) => void
  deliveryProgressMap?: Record<number, SoDeliveryProgress | null>
}

export const SalesOrderTable = ({ data, deletingId, onDelete, deliveryProgressMap = {} }: SalesOrderTableProps) => {
  const navigate = useNavigate()
  if (data.length === 0) {
    return <p className="table-empty">No sales orders found.</p>
  }

  return (
    <div className="tm-table-scroll">
      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th className="text-right">Total Sale</th>
            <th className="text-right">Total Discount</th>
            <th className="text-center">Status</th>
            <th className="text-center">Delivery</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((so) => {
            const isDeleting = deletingId === so.SoID
            const progress = deliveryProgressMap[so.SoID] ?? null
          
            return (
              <tr key={so.SoID}>
                <td className="mono-text">#{so.SoID}</td>
                <td className="secondary-text">{so.Date}</td>
                <td>
                  <div className="flex-column">
                    <span className="font-medium">{so.CustomerName || "-"}</span>
                    <span className="secondary-text text-xs">{so.CustomerCode}</span>
                  </div>
                </td>
                <td className="text-right font-bold">
                  ${(so.TotalSale ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="text-right secondary-text">
                  ${(so.TotalDiscount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="text-center">
                  <div className="flex-center gap-2">
                    {so.IsAdminApproved ? (
                      <span className="status-badge status-approved">Approved</span>
                    ) : (
                      <span className="status-badge status-pending">Draft</span>
                    )}
                    {so.IsCompleted ? (
                      <span className="status-badge status-completed">Completed</span>
                    ) : (
                      <span className="status-badge status-pending">Not Completed</span>
                    )}
                  </div>
                </td>
                <td className="text-center">
                  <DeliveryStatusBadge progress={progress} />
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="secondary-action table-action"
                      onClick={() => navigate(`/sales-orders/${so.SoID}`)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="secondary-action table-action"
                      onClick={() => onDelete(so.SoID)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
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