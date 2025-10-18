import { apiClient } from "./api-client";

export interface Tag {
  id: number;
  user_id: number;
  tag_name: string;
  tag_color: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTagRequest {
  tag_name: string;
  tag_color?: string;
  description?: string;
}

export interface UpdateTagRequest {
  tag_name?: string;
  tag_color?: string;
  description?: string;
}

export interface TagsListResponse {
  tags: Tag[];
  total: number;
}

export const tagApi = {
  // Get all tags for the current user
  getAll: async (): Promise<Tag[]> => {
    const response = await apiClient.get<TagsListResponse>("/api/tags");
    return response.data.tags || [];
  },

  // Get tag by ID
  getById: async (tagId: number): Promise<Tag> => {
    const response = await apiClient.get(`/api/tags/${tagId}`);
    return response.data.tag;
  },

  // Create new tag
  create: async (data: CreateTagRequest): Promise<Tag> => {
    const response = await apiClient.post("/api/tags", data);
    return response.data.tag;
  },

  // Update tag
  update: async (tagId: number, data: UpdateTagRequest): Promise<Tag> => {
    const response = await apiClient.put(`/api/tags/${tagId}`, data);
    return response.data.tag;
  },

  // Delete tag
  delete: async (tagId: number): Promise<void> => {
    await apiClient.delete(`/api/tags/${tagId}`);
  },

  // Attach tags to customer
  attachToCustomer: async (customerId: number, tagIds: number[]): Promise<void> => {
    await apiClient.post(`/api/customers/${customerId}/tags`, { tag_ids: tagIds });
  },

  // Detach tag from customer
  detachFromCustomer: async (customerId: number, tagId: number): Promise<void> => {
    await apiClient.delete(`/api/customers/${customerId}/tags/${tagId}`);
  },

  // List customer tags
  listCustomerTags: async (customerId: number): Promise<Tag[]> => {
    const response = await apiClient.get<TagsListResponse>(`/api/customers/${customerId}/tags`);
    return response.data.tags || [];
  },

  // Attach tags to job posting
  attachToJobPosting: async (jobPostingId: number, tagIds: number[]): Promise<void> => {
    await apiClient.post(`/api/job-postings/${jobPostingId}/tags`, { tag_ids: tagIds });
  },

  // Detach tag from job posting
  detachFromJobPosting: async (jobPostingId: number, tagId: number): Promise<void> => {
    await apiClient.delete(`/api/job-postings/${jobPostingId}/tags/${tagId}`);
  },

  // List job posting tags
  listJobPostingTags: async (jobPostingId: number): Promise<Tag[]> => {
    const response = await apiClient.get<TagsListResponse>(`/api/job-postings/${jobPostingId}/tags`);
    return response.data.tags || [];
  },

  // Attach tags to job seeking
  attachToJobSeeking: async (jobSeekingId: number, tagIds: number[]): Promise<void> => {
    await apiClient.post(`/api/job-seekings/${jobSeekingId}/tags`, { tag_ids: tagIds });
  },

  // Detach tag from job seeking
  detachFromJobSeeking: async (jobSeekingId: number, tagId: number): Promise<void> => {
    await apiClient.delete(`/api/job-seekings/${jobSeekingId}/tags/${tagId}`);
  },

  // List job seeking tags
  listJobSeekingTags: async (jobSeekingId: number): Promise<Tag[]> => {
    const response = await apiClient.get<TagsListResponse>(`/api/job-seekings/${jobSeekingId}/tags`);
    return response.data.tags || [];
  },
};
