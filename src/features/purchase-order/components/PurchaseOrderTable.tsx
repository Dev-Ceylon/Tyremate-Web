import { useNavigate } from "@/lib/router"
import { getStatusName, getStatusColorClass, type StatusCode } from "../../../shared/constants/statusConstants"
import { PO_EDITABLE_STATUSES, PO_LOCATION_ALLOCATABLE_STATUSES } from "../constants/poStatusConstants"
import { ActionMenu } from "../../../shared/ui/actionMenu/ActionMenu"
import type { PoDetailedRecord } from "../models/purchaseOrder"

type PurchaseOrderTableProps = {
  data: PoDetailedRecord[]
}

export const PurchaseOrderTable = ({ data }: PurchaseOrderTableProps) => {
  const navigate = useNavigate()
  if (data.length === 0) {
    return <p className="table-empty">No purchase orders found.</p>
  }

  const handleRowClick = (poId: number) => navigate(`/purchase-orders/${poId}`)

  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Date</th>
          <th>Linked SO</th>
          <th className="text-center">Status</th>
          <th className="text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((po) => {
          const statusCode = po.StatusCode as StatusCode
          const manageItems = []
          if (PO_EDITABLE_STATUSES.includes(statusCode)) {
            manageItems.push({
              label: "Edit",
              onClick: () => navigate(`/purchase-orders/${po.ID}/edit`),
            })
          }
          if (PO_LOCATION_ALLOCATABLE_STATUSES.includes(statusCode)) {
            manageItems.push({
              label: "Allocate Location",
              onClick: () => navigate(`/purchase-orders/${po.ID}/allocate`),
            })
          }

          return (
            <tr key={po.ID} className="clickable-row" onClick={() => handleRowClick(po.ID)}>
              <td className="mono-text">#{po.ID}</td>
              <td className="secondary-text">{po.Date}</td>
              <td className="mono-text">
                {po.SoID ? (
                  <button
                    type="button"
                    className="text-link"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/sales-orders/${po.SoID}`)
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    SO #{po.SoID}
                  </button>
                ) : (
                  <span className="secondary-text">-</span>
                )}
              </td>
              <td className="text-center">
                <span className={`status-badge ${getStatusColorClass(po.StatusCode)}`}>
                  {getStatusName(po.StatusCode)}
                </span>
              </td>
              <td>
                <div className="table-actions">
                  {manageItems.length > 0 && (
                    <ActionMenu label="Manage" items={manageItems} />
                  )}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}