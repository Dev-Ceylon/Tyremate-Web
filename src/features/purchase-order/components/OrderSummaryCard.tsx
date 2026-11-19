import React from "react"
import { getStatusName, getStatusColorClass } from "../../../shared/constants/statusConstants"

interface OrderSummaryCardProps {
  order: {
    Date: string;
    StatusCode?: string;
    SoID?: number | null;
    SupplierFeedback?: boolean;
    isStoragesAllocated?: boolean;
  }
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ order }) => (
  <div className="info-panel panel panel-strong">
    <p className="section-label">PO Summary</p>
    <div className="detail-card-grid">
      <div className="detail-card-row">
        <span className="detail-card-key">Date</span>
        <span className="detail-card-val">{order.Date}</span>
      </div>
      <div className="detail-card-row">
        <span className="detail-card-key">Status</span>
        <span className="detail-card-val">
          <span className={`status-badge ${getStatusColorClass(order.StatusCode)}`}>
            {getStatusName(order.StatusCode)}
          </span>
        </span>
      </div>
      {order.SoID && (
        <div className="detail-card-row">
          <span className="detail-card-key">Linked Sales Order</span>
          <span className="detail-card-val">SO #{order.SoID}</span>
        </div>
      )}
      <div className="detail-card-row">
        <span className="detail-card-key">Supplier Feedback</span>
        <span className="detail-card-val">
          <span className={`status-badge ${order.SupplierFeedback ? 'status-completed' : 'status-pending'}`}>
            {order.SupplierFeedback ? 'Received' : 'Pending'}
          </span>
        </span>
      </div>
      <div className="detail-card-row">
        <span className="detail-card-key">Storage Allocated</span>
        <span className="detail-card-val">
          <span className={`status-badge ${order.isStoragesAllocated ? 'status-completed' : 'status-pending'}`}>
            {order.isStoragesAllocated ? 'Yes' : 'No'}
          </span>
        </span>
      </div>
    </div>
  </div>
)