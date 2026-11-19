import { violationClient } from "./violationClient";
import type {
  ViolationFilter,
  CreateViolationPayload,
} from "../models/violation";

export const violationService = {
  async getBySoId(soId: number): Promise<any[]> {
    return violationClient.getBySoId(soId);
  },

  async getByTyreId(soTyreId: number): Promise<any[]> {
    return violationClient.getByTyreId(soTyreId);
  },

  async getAll(filters?: ViolationFilter): Promise<any[]> {
    return violationClient.getAll(filters);
  },

  async getById(violationId: number): Promise<any> {
    return violationClient.getById(violationId);
  },

  async approve(violationId: number, approveNote?: string): Promise<any> {
    return violationClient.approve(violationId, { ApproveNote: approveNote ?? null });
  },

  async reject(violationId: number, rejectReason: string): Promise<any> {
    return violationClient.reject(violationId, rejectReason);
  },

  async create(data: CreateViolationPayload): Promise<any> {
    return violationClient.create(data);
  },

  async getDOTsByViolationId(violationId: number): Promise<any[]> {
    return violationClient.getDOTsByViolationId(violationId);
  },
};