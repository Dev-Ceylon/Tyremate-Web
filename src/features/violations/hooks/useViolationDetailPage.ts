import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "@/lib/router";
import { violationService } from "../services/violationService";
import type { ViolationGroup } from "../models/violation";
import {
  VIOLATION_TYPE_CODES,
  VIOLATION_TYPE_LABELS,
  VIOLATION_TYPE_NAMES,
} from "../constants/violationConstants";

interface UseViolationDetailPageReturn {
  violation: ViolationGroup | null;
  loading: boolean;
  error: string | null;
  isPending: boolean;
  isFSFO: boolean;
  isOVMAX: boolean;
  violationTypeLabel: string;
  violationTypeName: string;
  totalValue: number;
  getStatusClass: (isApproved: number) => string;
  getStatusLabel: (isApproved: number) => string;
  handleApprove: () => Promise<void>;
  handleReject: (id: number, reason: string) => Promise<void>;
  showRejectModal: boolean;
  setShowRejectModal: (show: boolean) => void;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  navigate: (path: string) => void;
  formatMoney: (amount: number) => string;
  formatDate: (date: string | null | undefined) => string;
}

export function useViolationDetailPage(violationId?: number): UseViolationDetailPageReturn {
  const navigate = useNavigate();
  const params = useParams<{ violationId: string }>();
  const resolvedViolationId = violationId ?? (params.violationId ? Number(params.violationId) : NaN);

  const [violation, setViolation] = useState<ViolationGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    if (isNaN(resolvedViolationId)) {
      setError("Invalid violation ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await violationService.getById(resolvedViolationId);
      setViolation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load violation");
    } finally {
      setLoading(false);
    }
  }, [resolvedViolationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isPending = useMemo(
    () => violation?.IsApproved === 0,
    [violation?.IsApproved]
  );

  const isFSFO = useMemo(
    () => violation?.ViolationTypeCode === VIOLATION_TYPE_CODES.SKIPPED_OLD_STOCK,
    [violation?.ViolationTypeCode]
  );

  const isOVMAX = useMemo(
    () => violation?.ViolationTypeCode === VIOLATION_TYPE_CODES.OVER_MAX_DISCOUNT,
    [violation?.ViolationTypeCode]
  );

  const violationTypeLabel = useMemo(
    () => violation
      ? VIOLATION_TYPE_LABELS[violation.ViolationTypeCode as keyof typeof VIOLATION_TYPE_LABELS] || violation.ViolationTypeCode?.toUpperCase()
      : "",
    [violation?.ViolationTypeCode]
  );

  const violationTypeName = useMemo(
    () => violation
      ? VIOLATION_TYPE_NAMES[violation.ViolationTypeCode as keyof typeof VIOLATION_TYPE_NAMES] || violation.ViolationTypeName
      : "",
    [violation?.ViolationTypeCode, violation?.ViolationTypeName]
  );

  const totalValue = useMemo(
    () => violation ? violation.Price * violation.Qty : 0,
    [violation?.Price, violation?.Qty]
  );

  const getStatusClass = useCallback((isApproved: number) => {
    if (isApproved === 1) return "status-approved";
    if (isApproved === -1) return "status-rejected";
    return "status-pending";
  }, []);

  const getStatusLabel = useCallback((isApproved: number) => {
    if (isApproved === 1) return "Approved";
    if (isApproved === -1) return "Rejected";
    return "Pending";
  }, []);

  const handleApprove = useCallback(async () => {
    if (!violation) return;
    try {
      await violationService.approve(violation.Id);
      navigate("/violations");
    } catch (err) {
      console.error("Failed to approve:", err);
      alert("Failed to approve violation");
    }
  }, [violation, navigate]);

  const handleReject = useCallback(async (id: number, reason: string) => {
    try {
      await violationService.reject(id, reason);
      setShowRejectModal(false);
      setRejectReason("");
      navigate("/violations");
    } catch (err) {
      console.error("Failed to reject:", err);
      alert("Failed to reject violation");
    }
  }, [navigate]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return {
    violation,
    loading,
    error,
    isPending,
    isFSFO,
    isOVMAX,
    violationTypeLabel,
    violationTypeName,
    totalValue,
    getStatusClass,
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
  };
}