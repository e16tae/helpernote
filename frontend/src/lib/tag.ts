import apiClient from './api';
import type {
  Tag,
  CreateTagRequest,
  UpdateTagRequest,
  TagResponse,
  TagsListResponse,
} from '@/types/tag';

export const tagApi = {
  // Create a new tag
  create: async (data: CreateTagRequest): Promise<Tag> => {
    const response = await apiClient.post<TagResponse>(
      '/api/tags',
      data
    );
    return response.data.tag;
  },

  // Get all tags with optional pagination
  list: async (query?: { limit?: number; offset?: number }): Promise<TagsListResponse> => {
    const response = await apiClient.get<TagsListResponse>(
      '/api/tags',
      { params: query }
    );
    return response.data;
  },

  // Get tag by ID
  getById: async (id: number): Promise<Tag> => {
    const response = await apiClient.get<TagResponse>(
      `/api/tags/${id}`
    );
    return response.data.tag;
  },

  // Update tag
  update: async (id: number, data: UpdateTagRequest): Promise<Tag> => {
    const response = await apiClient.put<TagResponse>(
      `/api/tags/${id}`,
      data
    );
    return response.data.tag;
  },

  // Delete tag
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/tags/${id}`);
  },

  // Attach tag to customer
  attachToCustomer: async (customerId: number, tagId: number): Promise<void> => {
    await apiClient.post(`/api/customers/${customerId}/tags/${tagId}`);
  },

  // Detach tag from customer
  detachFromCustomer: async (customerId: number, tagId: number): Promise<void> => {
    await apiClient.delete(`/api/customers/${customerId}/tags/${tagId}`);
  },

  // List customer tags
  listCustomerTags: async (customerId: number): Promise<TagsListResponse> => {
    const response = await apiClient.get<TagsListResponse>(
      `/api/customers/${customerId}/tags`
    );
    return response.data;
  },

  // Attach tag to job posting
  attachToJobPosting: async (jobPostingId: number, tagId: number): Promise<void> => {
    await apiClient.post(`/api/job-postings/${jobPostingId}/tags/${tagId}`);
  },

  // Detach tag from job posting
  detachFromJobPosting: async (jobPostingId: number, tagId: number): Promise<void> => {
    await apiClient.delete(`/api/job-postings/${jobPostingId}/tags/${tagId}`);
  },

  // List job posting tags
  listJobPostingTags: async (jobPostingId: number): Promise<TagsListResponse> => {
    const response = await apiClient.get<TagsListResponse>(
      `/api/job-postings/${jobPostingId}/tags`
    );
    return response.data;
  },

  // Attach tag to job seeking
  attachToJobSeeking: async (jobSeekingId: number, tagId: number): Promise<void> => {
    await apiClient.post(`/api/job-seekings/${jobSeekingId}/tags/${tagId}`);
  },

  // Detach tag from job seeking
  detachFromJobSeeking: async (jobSeekingId: number, tagId: number): Promise<void> => {
    await apiClient.delete(`/api/job-seekings/${jobSeekingId}/tags/${tagId}`);
  },

  // List job seeking tags
  listJobSeekingTags: async (jobSeekingId: number): Promise<TagsListResponse> => {
    const response = await apiClient.get<TagsListResponse>(
      `/api/job-seekings/${jobSeekingId}/tags`
    );
    return response.data;
  },
};
