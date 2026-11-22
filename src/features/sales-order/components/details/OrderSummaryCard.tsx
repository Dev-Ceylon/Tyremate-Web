import type { SoDetailedRecord } from "../../models/salesOrder"
import type { SoDeliveryProgress } from "../../models/delivery"
import { getCustomerLabel } from "../../utils/salesOrderDetails"
import { StatusBadge } from "../../../../shared/ui/StatusBadge"
import { DeliveryStatusBadge } from "./DeliveryStatusBadge"

type OrderSummaryCardProps = {
  order: SoDetailedRecord
  showCompleteSalesOrder: boolean
  deliveryProgress?: SoDeliveryProgress | null
}

export function OrderSummaryCard({ order, showCompleteSalesOrder, deliveryProgress }: OrderSummaryCardProps) {
  const customer = order.Customer
  const isWalkin = customer?.IsWalkinCustomer ?? false

  return (
    <div className="info-panel panel panel-strong">
      <p className="section-label">Order Summary</p>
      <div className="detail-card-grid">
        <div className="detail-card-row">
          <span className="detail-card-key">Customer</span>
          <span className="detail-card-val">{getCustomerLabel(order)}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Customer Type</span>
          <span className="detail-card-val">
            <StatusBadge label={isWalkin ? "Walk-in" : "Registered"} tone={isWalkin ? "pending" : "approved"} />
          </span>
        </div>
        {isWalkin && customer?.IsWalkinCustomer && (
          <>
            <div className="detail-card-row">
              <span className="detail-card-key">Phone</span>
              <span className="detail-card-val">{customer.CustomerPhone || "—"}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Address</span>
              <span className="detail-card-val">{customer.CustomerAddress || "—"}</span>
            </div>
            {customer.CustomerEmail && (
              <div className="detail-card-row">
                <span className="detail-card-key">Email</span>
                <span className="detail-card-val">{customer.CustomerEmail}</span>
              </div>
            )}
            {customer.VehicleNumber && (
              <div className="detail-card-row">
                <span className="detail-card-key">Vehicle No</span>
                <span className="detail-card-val">{customer.VehicleNumber}</span>
              </div>
            )}
            {customer.TinNo && (
              <div className="detail-card-row">
                <span className="detail-card-key">TIN No</span>
                <span className="detail-card-val">{customer.TinNo}</span>
              </div>
            )}
            {customer.VatNo && (
              <div className="detail-card-row">
                <span className="detail-card-key">VAT No</span>
                <span className="detail-card-val">{customer.VatNo}</span>
              </div>
            )}
          </>
        )}
        <div className="detail-card-row">
          <span className="detail-card-key">Category</span>
          <span className="detail-card-val">
            <StatusBadge
              label={order.Category === "battery" ? "Batteries" : "Tyres"}
              tone={order.Category === "battery" ? "pending" : "approved"}
            />
          </span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Date</span>
          <span className="detail-card-val">{order.Date}</span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Status</span>
          <span className="detail-card-val">
            <StatusBadge label={order.IsAdminApproved ? "Approved" : "Draft"} tone={order.IsAdminApproved ? "approved" : "pending"} />
          </span>
        </div>
        <div className="detail-card-row">
          <span className="detail-card-key">Payment Status</span>
          <span className="detail-card-val">
            {order.IsPaymentCompleted !== undefined && order.IsPaymentCompleted !== null ? (
              <StatusBadge
                label={order.IsPaymentCompleted === 1 ? "Completed" : "Pending"}
                tone={order.IsPaymentCompleted === 1 ? "completed" : "pending"}
              />
            ) : (
              "N/A"
            )}
          </span>
        </div>
        {(order.Payments?.length ?? 0) > 0 && (
          <div className="detail-card-row">
            <span className="detail-card-key">Payment Type</span>
            <span className="detail-card-val">
              <StatusBadge label="Advance Deposit Paid" tone="approved" />
            </span>
          </div>
        )}
        {deliveryProgress && (
          <div className="detail-card-row">
            <span className="detail-card-key">Delivery Status</span>
            <span className="detail-card-val">
              <DeliveryStatusBadge progress={deliveryProgress} />
            </span>
          </div>
        )}
        {showCompleteSalesOrder && (
          <div className="detail-card-row">
            <span className="detail-card-key">Order Fulfillment</span>
            <span className="detail-card-val">
              <StatusBadge label="Ready for Completion" tone="arrived" />
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
