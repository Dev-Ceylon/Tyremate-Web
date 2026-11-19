import { useNavigate } from "@/lib/router"
import { useInquiryDetails } from "../hooks/useInquiryDetails"
import { WALKIN_CUSTOMER_FIELDS } from "../../../shared/walkinCustomer/models/walkinCustomer"
import { StatusBadge } from "../../../shared/ui/StatusBadge"
import { LinkedSalesOrdersCard } from "../components/LinkedSalesOrdersCard"

export default function InquiryDetailsPage() {
  const navigate = useNavigate()
  const { inquiry, loading, error } = useInquiryDetails()

  if (loading) return <main className="app-shell"><p className="hero-text">Loading inquiry details...</p></main>
  if (error || !inquiry) return <main className="app-shell"><p className="hero-text error-text">{error || "Inquiry not found"}</p></main>

  const totalQty = inquiry.tyres?.reduce((sum, t) => sum + (t.Qty || 0), 0) ?? 0
  const totalValue = inquiry.tyres?.reduce((sum, t) => sum + (t.Price * t.Qty * (1 - t.Discount / 100)), 0) ?? 0
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
          <button className="primary-action" onClick={() => navigate(`/sales-orders/new?inquiryId=${inquiry.InquiryID}`)}>
            Create Sales Order
          </button>
          <button className="secondary-action" onClick={() => navigate("/inquiries")}>
            Back to List
          </button>
        </div>
      </section>

      <section className="content-grid">
        <div className="info-panel panel panel-strong">
          <p className="section-label">Inquiry Summary</p>
          <div className="detail-card-grid">
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
          <h2>Tyre Specifications</h2>
          <div className="header-actions">
            <span className="stat-badge">{totalQty} tyre{totalQty !== 1 ? "s" : ""}</span>
            <span className="stat-badge">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="product-table">
            <thead>
              <tr>
                <th>Tyre</th>
                <th>Size - Pattern</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Disc %</th>
                <th className="text-right">Qty</th>
                <th className="text-right">On Hand</th>
                <th className="text-right">To Order</th>
                <th className="text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {inquiry.tyres?.map((tyre) => {
                const lineTotal = tyre.Price * tyre.Qty * (1 - tyre.Discount / 100)
                const available = tyre.AvailableQuantity ?? 0
                const toOrder = tyre.NeedToOrderQty ?? 0
                return (
                  <tr key={tyre.ID}>
                    <td className="text-muted">{tyre.Brand || "NA"}</td>
                    <td>
                      <span className="font-medium">
                        {tyre.Size || "N/A"} - {tyre.Pattern || "N/A"}
                      </span>
                    </td>
                    <td className="text-right">${tyre.Price.toLocaleString()}</td>
                    <td className="text-right">{tyre.Discount}%</td>
                    <td className="text-right font-bold">{tyre.Qty}</td>
                    <td className="text-right">{available}</td>
                    <td className="text-right">
                      <StatusBadge
                        label={toOrder.toString()}
                        tone={toOrder <= 0 ? "completed" : "pending"}
                      />
                    </td>
                    <td className="text-right font-medium">${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <LinkedSalesOrdersCard inquiryId={inquiry.InquiryID} />
    </main>
  )
}
