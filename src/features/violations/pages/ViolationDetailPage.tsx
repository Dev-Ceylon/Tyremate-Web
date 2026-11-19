import { useViolationDetailPage } from "../hooks/useViolationDetailPage";
import { ViolationSummaryCard } from "../components/ViolationSummaryCard";
import { ViolationFinancialOverview } from "../components/ViolationFinancialOverview";
import { ViolationFSFOTable } from "../components/ViolationFSFOTable";
import { ViolationDiscountDetails } from "../components/ViolationDiscountDetails";
import { ViolationAdditionalDetails } from "../components/ViolationAdditionalDetails";
import { ViolationActionsSidebar } from "../components/ViolationActionsSidebar";
import { ViolationSummarySidebar } from "../components/ViolationSummarySidebar";
import { ViolationMetaSidebar } from "../components/ViolationMetaSidebar";

export function ViolationDetailPage() {
  const {
    violation,
    loading,
    error,
    isPending,
    isFSFO,
    isOVMAX,
    violationTypeLabel,
    violationTypeName,
    totalValue,
    getStatusLabel,
    handleApprove,
    handleReject,
    showRejectModal,
    setShowRejectModal,
    rejectReason,
    setRejectReason,
    navigate,
    formatMoney,
    formatDate,
  } = useViolationDetailPage();

  if (loading) {
    return (
      <main className="app-shell">
        <section className="page-header panel">
          <div className="loading-header">Loading violation details...</div>
        </section>
      </main>
    );
  }

  if (error || !violation) {
    return (
      <main className="app-shell">
        <section className="page-header panel">
          <div className="error-state">
            <h1>Violation Not Found</h1>
            <p>{error || "The requested violation could not be found."}</p>
            <button className="secondary-action" onClick={() => navigate("/violations")}>
              Back to Violations
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {/* Standard page-header panel - matches SalesOrderDetailsPage, InvoiceDetailsPage */}
      <section className="page-header panel">
        <div>
          <p className="eyebrow">Policy Violation</p>
          <h1>Violation #{violation.Id}</h1>
          <p className="hero-text">{violationTypeName}</p>
        </div>
        <div className="header-actions">
          {isPending && (
            <div className="flex-row-gap-8">
              <button className="primary-action" onClick={handleApprove} disabled={!isPending}>
                Approve
              </button>
              <button className="secondary-action danger" onClick={() => setShowRejectModal(true)}>
                Reject
              </button>
            </div>
          )}
          <button className="secondary-action" onClick={() => navigate("/violations")}>
            Back to List
          </button>
        </div>
      </section>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Violation</h3>
            <p>Enter a reason for rejecting this violation:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason..."
              rows={4}
              className="modal-textarea"
            />
            <div className="modal-actions">
              <button className="secondary-action" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button
                className="primary-action danger"
                onClick={() => handleReject(violation.Id, rejectReason)}
                disabled={!rejectReason.trim()}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content grid - matches SalesOrderDetailsPage structure */}
      <section className="content-grid">
        <div className="content-main">
          {/* VIOLATION SUMMARY CARD */}
          <ViolationSummaryCard
            violation={violation}
            violationTypeLabel={violationTypeLabel}
            violationTypeName={violationTypeName}
            totalValue={totalValue}
            formatMoney={formatMoney}
            formatDate={formatDate}
            getStatusLabel={getStatusLabel}
          />

          {/* FINANCIAL OVERVIEW */}
          <ViolationFinancialOverview
            violation={violation}
            totalValue={totalValue}
            formatMoney={formatMoney}
          />

          {/* DOTs Table for FSFO */}
          <ViolationFSFOTable
            violation={violation}
            isFSFO={isFSFO}
          />

          {/* Discount Details for OVMAX */}
          <ViolationDiscountDetails
            violation={violation}
            isOVMAX={isOVMAX}
          />

          {/* Additional Details */}
          <ViolationAdditionalDetails
            violation={violation}
            isFSFO={isFSFO}
          />
        </div>

        {/* SIDEBAR - Quick Actions & Summary */}
        <div className="content-sidebar">
          {/* Quick Actions - Primary Actions */}
          <ViolationActionsSidebar
            isPending={isPending}
            handleApprove={handleApprove}
            handleReject={handleReject}
            setShowRejectModal={setShowRejectModal}
            violation={violation}
            navigate={navigate}
          />

          {/* Summary Card */}
          <ViolationSummarySidebar
            violation={violation}
            totalValue={totalValue}
            isFSFO={isFSFO}
            formatMoney={formatMoney}
            getStatusLabel={getStatusLabel}
          />

          {/* Meta Info Card */}
          <ViolationMetaSidebar
            violation={violation}
            formatDate={formatDate}
          />
        </div>
      </section>
    </main>
  );
}

export default ViolationDetailPage;