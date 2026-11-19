import { useCallback, useMemo, useState } from "react"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { useConfirm } from "../../../shared/ui/confirm/ConfirmProvider"
import { STATUS_CODES } from "../../../shared/constants/statusConstants"
import { dagService } from "../services/dagService"
import { useDagPaymentForm } from "./useDagPaymentForm"
import { getDagTotals, type DagTotals } from "../utils/dagDetails"
import type {
  DagContractorApprovalStatus,
  DagContractorAssignmentPayload,
  DagDetailedRecord,
} from "../models/dag"
import type { DagPaymentPayload } from "../models/payment"
import type { AssignContractorForm } from "./useAssignContractor"

const emptyTotals: DagTotals = {
  payments: [],
  totalCost: 0,
  paidAmount: 0,
  outstanding: 0,
  takenAmount: 0,
}

// The delivery-date dialog serves two intents: recording the date that moves a
// sent-out DAG into ARRIVING, and correcting the date afterwards. Keeping the
// intent in state lets one dialog and one submit handler cover both.
export type DeliveryDateDialogMode = "arrive" | "edit"

type UseDagDetailsActionsOptions = {
  dagId: number | undefined
  // Nullable so this hook can be called before the page's not-found early
  // return, which would otherwise break the rules of hooks.
  dag: DagDetailedRecord | null
  saveCosts: () => Promise<boolean>
  saveCostsError: string | null
  handleSerialInputChange: (
    tyreId: number,
    serialIndex: number,
    field: "SerialNumber" | "DAGCost",
    value: string,
  ) => void
  refresh: () => Promise<void>
  assignContractor: (payload: DagContractorAssignmentPayload) => Promise<void>
  updateContractorApproval: (
    approvalId: number,
    approvalStatus: DagContractorApprovalStatus,
  ) => Promise<void>
  issueGatePass: () => Promise<void>
  markArriving: (deliveryDate: string) => Promise<void>
  updateDeliveryDate: (deliveryDate: string) => Promise<void>
  completeChequePayment: (paymentId: number) => Promise<any>
}

type UseDagDetailsActionsResult = {
  totals: DagTotals
  showPaymentSection: boolean
  selectedSerialIds: number[]
  selectedCost: number
  toggleSerial: (serialId: number) => void
  selectAllUnsold: () => void
  clearSelection: () => void
  isTakeModalOpen: boolean
  isSubmittingTake: boolean
  handleTakeSelected: () => void
  closeTakeModal: () => void
  confirmTake: (payload: DagPaymentPayload) => Promise<void>
  paymentForm: ReturnType<typeof useDagPaymentForm>
  isAssignDialogOpen: boolean
  openAssignDialog: () => void
  closeAssignDialog: () => void
  submitContractorAssignment: (form: AssignContractorForm) => Promise<void>
  submitContractorApproval: (
    approvalId: number,
    approvalStatus: DagContractorApprovalStatus,
  ) => Promise<void>
  isGatePassDialogOpen: boolean
  openGatePassDialog: () => void
  closeGatePassDialog: () => void
  submitGatePass: () => Promise<void>
  showMarkArriving: boolean
  showUpdateDeliveryDate: boolean
  deliveryDateMode: DeliveryDateDialogMode
  isArrivingDialogOpen: boolean
  openArrivingDialog: () => void
  openUpdateDeliveryDateDialog: () => void
  closeArrivingDialog: () => void
  submitDeliveryDate: (deliveryDate: string) => Promise<void>
  handleSerialCostChange: (tyreId: number, serialIndex: number, value: string) => void
  handleSaveCosts: () => Promise<void>
  handleCompleteCheque: (paymentId?: number) => Promise<void>
  completingChequeId: number | null
}

export function useDagDetailsActions({
  dagId,
  dag,
  saveCosts,
  saveCostsError,
  handleSerialInputChange,
  refresh,
  assignContractor,
  updateContractorApproval,
  issueGatePass,
  markArriving,
  updateDeliveryDate,
  completeChequePayment,
}: UseDagDetailsActionsOptions): UseDagDetailsActionsResult {
  const { showToast } = useToast()
  const confirm = useConfirm()

  const [selectedSerialIds, setSelectedSerialIds] = useState<number[]>([])
  const [isTakeModalOpen, setIsTakeModalOpen] = useState(false)
  const [isSubmittingTake, setIsSubmittingTake] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isGatePassDialogOpen, setIsGatePassDialogOpen] = useState(false)
  const [deliveryDateMode, setDeliveryDateMode] = useState<DeliveryDateDialogMode | null>(null)
  const [completingChequeId, setCompletingChequeId] = useState<number | null>(null)

  const totals = dag ? getDagTotals(dag) : emptyTotals

  // Cost of a serial, so the take total can be derived from the current
  // selection without depending on the order serials were loaded in.
  const serialCostById = useMemo(() => {
    const map = new Map<number, number>()
    ;(dag?.Tyres ?? []).forEach((tyre) => {
      ;(tyre.Serials ?? []).forEach((serial) => {
        const value = Number(serial.DAGCost)
        map.set(serial.ID, Number.isNaN(value) ? 0 : value)
      })
    })
    return map
  }, [dag])

  const selectedCost = useMemo(
    () => selectedSerialIds.reduce((sum, id) => sum + (serialCostById.get(id) ?? 0), 0),
    [selectedSerialIds, serialCostById],
  )

  const paymentForm = useDagPaymentForm({ totalAmount: selectedCost })

  const showPaymentSection = totals.payments.length > 0
  // A delivery date is only meaningful once the tyres have physically left, so
  // setting it is offered while the DAG is sent out. Once arriving/arrived the
  // date already exists and only becomes editable.
  const showMarkArriving = dag?.StatusCode === STATUS_CODES.SENT_OUT
  const showUpdateDeliveryDate =
    dag?.StatusCode === STATUS_CODES.ARRIVING || dag?.StatusCode === STATUS_CODES.ARRIVED
  const isArrivingDialogOpen = deliveryDateMode !== null

  const toggleSerial = useCallback((serialId: number) => {
    setSelectedSerialIds((prev) =>
      prev.includes(serialId) ? prev.filter((id) => id !== serialId) : [...prev, serialId],
    )
  }, [])

  const selectAllUnsold = useCallback(() => {
    const unsold = (dag?.Tyres ?? []).flatMap((tyre) =>
      (tyre.Serials ?? []).filter((serial) => !serial.SoldAt).map((serial) => serial.ID),
    )
    setSelectedSerialIds(unsold)
  }, [dag])

  const clearSelection = useCallback(() => setSelectedSerialIds([]), [])

  const submitTake = useCallback(
    async (payment: DagPaymentPayload | null) => {
      if (!dagId || selectedSerialIds.length === 0) return

      setIsSubmittingTake(true)
      try {
        const result = await dagService.sellTyres(dagId, {
          SerialIds: selectedSerialIds,
          Payment: payment,
        })

        showToast({
          variant: "success",
          title: result.completed ? "DAG completed" : "Tyres taken",
          message: result.completed
            ? "All tyres have been taken. The DAG is now completed."
            : `${result.soldCount} tyre${result.soldCount !== 1 ? "s" : ""} taken and paid.`,
        })

        setIsTakeModalOpen(false)
        setSelectedSerialIds([])
        await refresh()
      } catch (err) {
        showToast({
          variant: "error",
          title: "Take failed",
          message: err instanceof Error ? err.message : "Failed to record the take",
        })
      } finally {
        setIsSubmittingTake(false)
      }
    },
    [dagId, selectedSerialIds, refresh, showToast],
  )

  // A zero-cost selection cannot be paid through the modal (it requires an
  // amount > 0), so it is taken immediately without a payment.
  const handleTakeSelected = useCallback(() => {
    if (selectedSerialIds.length === 0) {
      showToast({
        variant: "error",
        title: "No tyres selected",
        message: "Select at least one serial to take.",
      })
      return
    }

    if (selectedCost <= 0) {
      void submitTake(null)
      return
    }

    setIsTakeModalOpen(true)
  }, [selectedCost, selectedSerialIds, showToast, submitTake])

  const closeTakeModal = useCallback(() => setIsTakeModalOpen(false), [])

  const confirmTake = useCallback(
    async (payload: DagPaymentPayload) => {
      await submitTake(payload)
    },
    [submitTake],
  )

  const handleSaveCosts = useCallback(async () => {
    const saved = await saveCosts()

    if (saved) {
      showToast({
        variant: "success",
        title: "Costs saved",
        message: "Serial costs were updated successfully.",
      })
    } else {
      showToast({
        variant: "error",
        title: "Save failed",
        message: saveCostsError || "Unable to save costs.",
      })
    }
  }, [saveCosts, saveCostsError, showToast])

  const handleSerialCostChange = useCallback(
    (tyreId: number, serialIndex: number, value: string) => {
      handleSerialInputChange(tyreId, serialIndex, "DAGCost", value)
    },
    [handleSerialInputChange],
  )

  const openAssignDialog = useCallback(() => setIsAssignDialogOpen(true), [])
  const closeAssignDialog = useCallback(() => setIsAssignDialogOpen(false), [])

  // Step 1 of 2: allocate only. The toast points at the pending approval so the
  // decision does not look like it happened as part of the allocation.
  const submitContractorAssignment = useCallback(
    async (form: AssignContractorForm) => {
      if (!dagId) {
        throw new Error("No DAG selected")
      }

      // Throws on failure so AssignContractorDialog stays open with the reason;
      // the success toast below is only reached once the save has landed.
      await assignContractor({
        ContractorID: form.ContractorID as number,
      })

      showToast({
        variant: "success",
        title: "Contractor assigned",
        message: "The assignment is pending approval.",
      })
    },
    [assignContractor, dagId, showToast],
  )

  // Step 2 of 2: record the decision made from the inline Approve/Reject buttons.
  const submitContractorApproval = useCallback(
    async (approvalId: number, approvalStatus: DagContractorApprovalStatus) => {
      await updateContractorApproval(approvalId, approvalStatus)

      showToast({
        variant: "success",
        title: `Contractor ${approvalStatus}`,
        message: `The contractor has been ${approvalStatus}.`,
      })
    },
    [showToast, updateContractorApproval],
  )

  const openGatePassDialog = useCallback(() => setIsGatePassDialogOpen(true), [])
  const closeGatePassDialog = useCallback(() => setIsGatePassDialogOpen(false), [])

  // Throws on failure so IssueGatePassDialog stays open with the reason; the
  // success toast below is only reached once the issue has landed.
  const submitGatePass = useCallback(async () => {
    await issueGatePass()

    showToast({
      variant: "success",
      title: "Gate Pass Issued",
      message: "The DAG has moved out of pending and its tyres left storage.",
    })
  }, [issueGatePass, showToast])

  const openArrivingDialog = useCallback(() => setDeliveryDateMode("arrive"), [])
  const openUpdateDeliveryDateDialog = useCallback(() => setDeliveryDateMode("edit"), [])
  const closeArrivingDialog = useCallback(() => setDeliveryDateMode(null), [])

  // Throws on failure so the dialog stays open with the reason; the success
  // toast below is only reached once the change has landed. The mode decides
  // whether this records-and-transitions or just corrects an existing date.
  const submitDeliveryDate = useCallback(
    async (deliveryDate: string) => {
      if (deliveryDateMode === "edit") {
        await updateDeliveryDate(deliveryDate)

        showToast({
          variant: "success",
          title: "Delivery date updated",
          message: "The DAG delivery date has been changed.",
        })
        return
      }

      await markArriving(deliveryDate)

      showToast({
        variant: "success",
        title: "Delivery date set",
        message: "The DAG has been marked as arriving.",
      })
    },
    [deliveryDateMode, markArriving, updateDeliveryDate, showToast],
  )

  const handleCompleteCheque = useCallback(
    async (paymentId?: number) => {
      if (!paymentId) return
      const confirmed = await confirm({
        title: "Mark Cheque as Collected",
        message: "Are you sure you want to mark this cheque as collected?",
        confirmLabel: "Mark Collected",
      })
      if (!confirmed) return

      setCompletingChequeId(paymentId)
      try {
        await completeChequePayment(paymentId)
        showToast({
          variant: "success",
          title: "Cheque Collected",
          message: "Cheque payment marked as collected.",
        })
        await refresh()
      } catch (err) {
        showToast({
          variant: "error",
          title: "Failed to collect cheque",
          message: err instanceof Error ? err.message : "Failed to mark cheque as collected.",
        })
      } finally {
        setCompletingChequeId(null)
      }
    },
    [completeChequePayment, confirm, refresh, showToast],
  )

  return {
    totals,
    showPaymentSection,
    selectedSerialIds,
    selectedCost,
    toggleSerial,
    selectAllUnsold,
    clearSelection,
    isTakeModalOpen,
    isSubmittingTake,
    handleTakeSelected,
    closeTakeModal,
    confirmTake,
    paymentForm,
    isAssignDialogOpen,
    openAssignDialog,
    closeAssignDialog,
    submitContractorAssignment,
    submitContractorApproval,
    isGatePassDialogOpen,
    openGatePassDialog,
    closeGatePassDialog,
    submitGatePass,
    showMarkArriving,
    showUpdateDeliveryDate,
    deliveryDateMode: deliveryDateMode ?? "arrive",
    isArrivingDialogOpen,
    openArrivingDialog,
    openUpdateDeliveryDateDialog,
    closeArrivingDialog,
    submitDeliveryDate,
    handleSerialCostChange,
    handleSaveCosts,
    handleCompleteCheque,
    completingChequeId,
  }
}
