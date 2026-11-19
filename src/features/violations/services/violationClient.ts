import type {
  CreateViolationPayload,
  ApproveViolationPayload,
  ViolationFilter,
} from "../models/violation";

export const violationClient = {
  getBySoId(soId: number): Promise<any[]> {
    return window.api.violations.getBySoId(soId);
  },

  getByTyreId(soTyreId: number): Promise<any[]> {
    return window.api.violations.getByTyreId(soTyreId);
  },

  getAll(filters?: ViolationFilter): Promise<any[]> {
    return window.api.violations.getAll(filters);
  },

  getById(violationId: number): Promise<any> {
    return window.api.violations.getById(violationId);
  },

  approve(violationId: number, payload: ApproveViolationPayload): Promise<any> {
    return window.api.violations.approve(violationId, payload);
  },

  reject(violationId: number, rejectReason: string): Promise<any> {
    return window.api.violations.reject(violationId, rejectReason);
  },

  create(data: CreateViolationPayload): Promise<any> {
    return window.api.violations.create(data);
  },

  getDOTsByViolationId(violationId: number): Promise<any[]> {
    return window.api.violations.getDOTsByViolationId(violationId);
  },
};