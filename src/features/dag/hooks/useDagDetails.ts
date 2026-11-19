import { useEffect, useState, useCallback } from "react";
import type {
  CompleteDagChequePaymentResult,
  DagContractorApprovalRecord,
  DagContractorApprovalStatus,
  DagContractorAssignmentPayload,
  DagDetailedRecord,
} from "../models/dag";
import { dagService } from "../services/dagService";

export type DagSerialInput = {
  ID: number;
  SerialNumber: string;
  DAGCost: number | "";
  SoldAt?: string | null;
};

type UseDagDetailsResult = {
  dag: DagDetailedRecord | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  notFound: boolean;
  refresh: () => Promise<void>;
  saveCosts: () => Promise<boolean>;
  serialInputs: Record<number, DagSerialInput[]>;
  handleSerialInputChange: (
    tyreId: number,
    serialIndex: number,
    field: "SerialNumber" | "DAGCost",
    value: string,
  ) => void;
  approvals: DagContractorApprovalRecord[];
  approvalsLoading: boolean;
  assigningContractor: boolean;
  assignContractor: (payload: DagContractorAssignmentPayload) => Promise<void>;
  updatingApproval: boolean;
  updateContractorApproval: (
    approvalId: number,
    approvalStatus: DagContractorApprovalStatus,
  ) => Promise<void>;
  issuingGatePass: boolean;
  // Rethrown so IssueGatePassDialog can stay open and show the failure reason.
  issueGatePass: () => Promise<void>;
  markingArriving: boolean;
  // Rethrown so DeliveryDateDialog can stay open and show the failure reason.
  markArriving: (deliveryDate: string) => Promise<void>;
  updatingDeliveryDate: boolean;
  // Corrects the date once the DAG is already arriving/arrived; status stays put.
  updateDeliveryDate: (deliveryDate: string) => Promise<void>;
  completeChequePayment: (paymentId: number) => Promise<CompleteDagChequePaymentResult>;
};

export function useDagDetails(dagId: number | undefined): UseDagDetailsResult {
  const [dag, setDag] = useState<DagDetailedRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [serialInputs, setSerialInputs] = useState<Record<number, DagSerialInput[]>>({});
  const [saving, setSaving] = useState(false);
  const [approvals, setApprovals] = useState<DagContractorApprovalRecord[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [assigningContractor, setAssigningContractor] = useState(false);
  const [updatingApproval, setUpdatingApproval] = useState(false);
  const [issuingGatePass, setIssuingGatePass] = useState(false);
  const [markingArriving, setMarkingArriving] = useState(false);
  const [updatingDeliveryDate, setUpdatingDeliveryDate] = useState(false);

  const fetchDagDetails = useCallback(async () => {
    if (dagId === undefined) {
      setDag(null);
      setLoading(false);
      setError(null);
      setNotFound(true); // Treat undefined ID as not found or invalid
      setSerialInputs({});
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await dagService.getDetailedDAGById(dagId);
      if (data) {
        setDag(data);
      } else {
        setDag(null);
        setNotFound(true);
        setSerialInputs({});
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load DAG details";
      setError(message);
      setDag(null);
      setSerialInputs({});
    } finally {
      setLoading(false);
    }
  }, [dagId]);

  useEffect(() => {
    void fetchDagDetails();
  }, [fetchDagDetails]);

  // Loaded separately from the DAG so a failure here cannot blank the page.
  const fetchApprovals = useCallback(async () => {
    if (dagId === undefined) {
      setApprovals([]);
      return;
    }

    setApprovalsLoading(true);
    try {
      setApprovals(await dagService.getContractorApprovals(dagId));
    } catch {
      setApprovals([]);
    } finally {
      setApprovalsLoading(false);
    }
  }, [dagId]);

  useEffect(() => {
    void fetchApprovals();
  }, [fetchApprovals]);

  // Step 1 of 2: allocate the contractor. The new row is pending until
  // updateContractorApproval decides on it.
  const assignContractor = useCallback(
    async (payload: DagContractorAssignmentPayload) => {
      if (dagId === undefined) {
        throw new Error("No DAG selected");
      }

      setAssigningContractor(true);
      try {
        await dagService.assignContractor(dagId, payload);
        // Reload both: the assignment changes DAG.ContractorName and adds a row.
        await Promise.all([fetchDagDetails(), fetchApprovals()]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to assign contractor";
        setError(message);
        // Rethrown so AssignContractorDialog can keep itself open and show the
        // reason, instead of closing over a failed save.
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setAssigningContractor(false);
      }
    },
    [dagId, fetchApprovals, fetchDagDetails],
  );

  // Step 2 of 2: record the approve/reject decision. Not rethrown because the
  // trigger is an inline button rather than a modal that needs to stay open.
  const updateContractorApproval = useCallback(
    async (approvalId: number, approvalStatus: DagContractorApprovalStatus) => {
      setUpdatingApproval(true);
      try {
        await dagService.updateContractorApproval(approvalId, approvalStatus);
        await fetchApprovals();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update contractor approval");
      } finally {
        setUpdatingApproval(false);
      }
    },
    [fetchApprovals],
  );

  // Statuses move to GP_ISSUED and the tyres leave storage, so only the approvals
  // are worth re-reading here; fetchDagDetails would re-render the whole card set.
  const issueGatePass = useCallback(async () => {
    if (dagId === undefined) {
      throw new Error("No DAG selected");
    }

    setIssuingGatePass(true);
    try {
      await dagService.issueGatePass(dagId);
      await Promise.all([fetchDagDetails(), fetchApprovals()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to issue gate pass";
      setError(message);
      // Rethrown so IssueGatePassDialog stays open with the reason, matching
      // the assignment dialog.
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIssuingGatePass(false);
    }
  }, [dagId, fetchApprovals, fetchDagDetails]);

  // Records the delivery date and moves the DAG into ARRIVING. Stock is
  // untouched here by design (see dagService.markDAGArriving).
  const markArriving = useCallback(
    async (deliveryDate: string) => {
      if (dagId === undefined) {
        throw new Error("No DAG selected");
      }

      setMarkingArriving(true);
      try {
        await dagService.markDAGArriving(dagId, deliveryDate);
        await fetchDagDetails();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to set delivery date";
        setError(message);
        // Rethrown so DeliveryDateDialog stays open with the reason.
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setMarkingArriving(false);
      }
    },
    [dagId, fetchDagDetails],
  );

  // Corrects the delivery date without moving the DAG's status (used once it is
  // already ARRIVING/ARRIVED).
  const updateDeliveryDate = useCallback(
    async (deliveryDate: string) => {
      if (dagId === undefined) {
        throw new Error("No DAG selected");
      }

      setUpdatingDeliveryDate(true);
      try {
        await dagService.updateDAGDeliveryDate(dagId, deliveryDate);
        await fetchDagDetails();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update delivery date";
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setUpdatingDeliveryDate(false);
      }
    },
    [dagId, fetchDagDetails],
  );

  useEffect(() => {
    if (!dag) {
      setSerialInputs({});
      return;
    }

    const mappedInputs = dag.Tyres.reduce<Record<number, DagSerialInput[]>>((acc, tyre) => {
      acc[tyre.ID] = tyre.Serials.map((serial) => ({
        ID: serial.ID,
        SerialNumber: serial.SerialNumber,
        DAGCost: serial.DAGCost ?? "",
        SoldAt: serial.SoldAt ?? null,
      }));
      return acc;
    }, {});

    setSerialInputs(mappedInputs);
  }, [dag]);

  const handleSerialInputChange = useCallback(
    (tyreId: number, serialIndex: number, field: "SerialNumber" | "DAGCost", value: string) => {
      setSerialInputs((prev) => ({
        ...prev,
        [tyreId]: prev[tyreId]?.map((serial, index) =>
          index !== serialIndex
            ? serial
            : {
                ...serial,
                [field]: field === "DAGCost" ? (value === "" ? "" : Number(value)) : value,
              },
        ) || [],
      }));
    },
    [],
  );

  const saveCosts = useCallback(async () => {
    if (!dag) {
      return false;
    }

    setSaving(true);
    try {
      const allSerialUpdates = Object.values(serialInputs).flat();
      await Promise.all(
        allSerialUpdates
          .filter((serial) => !serial.SoldAt)
          .map((serial) =>
            dagService.updateDAGTyreSerialCost(serial.ID, serial.DAGCost === "" ? null : serial.DAGCost),
          ),
      );
      await fetchDagDetails();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save serial costs";
      setError(message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [dag, fetchDagDetails, serialInputs]);

  const completeChequePayment = useCallback(
    async (paymentId: number) => {
      if (dagId === undefined) {
        throw new Error("No DAG selected");
      }
      const result = await dagService.completeChequePayment(dagId, paymentId);
      await fetchDagDetails();
      return result;
    },
    [dagId, fetchDagDetails],
  );

  return {
    dag,
    loading,
    saving,
    error,
    notFound,
    refresh: fetchDagDetails,
    saveCosts,
    serialInputs,
    handleSerialInputChange,
    approvals,
    approvalsLoading,
    assigningContractor,
    assignContractor,
    updatingApproval,
    updateContractorApproval,
    issuingGatePass,
    issueGatePass,
    markingArriving,
    markArriving,
    updatingDeliveryDate,
    updateDeliveryDate,
    completeChequePayment,
  };
}