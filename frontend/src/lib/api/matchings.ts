import apiClient from '../api';
import type { Matching, MatchingFormData, MatchingFilters, FeeCalculation } from '@/types/matching';
import type { PaginatedResponse } from '@/types/api';

export const matchingsApi = {
  // Get all matchings with filters
  getMatchings: async (filters?: MatchingFilters, page = 1, pageSize = 10) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.settlement_status) params.append('settlement_status', filters.settlement_status);
    if (filters?.search) params.append('search', filters.search);
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    const response = await apiClient.get<PaginatedResponse<Matching>>(
      `/matchings?${params.toString()}`
    );
    return response.data;
  },

  // Get single matching
  getMatching: async (id: string) => {
    const response = await apiClient.get<Matching>(`/matchings/${id}`);
    return response.data;
  },

  // Create new matching
  createMatching: async (data: MatchingFormData) => {
    const response = await apiClient.post<Matching>('/matchings', data);
    return response.data;
  },

  // Update matching
  updateMatching: async (id: string, data: Partial<MatchingFormData>) => {
    const response = await apiClient.put<Matching>(`/matchings/${id}`, data);
    return response.data;
  },

  // Delete matching
  deleteMatching: async (id: string) => {
    const response = await apiClient.delete(`/matchings/${id}`);
    return response.data;
  },

  // Update status
  updateStatus: async (id: string, status: Matching['matching_status']) => {
    const response = await apiClient.patch<Matching>(`/matchings/${id}/status`, { status });
    return response.data;
  },

  // Calculate fee
  calculateFee: async (salary: number, workDays: number, feeRate: number) => {
    const response = await apiClient.post<FeeCalculation>('/matchings/calculate-fee', {
      salary,
      workDays,
      feeRate,
    });
    return response.data;
  },

  // Complete matching
  completeMatching: async (id: string, actualWorkDays: number) => {
    const response = await apiClient.post<Matching>(`/matchings/${id}/complete`, {
      actualWorkDays,
    });
    return response.data;
  },
};
