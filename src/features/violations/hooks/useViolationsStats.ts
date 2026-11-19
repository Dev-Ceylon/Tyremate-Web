import { useMemo } from "react";
import type { ViolationGroup } from "../models/violation";

export interface ViolationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  ovmx: number;
  fsfo: number;
}

export function useViolationsStats(violations: ViolationGroup[]): ViolationStats {
  return useMemo(() => {
    const total = violations.length;
    const pending = violations.filter((v) => v.IsApproved === 0).length;
    const approved = violations.filter((v) => v.IsApproved === 1).length;
    const rejected = violations.filter((v) => v.IsApproved === -1).length;
    const ovmx = violations.filter((v) => v.ViolationTypeCode === "ovmx").length;
    const fsfo = violations.filter((v) => v.ViolationTypeCode === "fsfo").length;
    return { total, pending, approved, rejected, ovmx, fsfo };
  }, [violations]);
}