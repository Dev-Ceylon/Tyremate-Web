import { useCallback, useEffect, useState } from "react";
import { violationService } from "../services/violationService";
import type { ViolationGroup } from "../models/violation";

interface UseViolationsListReturn {
  violations: ViolationGroup[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useViolationsList(): UseViolationsListReturn {
  const [violations, setViolations] = useState<ViolationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await violationService.getAll();
      setViolations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load violations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { violations, loading, error, refresh };
}

interface UseViolationDetailReturn {
  violation: ViolationGroup | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useViolationDetail(violationId: number): UseViolationDetailReturn {
  const [violation, setViolation] = useState<ViolationGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await violationService.getById(violationId);
      setViolation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load violation");
    } finally {
      setLoading(false);
    }
  }, [violationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { violation, loading, error, reload: load };
}

interface UseViolationsBySoIdReturn {
  violations: ViolationGroup[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useViolationsBySoId(soId: number): UseViolationsBySoIdReturn {
  const [violations, setViolations] = useState<ViolationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!soId) {
      setViolations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await violationService.getBySoId(soId);
      setViolations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load violations");
    } finally {
      setLoading(false);
    }
  }, [soId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { violations, loading, error, refresh };
}