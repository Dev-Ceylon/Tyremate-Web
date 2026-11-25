"use client"
import React, { useState } from "react"
import { useSalesTargets } from "../hooks/useSalesTargets"
import { AdminTargetStats } from "../components/AdminTargetStats"
import { AdminTargetFilters } from "../components/AdminTargetFilters"
import { AdminTargetsTable } from "../components/AdminTargetsTable"
import { AdminTargetModal } from "../components/AdminTargetModal"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../shared/ui/confirm/ConfirmProvider"
import { LoadingState } from "../../../shared/ui/progress"
import type {
  SalesTargetPayload,
  SalesTargetRecord,
  SalesTargetUpdatePayload,
} from "../models/salesTarget"

export default function AdminSalesTargetsPage() {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const {
    targets,
    salesReps,
    loading,
    error,
    filter,
    setFilter,
    stats,
    refresh,
    createTarget,
    updateTarget,
    deleteTarget,
  } = useSalesTargets()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<SalesTargetRecord | null>(null)

  const handleOpenCreate = () => {
    setEditingTarget(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (target: SalesTargetRecord) => {
    setEditingTarget(target)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTarget(null)
  }

  const handleSaveTarget = async (
    payload: SalesTargetPayload | { id: number; data: SalesTargetUpdatePayload }
  ) => {
    if ("id" in payload) {
      await updateTarget(payload.id, payload.data)
      showToast({
        variant: "success",
        title: "Target updated",
        message: `Target #${payload.id} was updated successfully.`,
      })
    } else {
      const created = await createTarget(payload)
      showToast({
        variant: "success",
        title: "Target assigned",
        message: `New target assigned to ${created.SalesRepName || created.SalesRepUsername}.`,
      })
    }
  }

  const handleDeleteTarget = async (target: SalesTargetRecord) => {
    const repName = target.SalesRepName || target.SalesRepUsername || `Rep #${target.SalesRepID}`
    const confirmed = await confirm({
      title: "Delete Sales Target",
      message: `Are you sure you want to delete the ${target.PeriodType} target for "${repName}"? This action cannot be undone.`,
      confirmLabel: "Delete Target",
      danger: true,
    })

    if (!confirmed) return

    try {
      await deleteTarget(target.TargetID)
      showToast({
        variant: "success",
        title: "Target deleted",
        message: `Target #${target.TargetID} removed successfully.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete target"
      showToast({
        variant: "error",
        title: "Deletion failed",
        message: msg,
      })
    }
  }

  return (
    <main className="app-shell tm-admin">
      {/* Page Header */}
      <section className="page-header panel target-section-mb">
        <div>
          <p className="eyebrow">Sales Performance & Targets</p>
          <h1>Sales Targets Management</h1>
          <p className="hero-text">
            Assign, monitor, and manage daily, weekly, monthly, and annual sales quotas for representatives.
            Progress and attainment percentages reflect real-time approved orders.
          </p>
        </div>
      </section>

      {/* Attainment Metric Cards */}
      <section className="target-section-mb">
        <AdminTargetStats stats={stats} />
      </section>

      {/* Filters Toolbar */}
      <AdminTargetFilters
        filter={filter}
        onFilterChange={setFilter}
        salesReps={salesReps}
        onOpenCreate={handleOpenCreate}
        onRefresh={refresh}
        loading={loading}
      />

      {/* Target Table Panel */}
      <section className="table-panel panel panel-strong">
        <div className="table-panel-header">
          <div>
            <p className="section-label">Target Overview</p>
            <h2>Assigned Sales Quotas</h2>
          </div>
          <div className="header-actions">
            <span className="table-count">{targets.length} targets</span>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading sales targets and computing real-time actuals…" />
        ) : error ? (
          <div className="target-error-card">
            <p className="target-error-card-title">Error loading targets</p>
            <p className="target-error-card-desc">{error}</p>
          </div>
        ) : (
          <AdminTargetsTable
            targets={targets}
            onEdit={handleOpenEdit}
            onDelete={(t) => void handleDeleteTarget(t)}
          />
        )}
      </section>

      {/* Create / Edit Modal */}
      <AdminTargetModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingTarget={editingTarget}
        salesReps={salesReps}
        onSave={handleSaveTarget}
      />
    </main>
  )
}
