import apiClient from './api';
import type {
  Matching,
  CreateMatchingRequest,
  UpdateMatchingRequest,
  ListMatchingsQuery,
  MatchingResponse,
  MatchingsListResponse,
} from '@/types/matching';

export const matchingApi = {
  // Create a new matching
  create: async (data: CreateMatchingRequest): Promise<Matching> => {
    const response = await apiClient.post<MatchingResponse>(
      '/api/matchings',
      data
    );
    return response.data.matching;
  },

  // Get all matchings with optional filters
  list: async (query?: ListMatchingsQuery): Promise<MatchingsListResponse> => {
    const response = await apiClient.get<MatchingsListResponse>(
      '/api/matchings',
      { params: query }
    );
    return response.data;
  },

  // Get matching by ID
  getById: async (id: number): Promise<Matching> => {
    const response = await apiClient.get<MatchingResponse>(
      `/api/matchings/${id}`
    );
    return response.data.matching;
  },

  // Update matching
  update: async (id: number, data: UpdateMatchingRequest): Promise<Matching> => {
    const response = await apiClient.put<MatchingResponse>(
      `/api/matchings/${id}`,
      data
    );
    return response.data.matching;
  },

  // Complete matching
  complete: async (id: number): Promise<Matching> => {
    const response = await apiClient.post<MatchingResponse>(
      `/api/matchings/${id}/complete`
    );
    return response.data.matching;
  },

  // Cancel matching
  cancel: async (
    id: number,
    data: { cancellation_reason?: string }
  ): Promise<Matching> => {
    const response = await apiClient.post<MatchingResponse>(
      `/api/matchings/${id}/cancel`,
      data
    );
    return response.data.matching;
  },
};
