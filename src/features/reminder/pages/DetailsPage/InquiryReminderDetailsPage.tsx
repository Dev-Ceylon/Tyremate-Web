import { Link } from "@/lib/router"
import { useInquiryReminderDetails } from "../../hooks/useInquiryReminderDetails"

export default function InquiryReminderDetailsPage() {
  const {
    reminder,
    loading,
    error,
    isCompleting,
    completeError,
    completeReminder,
  } = useInquiryReminderDetails()

  if (loading) {
    return (
      <main className="app-shell">
        <p className="hero-text">Loading reminder details...</p>
      </main>
    )
  }

  if (error || !reminder) {
    return (
      <main className="app-shell">
        <section className="page-header panel">
          <h1>Error</h1>
          <Link className="secondary-action" to="/reminders">Back to Reminders</Link>
        </section>
        <p className="hero-text">{error || "Reminder not found"}</p>
      </main>
    )
  }

  const inquiry = reminder.inquiryDetails

  return (
    <main className="app-shell">
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Reminder Details</p>
          <h1>Inquiry</h1>
        </div>
        <div className="header-actions">
          {!reminder.IsCompleted && (
            <button
              className="primary-action"
              onClick={() => void completeReminder()}
              disabled={isCompleting}
            >
              {isCompleting ? "Completing..." : "Complete Reminder"}
            </button>
          )}
          <Link className="secondary-action" to="/reminders">
            Back to Reminders
          </Link>
        </div>
      </section>

      {completeError && <p className="hero-text" style={{ color: "var(--color-red-700)", margin: "0 0 1rem 0" }}>{completeError}</p>}

      <section className="info-panel panel panel-strong">
        <div className="grid-details">
          <div className="detail-item">
            <p className="section-label">Reminder Date</p>
            <p className="main-text">{reminder.Date || "Not Scheduled"}</p>
          </div>
          <div className="detail-item">
            <p className="section-label">Status</p>
            <p>
              {reminder.IsCompleted ? (
                <span className="status-badge status-completed">Completed</span>
              ) : (
                <span className="status-badge status-pending">Pending</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {inquiry ? (
        <>
          <section className="info-panel panel panel-strong">
            <div className="table-panel-header">
              <div>
                <p className="section-label">Inquiry Information</p>
                <h2>Customer & Context</h2>
              </div>
              <Link to={`/inquiries/${inquiry.InquiryID}`} className="secondary-action">
                View Full Inquiry
              </Link>
            </div>
            <div className="grid-details mt-4">
              <div className="detail-item">
                <p className="section-label">Customer</p>
                <p className="main-text">{inquiry.CustomerName}</p>
                <p className="sub-text">Code: {inquiry.CustomerCode}</p>
              </div>
              <div className="detail-item">
                <p className="section-label">Inquiry Date</p>
                <p className="main-text">{inquiry.Date}</p>
              </div>
              {inquiry.contacts && inquiry.contacts.length > 0 && (
                <div className="detail-item">
                  <p className="section-label">Phone Numbers</p>
                  {inquiry.contacts.map((c, idx) => (
                    <p key={idx} className="main-text">
                      {c.PhoneNumber}
                      {c.IsPrimary ? <span className="status-badge status-completed status-badge-xs ml-2">Primary</span> : null}
                    </p>
                  ))}
                </div>
              )}
              {inquiry.emails && inquiry.emails.length > 0 && (
                <div className="detail-item">
                  <p className="section-label">Email Addresses</p>
                  {inquiry.emails.map((e, idx) => (
                    <p key={idx} className="main-text">
                      {e.EmailAddress}
                      {e.IsPrimary ? <span className="status-badge status-completed status-badge-xs ml-2">Primary</span> : null}
                    </p>
                  ))}
                </div>
              )}
            </div>
            {inquiry.InquiryNotes && (
              <div className="detail-item mt-4">
                <p className="section-label">Inquiry Notes</p>
                <p className="secondary-text whitespace-pre-wrap">{inquiry.InquiryNotes}</p>
              </div>
            )}
          </section>

          {inquiry.tyres && inquiry.tyres.length > 0 && (
            <section className="table-panel panel panel-strong">
              <div className="table-panel-header">
                <div>
                  <p className="section-label">Inquiry Tyres</p>
                  <h2>Items Requested</h2>
                </div>
              </div>
              <div className="tm-table-scroll">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>Tyre Specification</th>
                      <th className="text-right">Price</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiry.tyres.map((tyre) => (
                      <tr key={tyre.ID}>
                        <td>
                          <p className="main-text">{tyre.Size} {tyre.Pattern}</p>
                          <p className="sub-text">{tyre.Brand}</p>
                        </td>
                        <td className="text-right mono-text">{tyre.Price.toLocaleString()}</td>
                        <td className="text-center mono-text">{tyre.Qty}</td>
                        <td className="text-right mono-text">{tyre.Discount}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="info-panel panel panel-strong">
          <p className="hero-text">No additional inquiry details found for this reminder.</p>
        </section>
      )}
    </main>
  )
}