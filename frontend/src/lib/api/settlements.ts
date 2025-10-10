import apiClient from '../api';
import type {
  Settlement,
  SettlementStats,
  SettlementFormData,
  SettlementFilters,
  SettlementExportData
} from '@/types/settlement';
import type { PaginatedResponse } from '@/types/api';

export const settlementsApi = {
  // Get settlement statistics
  getStats: async () => {
    const response = await apiClient.get<SettlementStats>('/settlements/stats');
    return response.data;
  },

  // Get all settlements with filters
  getSettlements: async (filters?: SettlementFilters, page = 1, pageSize = 10) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    const response = await apiClient.get<PaginatedResponse<Settlement>>(
      `/settlements?${params.toString()}`
    );
    return response.data;
  },

  // Get single settlement
  getSettlement: async (id: string) => {
    const response = await apiClient.get<Settlement>(`/settlements/${id}`);
    return response.data;
  },

  // Create new settlement
  createSettlement: async (data: SettlementFormData) => {
    const response = await apiClient.post<Settlement>('/settlements', data);
    return response.data;
  },

  // Update settlement
  updateSettlement: async (id: string, data: Partial<SettlementFormData>) => {
    const response = await apiClient.put<Settlement>(`/settlements/${id}`, data);
    return response.data;
  },

  // Approve settlement
  approveSettlement: async (id: string) => {
    const response = await apiClient.post<Settlement>(`/settlements/${id}/approve`);
    return response.data;
  },

  // Mark as paid
  markAsPaid: async (id: string, paymentDate: string, paymentMethod: string) => {
    const response = await apiClient.post<Settlement>(`/settlements/${id}/paid`, {
      paymentDate,
      paymentMethod,
    });
    return response.data;
  },

  // Cancel settlement
  cancelSettlement: async (id: string, reason: string) => {
    const response = await apiClient.post<Settlement>(`/settlements/${id}/cancel`, { reason });
    return response.data;
  },

  // Export settlements
  exportSettlements: async (filters?: SettlementFilters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const response = await apiClient.get<SettlementExportData>(
      `/settlements/export?${params.toString()}`
    );
    return response.data;
  },
};
