import { apiClient } from "./api-client";
import {
  Matching,
  CreateMatchingRequest,
  UpdateMatchingRequest,
  MatchingMemo,
  SettlementMemo,
} from "@/types/matching";

export const matchingApi = {
  // Get all matchings
  getAll: async (): Promise<Matching[]> => {
    const response = await apiClient.get("/api/matchings");
    return response.data.matchings || [];
  },

  // Get matching by ID
  getById: async (matchingId: number): Promise<Matching> => {
    const response = await apiClient.get(`/api/matchings/${matchingId}`);
    return response.data.matching;
  },

  // Create new matching
  create: async (data: CreateMatchingRequest): Promise<Matching> => {
    const response = await apiClient.post("/api/matchings", data);
    return response.data.matching;
  },

  // Update matching
  update: async (
    matchingId: number,
    data: UpdateMatchingRequest
  ): Promise<Matching> => {
    const response = await apiClient.put(`/api/matchings/${matchingId}/status`, data);
    return response.data.matching;
  },

  // Delete matching
  delete: async (matchingId: number): Promise<void> => {
    await apiClient.delete(`/api/matchings/${matchingId}`);
  },

  // Get matching memos
  getMemos: async (matchingId: number): Promise<MatchingMemo[]> => {
    const response = await apiClient.get(`/api/matchings/${matchingId}/memos`);
    return response.data;
  },

  // Create matching memo
  createMemo: async (
    matchingId: number,
    memoText: string
  ): Promise<MatchingMemo> => {
    const response = await apiClient.post(
      `/api/matchings/${matchingId}/memos`,
      { matching_id: matchingId, memo_content: memoText }
    );
    return response.data.memo;
  },

  // Update matching memo
  updateMemo: async (
    matchingId: number,
    memoId: number,
    memoText: string
  ): Promise<MatchingMemo> => {
    const response = await apiClient.put(
      `/api/matchings/${matchingId}/memos/${memoId}`,
      { memo_content: memoText }
    );
    return response.data.memo;
  },

  // Delete matching memo
  deleteMemo: async (matchingId: number, memoId: number): Promise<void> => {
    await apiClient.delete(`/api/matchings/${matchingId}/memos/${memoId}`);
  },

  // Complete matching
  complete: async (matchingId: number): Promise<Matching> => {
    const response = await apiClient.post(`/api/matchings/${matchingId}/complete`);
    return response.data.matching;
  },

  // Cancel matching
  cancel: async (matchingId: number, reason: string): Promise<Matching> => {
    const response = await apiClient.post(`/api/matchings/${matchingId}/cancel`, {
      cancellation_reason: reason,
    });
    return response.data.matching;
  },
};
