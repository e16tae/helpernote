import apiClient from '../api';
import type { JobPosting, JobPostingFormData, JobPostingFilters } from '@/types/job-posting';
import type { PaginatedResponse } from '@/types/api';

export const jobPostingsApi = {
  // Get all job postings with filters
  getJobPostings: async (filters?: JobPostingFilters, page = 1, pageSize = 10) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.settlement_status) params.append('settlement_status', filters.settlement_status);
    if (filters?.is_favorite !== undefined) params.append('is_favorite', String(filters.is_favorite));
    if (filters?.workType) params.append('workType', filters.workType);
    if (filters?.search) params.append('search', filters.search);
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    const response = await apiClient.get<PaginatedResponse<JobPosting>>(
      `/job-postings?${params.toString()}`
    );
    return response.data;
  },

  // Get single job posting
  getJobPosting: async (id: string) => {
    const response = await apiClient.get<JobPosting>(`/job-postings/${id}`);
    return response.data;
  },

  // Create new job posting
  createJobPosting: async (data: JobPostingFormData) => {
    const response = await apiClient.post<JobPosting>('/job-postings', data);
    return response.data;
  },

  // Update job posting
  updateJobPosting: async (id: string, data: Partial<JobPostingFormData>) => {
    const response = await apiClient.put<JobPosting>(`/job-postings/${id}`, data);
    return response.data;
  },

  // Delete job posting
  deleteJobPosting: async (id: string) => {
    const response = await apiClient.delete(`/job-postings/${id}`);
    return response.data;
  },

  // Toggle favorite
  toggleFavorite: async (id: string) => {
    const response = await apiClient.post<JobPosting>(`/job-postings/${id}/favorite`);
    return response.data;
  },

  // Update status
  updateStatus: async (id: string, status: JobPosting['posting_status']) => {
    const response = await apiClient.patch<JobPosting>(`/job-postings/${id}/status`, { status });
    return response.data;
  },
};
