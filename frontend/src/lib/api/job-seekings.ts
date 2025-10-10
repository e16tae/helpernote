import apiClient from '../api';
import type { JobSeeking, JobSeekingFormData } from '@/types/job-posting';
import type { PaginatedResponse } from '@/types/api';

export const jobSeekingsApi = {
  // Get all job seekings
  getJobSeekings: async (status?: string, search?: string, page = 1, pageSize = 10) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    const response = await apiClient.get<PaginatedResponse<JobSeeking>>(
      `/job-seekings?${params.toString()}`
    );
    return response.data;
  },

  // Get single job seeking
  getJobSeeking: async (id: string) => {
    const response = await apiClient.get<JobSeeking>(`/job-seekings/${id}`);
    return response.data;
  },

  // Create new job seeking
  createJobSeeking: async (data: JobSeekingFormData) => {
    const response = await apiClient.post<JobSeeking>('/job-seekings', data);
    return response.data;
  },

  // Update job seeking
  updateJobSeeking: async (id: string, data: Partial<JobSeekingFormData>) => {
    const response = await apiClient.put<JobSeeking>(`/job-seekings/${id}`, data);
    return response.data;
  },

  // Delete job seeking
  deleteJobSeeking: async (id: string) => {
    const response = await apiClient.delete(`/job-seekings/${id}`);
    return response.data;
  },

  // Update status
  updateStatus: async (id: string, status: JobSeeking['posting_status']) => {
    const response = await apiClient.patch<JobSeeking>(`/job-seekings/${id}/status`, { status });
    return response.data;
  },
};
