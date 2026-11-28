import { useNavigate } from "@/lib/router"
import { useDirectInvoiceForm } from "../hooks/useDirectInvoiceForm"

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 })

export default function CreateDirectInvoicePage() {
  const navigate = useNavigate()
  const form = useDirectInvoiceForm((created) => navigate(`/invoices/${created.InvoiceID}`))

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Finance</p>
          <h1>New Invoice</h1>
          <p className="hero-text">Create a direct (counter) invoice for a customer or walk-in.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-action" onClick={() => navigate("/invoices")}>
            Back to List
          </button>
        </div>
      </section>

      {form.error && (
        <section className="info-panel panel panel-strong">
          <p className="hero-text error-text">{form.error}</p>
        </section>
      )}

      <section className="content-grid">
        <div className="info-panel panel panel-strong">
          <p className="section-label">Customer</p>
          <div className="detail-card-grid">
            <label className="field-label">
              Select Customer (optional)
              <select
                className="text-input"
                value={form.customerId}
                onChange={(e) => form.handleSelectCustomer(e.target.value)}
                disabled={form.loadingCustomers || form.submitting}
              >
                <option value="">
                  {form.loadingCustomers ? "Loading customers..." : "Walk-in / Manual entry"}
                </option>
                {form.customers.map((c) => (
                  <option key={c.CustomerID} value={c.CustomerID}>
                    {c.Name} ({c.CustomerCode})
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Customer Name
              <input
                className="text-input"
                value={form.customerName}
                onChange={(e) => form.setCustomerName(e.target.value)}
                disabled={form.submitting}
              />
            </label>
            <label className="field-label">
              Address
              <input
                className="text-input"
                value={form.customerAddress}
                onChange={(e) => form.setCustomerAddress(e.target.value)}
                disabled={form.submitting}
              />
            </label>
            <label className="field-label">
              Phone
              <input
                className="text-input"
                value={form.customerPhone}
                onChange={(e) => form.setCustomerPhone(e.target.value)}
                disabled={form.submitting}
              />
            </label>
            <label className="field-label">
              VAT No
              <input
                className="text-input"
                value={form.customerVatNo}
                onChange={(e) => form.setCustomerVatNo(e.target.value)}
                disabled={form.submitting}
              />
            </label>
          </div>
        </div>

        <div className="info-panel panel panel-strong">
          <p className="section-label">Invoice Details</p>
          <div className="detail-card-grid">
            <label className="field-label">
              Invoice Date
              <input
                type="date"
                className="text-input"
                value={form.invoiceDate}
                onChange={(e) => form.setInvoiceDate(e.target.value)}
                disabled={form.submitting}
              />
            </label>
            <label className="field-label">
              Due Date
              <input
                type="date"
                className="text-input"
                value={form.dueDate}
                onChange={(e) => form.setDueDate(e.target.value)}
                disabled={form.submitting}
              />
            </label>
            <label className="field-label">
              Amount Paid
              <input
                type="number"
                className="text-input"
                value={form.amountPaid}
                onChange={(e) => form.setAmountPaid(e.target.value)}
                disabled={form.submitting}
                min="0"
              />
            </label>
            <label className="field-label">
              Tax Label
              <input
                className="text-input"
                value={form.taxLabel}
                onChange={(e) => form.setTaxLabel(e.target.value)}
                disabled={form.submitting}
                placeholder="e.g. VAT"
              />
            </label>
            <label className="field-label">
              Tax Amount
              <input
                type="number"
                className="text-input"
                value={form.taxAmount}
                onChange={(e) => form.setTaxAmount(e.target.value)}
                disabled={form.submitting}
                min="0"
              />
            </label>
            <label className="field-label">
              Notes
              <textarea
                className="text-input"
                rows={2}
                value={form.notes}
                onChange={(e) => form.setNotes(e.target.value)}
                disabled={form.submitting}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="table-panel panel panel-strong mt-6">
        <div className="table-panel-header">
          <h2>Line Items</h2>
          <div className="header-actions">
            <button className="secondary-action" onClick={form.addLine} disabled={form.submitting}>
              Add Line
            </button>
          </div>
        </div>
        <div className="tm-table-scroll">
          <table className="product-table invoice-line-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Disc %</th>
                <th className="text-right">Line Total</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {form.lines.map((line) => {
                const gross = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0)
                const lineTotal = gross - (gross * (Number(line.discount) || 0)) / 100
                return (
                  <tr key={line.key}>
                    <td>
                      <input
                        className="text-input"
                        value={line.description}
                        onChange={(e) => form.updateLine(line.key, { description: e.target.value })}
                        disabled={form.submitting}
                        placeholder="Description"
                      />
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        className="text-input"
                        value={line.qty}
                        onChange={(e) => form.updateLine(line.key, { qty: e.target.value })}
                        disabled={form.submitting}
                        min="0"
                      />
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        className="text-input"
                        value={line.unitPrice}
                        onChange={(e) => form.updateLine(line.key, { unitPrice: e.target.value })}
                        disabled={form.submitting}
                        min="0"
                      />
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        className="text-input"
                        value={line.discount}
                        onChange={(e) => form.updateLine(line.key, { discount: e.target.value })}
                        disabled={form.submitting}
                        min="0"
                      />
                    </td>
                    <td className="text-right font-bold">Rs {fmt(lineTotal)}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="secondary-action table-action"
                        onClick={() => form.removeLine(line.key)}
                        disabled={form.submitting || form.lines.length <= 1}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="detail-card-grid">
          <div className="detail-card-row">
            <span className="detail-card-key">Subtotal</span>
            <span className="detail-card-val">Rs {fmt(form.totals.subtotal)}</span>
          </div>
          <div className="detail-card-row">
            <span className="detail-card-key">Discount Total</span>
            <span className="detail-card-val">- Rs {fmt(form.totals.discountTotal)}</span>
          </div>
          <div className="detail-card-row">
            <span className="detail-card-key">Total</span>
            <span className="detail-card-val font-bold">Rs {fmt(form.totals.total)}</span>
          </div>
        </div>

        <div className="header-actions form-submit-row">
          <button className="secondary-action" onClick={() => navigate("/invoices")} disabled={form.submitting}>
            Cancel
          </button>
          <button className="primary-action" onClick={() => void form.submit()} disabled={form.submitting}>
            {form.submitting ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </section>
    </main>
  )
}
