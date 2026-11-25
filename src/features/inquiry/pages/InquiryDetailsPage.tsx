import { Navigate, useNavigate } from "@/lib/router"
import { useInquiryDetails } from "../hooks/useInquiryDetails"
import { useAuthorization } from "../../../shared/hooks/auth/useAuthorization"
import PermissionGate from "../../../shared/components/PermissionGate"
import { WALKIN_CUSTOMER_FIELDS } from "../../../shared/walkinCustomer/models/walkinCustomer"
import { StatusBadge } from "../../../shared/ui/StatusBadge"
import { LoadingState } from "../../../shared/ui/progress"
import { LinkedSalesOrdersCard } from "../components/LinkedSalesOrdersCard"

export default function InquiryDetailsPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuthorization()
  const { inquiry, loading, error } = useInquiryDetails()

  if (!hasPermission("inquiry.view")) return <Navigate to="/inquiries" replace />
  if (loading) return <main className="app-shell"><LoadingState message="Loading inquiry details…" /></main>
  if (error || !inquiry) return <main className="app-shell"><p className="hero-text error-text">{error || "Inquiry not found"}</p></main>

  const isBattery = (inquiry.Category || "tyre").toLowerCase() === "battery"
  const rawItems = isBattery ? (inquiry.batteries ?? []) : (inquiry.tyres ?? [])
  const totalQty = rawItems.reduce((sum, item: any) => sum + (item.Qty || 0), 0)
  const totalValue = rawItems.reduce((sum, item: any) => sum + (item.Price * item.Qty * (1 - item.Discount / 100)), 0)
  const totalToOrder = rawItems.reduce((sum, item: any) => sum + (item.NeedToOrderQty ?? 0), 0)

  // Narrowed once into a const so the walk-in variant survives inside the map callback.
  const walkinCustomer = inquiry.Customer?.IsWalkinCustomer ? inquiry.Customer : null
  const registeredCustomer =
    inquiry.Customer && !inquiry.Customer.IsWalkinCustomer ? inquiry.Customer : null

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Sales Inquiry Detail</p>
          <h1>Inquiry #{inquiry.InquiryID}</h1>
          <p className="hero-text">Detailed breakdown of customer requirements and specification tracking.</p>
        </div>
        <div className="header-actions">
          <PermissionGate permission="so.create">
            <button
              className="primary-action"
              onClick={() => navigate(`/sales-orders/new?inquiryId=${inquiry.InquiryID}`)}
            >
              Create Sales Order
            </button>
          </PermissionGate>
          <PermissionGate permission="po.create">
            <button
              className="secondary-action"
              onClick={() => navigate(`/purchase-orders/new?inquiryId=${inquiry.InquiryID}`)}
              title={totalToOrder > 0 ? `Order ${totalToOrder} needed units` : "Create a Purchase Order from this inquiry"}
            >
              Create Purchase Order
            </button>
          </PermissionGate>
          <button className="secondary-action" onClick={() => navigate("/inquiries")}>
            Back to List
          </button>
        </div>
      </section>

      <section className="content-grid">
        <div className="info-panel panel panel-strong">
          <p className="section-label">Inquiry Summary</p>
          <div className="detail-card-grid">
            <div className="detail-card-row">
              <span className="detail-card-key">Category</span>
              <span className="detail-card-val">
                <span className={`status-badge ${isBattery ? "status-pending" : "status-approved"}`}>
                  {isBattery ? "Batteries" : "Tyres"}
                </span>
              </span>
            </div>
            {walkinCustomer ? (
              <>
                <div className="detail-card-row">
                  <span className="detail-card-key">Customer</span>
                  <span className="detail-card-val">
                    {walkinCustomer.CustomerName} (Walk-in)
                  </span>
                </div>
                {/* Derived from the shared schema so a new walk-in field shows up here automatically. */}
                {WALKIN_CUSTOMER_FIELDS.filter((field) => field.key !== "CustomerName").map((field) => {
                  const value = walkinCustomer[field.key]
                  if (!value) return null
                  return (
                    <div className="detail-card-row" key={field.key}>
                      <span className="detail-card-key">{field.label}</span>
                      <span className="detail-card-val">{value}</span>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="detail-card-row">
                <span className="detail-card-key">Customer</span>
                <span className="detail-card-val">
                  {registeredCustomer?.CustomerCode
                    ? `${registeredCustomer.CustomerCode} - ${registeredCustomer.CustomerName}`
                    : registeredCustomer?.CustomerName ||
                      (inquiry.CustomerID ? `Customer #${inquiry.CustomerID}` : "-")}
                </span>
              </div>
            )}
            <div className="detail-card-row">
              <span className="detail-card-key">Date Created</span>
              <span className="detail-card-val">{inquiry.Date}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Requested Date</span>
              <span className="detail-card-val">{inquiry.RequestedDate || "-"}</span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Approval</span>
              <span className="detail-card-val">
                <span className={`status-badge ${inquiry.IsAdminApproved ? 'status-completed' : 'status-pending'}`}>
                  {inquiry.IsAdminApproved ? 'Approved' : 'Draft'}
                </span>
              </span>
            </div>
            <div className="detail-card-row">
              <span className="detail-card-key">Conversion</span>
              <span className="detail-card-val">
                {inquiry.ConvertedSOID ? (
                  <span className="status-badge status-completed">SO #{inquiry.ConvertedSOID}</span>
                ) : (
                  <span className="status-badge status-pending">Not Converted</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="info-panel panel panel-strong">
          <p className="section-label">Additional Notes</p>
          <div className="detail-notes-block">
            <p>{inquiry.Notes || "No additional notes provided for this inquiry."}</p>
          </div>
        </div>
      </section>

      <section className="table-panel panel panel-strong mt-6">
        <div className="table-panel-header">
          <h2>{isBattery ? "Battery Specifications" : "Tyre Specifications"}</h2>
          <div className="header-actions">
            <span className="stat-badge">
              {totalQty} {isBattery ? `batter${totalQty !== 1 ? "ies" : "y"}` : `tyre${totalQty !== 1 ? "s" : ""}`}
            </span>
            <span className="stat-badge">
              Rs {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className="table-scroll tm-table-scroll">
          <table className="product-table">
            <thead>
              <tr>
                <th>{isBattery ? "Battery (Brand)" : "Tyre (Brand)"}</th>
                <th>{isBattery ? "Model (Capacity / Voltage)" : "Size - Pattern"}</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Disc %</th>
                <th className="text-right">Qty</th>
                <th className="text-right">On Hand</th>
                <th className="text-right">To Order</th>
                <th className="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {rawItems.map((item: any) => {
                const lineTotal = item.Price * item.Qty * (1 - item.Discount / 100)
                const available = item.AvailableQuantity ?? 0
                const toOrder = item.NeedToOrderQty ?? 0
                const specText = isBattery
                  ? `${item.Model || "N/A"} (${item.Capacity || "N/A"} ${item.Voltage || "N/A"})`
                  : `${item.Size || "N/A"} - ${item.Pattern || "N/A"}`

                return (
                  <tr key={item.ID}>
                    <td className="text-muted">{item.Brand || "NA"}</td>
                    <td>
                      <span className="font-medium">{specText}</span>
                    </td>
                    <td className="text-right">Rs {item.Price.toLocaleString()}</td>
                    <td className="text-right">{item.Discount}%</td>
                    <td className="text-right font-bold">{item.Qty}</td>
                    <td className="text-right">{available}</td>
                    <td className="text-right">
                      <StatusBadge
                        label={toOrder.toString()}
                        tone={toOrder <= 0 ? "completed" : "pending"}
                      />
                    </td>
                    <td className="text-right font-medium">
                      Rs {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <PermissionGate permission="so.view">
        <LinkedSalesOrdersCard inquiryId={inquiry.InquiryID} />
      </PermissionGate>
    </main>
  )
}
