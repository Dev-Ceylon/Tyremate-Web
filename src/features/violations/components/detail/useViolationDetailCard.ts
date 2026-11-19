import { useMemo } from "react";
import {
  VIOLATION_TYPE_CODES,
  VIOLATION_TYPE_LABELS,
  VIOLATION_TYPE_NAMES,
  getStatusBadgeTone,
} from "../../constants/violationConstants";
import type { ViolationGroup } from "../../models/violation";

interface UseViolationDetailCardReturn {
  isPending: boolean;
  isOVMAX: boolean;
  isFSFO: boolean;
  statusLabel: string;
  statusTone: ReturnType<typeof getStatusBadgeTone>;
  typeLabel: string;
  typeName: string;
  totalValue: number;
}

export function useViolationDetailCard(violation: ViolationGroup): UseViolationDetailCardReturn {
  const isPending = useMemo(() => violation.IsApproved === 0, [violation.IsApproved]);
  const isOVMAX = useMemo(
    () => violation.ViolationTypeCode === VIOLATION_TYPE_CODES.OVER_MAX_DISCOUNT,
    [violation.ViolationTypeCode]
  );
  const isFSFO = useMemo(
    () => violation.ViolationTypeCode === VIOLATION_TYPE_CODES.SKIPPED_OLD_STOCK,
    [violation.ViolationTypeCode]
  );

  const statusLabel = useMemo(() => {
    if (violation.IsApproved === 1) return "Approved";
    if (violation.IsApproved === -1) return "Rejected";
    return "Pending";
  }, [violation.IsApproved]);

  const statusTone = useMemo(
    () => getStatusBadgeTone(violation.IsApproved),
    [violation.IsApproved]
  );

  const typeLabel = useMemo(
    () => VIOLATION_TYPE_LABELS[violation.ViolationTypeCode as keyof typeof VIOLATION_TYPE_LABELS] || violation.ViolationTypeCode?.toUpperCase(),
    [violation.ViolationTypeCode]
  );

  const typeName = useMemo(
    () => VIOLATION_TYPE_NAMES[violation.ViolationTypeCode as keyof typeof VIOLATION_TYPE_NAMES] || violation.ViolationTypeName,
    [violation.ViolationTypeCode, violation.ViolationTypeName]
  );

  const totalValue = useMemo(() => violation.Price * violation.Qty, [violation.Price, violation.Qty]);

  return {
    isPending,
    isOVMAX,
    isFSFO,
    statusLabel,
    statusTone,
    typeLabel,
    typeName,
    totalValue,
  };
}