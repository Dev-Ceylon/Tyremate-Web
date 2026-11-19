import { useState, useMemo, useCallback } from "react";
import type { ViolationGroup } from "../models/violation";

export interface ViolationFilters {
  search: string;
  filterType: string;
  filterStatus: string;
}

export interface UseViolationsFiltersReturn {
  filters: ViolationFilters;
  filteredViolations: ViolationGroup[];
  isFiltering: boolean;
  setSearch: (search: string) => void;
  setFilterType: (type: string) => void;
  setFilterStatus: (status: string) => void;
  clearFilters: () => void;
}

export function useViolationsFilters(
  violations: ViolationGroup[]
): UseViolationsFiltersReturn {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      if (filterType !== "all" && v.ViolationTypeCode !== filterType) return false;
      if (filterStatus !== "all") {
        const status = v.IsApproved === 1 ? "approved" : v.IsApproved === -1 ? "rejected" : "pending";
        if (status !== filterStatus) return false;
      }
      if (search) {
        const searchLower = search.toLowerCase();
        const matches =
          v.ViolationTypeName?.toLowerCase().includes(searchLower) ||
          v.TyreID.toString().includes(searchLower) ||
          v.SoID.toString().includes(searchLower) ||
          v.Details?.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      return true;
    });
  }, [violations, filterType, filterStatus, search]);

  const isFiltering = Boolean(search) || filterType !== "all" || filterStatus !== "all";

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilterType("all");
    setFilterStatus("all");
  }, []);

  return {
    filters: { search, filterType, filterStatus },
    filteredViolations,
    isFiltering,
    setSearch,
    setFilterType,
    setFilterStatus,
    clearFilters,
  };
}