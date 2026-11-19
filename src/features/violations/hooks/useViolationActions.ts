import { useCallback } from "react";
import { violationService } from "../services/violationService";
import { useViolationsList } from "./useViolations";

export interface UseViolationActionsReturn {
  handleApprove: (id: number) => Promise<void>;
  handleReject: (id: number) => Promise<void>;
  handleViewDetails: (id: number) => void;
}

export function useViolationActions(
  navigate: (path: string) => void,
  refresh?: () => void
): UseViolationActionsReturn {
  const { refresh: refreshList } = useViolationsList();
  const doRefresh = refresh ?? refreshList;

  const handleApprove = useCallback(async (id: number) => {
    if (!window.confirm("Approve this violation?")) return;
    try {
      await violationService.approve(id);
      void doRefresh();
    } catch (err) {
      console.error("Failed to approve:", err);
      alert("Failed to approve violation");
    }
  }, [doRefresh]);

  const handleReject = useCallback(async (id: number) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await violationService.reject(id, reason);
      void doRefresh();
    } catch (err) {
      console.error("Failed to reject:", err);
      alert("Failed to reject violation");
    }
  }, [doRefresh]);

  const handleViewDetails = useCallback((id: number) => {
    navigate(`/violations/${id}`);
  }, [navigate]);

  return {
    handleApprove,
    handleReject,
    handleViewDetails,
  };
}