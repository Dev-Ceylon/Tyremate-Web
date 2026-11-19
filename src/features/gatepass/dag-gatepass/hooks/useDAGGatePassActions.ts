import { useCallback } from "react"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../../shared/ui/confirm/ConfirmProvider"
import { STATUS_CODES } from "../../../../shared/constants/statusConstants"
import { useDAGGatePassList } from "./useDAGGatePassList"
import type { DAGGatePassRecord } from "../models/dagGatePass"

/**
 * Everything the list page does outside of rendering: the confirmation dialogs,
 * the success/error toasts, and which status code "Send" applies. Composes
 * useDAGGatePassList so the page makes a single hook call and stays declarative.
 *
 * Each confirm* function resolves without acting when the dialog is dismissed,
 * and swallows the rejection from the list action because it has already been
 * reported as a toast here.
 */
export function useDAGGatePassActions() {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const {
    dagGatePasses,
    loading,
    error,
    deletingId,
    sendingId,
    arrivedId,
    refresh,
    removeDAGGatePass,
    sendDAGGatePass,
    markDAGGatePassArrived,
  } = useDAGGatePassList()

  const reportFailure = useCallback(
    (title: string, err: unknown) => {
      showToast({
        variant: "error",
        title,
        message: err instanceof Error ? err.message : "Something went wrong",
      })
    },
    [showToast],
  )

  const confirmDelete = useCallback(
    async (dagGatePass: DAGGatePassRecord) => {
      const confirmed = await confirm({
        title: "Delete DAG Gate Pass",
        message: `Delete DAG Gate Pass #${dagGatePass.ID}?`,
        confirmLabel: "Delete",
        danger: true,
      })

      if (!confirmed) {
        return
      }

      try {
        await removeDAGGatePass(dagGatePass)
        showToast({
          variant: "success",
          title: "DAG Gate Pass deleted",
          message: `DAG Gate Pass #${dagGatePass.ID} was removed successfully.`,
        })
      } catch (err) {
        reportFailure("Delete failed", err)
      }
    },
    [confirm, removeDAGGatePass, showToast, reportFailure],
  )

  const confirmSend = useCallback(
    async (dagGatePass: DAGGatePassRecord) => {
      const confirmed = await confirm({
        title: "Send Out",
        message: `Mark DAG Gate Pass #${dagGatePass.ID} as Sent Out?`,
        confirmLabel: "Send Out",
      })

      if (!confirmed) {
        return
      }

      try {
        await sendDAGGatePass(dagGatePass, STATUS_CODES.SENT_OUT)
        showToast({
          variant: "success",
          title: "Status updated",
          message: `DAG Gate Pass #${dagGatePass.ID} marked as Sent Out.`,
        })
      } catch (err) {
        reportFailure("Update failed", err)
      }
    },
    [confirm, sendDAGGatePass, showToast, reportFailure],
  )

  const confirmArrived = useCallback(
    async (dagGatePass: DAGGatePassRecord) => {
      const confirmed = await confirm({
        title: "Arrived",
        message: `Mark DAG Gate Pass #${dagGatePass.ID} as Arrived?`,
        confirmLabel: "Arrived",
      })

      if (!confirmed) {
        return
      }

      try {
        await markDAGGatePassArrived(dagGatePass)
        showToast({
          variant: "success",
          title: "Status updated",
          message: `DAG Gate Pass #${dagGatePass.ID} marked as Arrived.`,
        })
      } catch (err) {
        reportFailure("Action failed", err)
      }
    },
    [confirm, markDAGGatePassArrived, showToast, reportFailure],
  )

  return {
    dagGatePasses,
    loading,
    error,
    deletingId,
    sendingId,
    arrivedId,
    refresh,
    confirmDelete,
    confirmSend,
    confirmArrived,
  }
}
