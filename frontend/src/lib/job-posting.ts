import apiClient from './api';
import type {
  JobPosting,
  JobSeekingPosting,
  CreateJobPostingRequest,
  CreateJobSeekingPostingRequest,
  UpdateJobPostingRequest,
  UpdateJobSeekingPostingRequest,
  ListJobPostingsQuery,
  ListJobSeekingsQuery,
  JobPostingResponse,
  JobPostingsListResponse,
  JobSeekingResponse,
  JobSeekingsListResponse,
} from '@/types/job-posting';

export const jobPostingApi = {
  // Create a new job posting
  createJobPosting: async (data: CreateJobPostingRequest): Promise<JobPosting> => {
    const response = await apiClient.post<JobPostingResponse>(
      '/api/job-postings',
      data
    );
    return response.data.job_posting;
  },

  // Create a new job seeking posting
  createJobSeeking: async (data: CreateJobSeekingPostingRequest): Promise<JobSeekingPosting> => {
    const response = await apiClient.post<JobSeekingResponse>(
      '/api/job-seekings',
      data
    );
    return response.data.job_seeking;
  },

  // List all job postings with optional filters
  listJobPostings: async (query?: ListJobPostingsQuery): Promise<JobPostingsListResponse> => {
    const response = await apiClient.get<JobPostingsListResponse>(
      '/api/job-postings',
      { params: query }
    );
    return response.data;
  },

  // List all job seeking postings with optional filters
  listJobSeekings: async (query?: ListJobSeekingsQuery): Promise<JobSeekingsListResponse> => {
    const response = await apiClient.get<JobSeekingsListResponse>(
      '/api/job-seekings',
      { params: query }
    );
    return response.data;
  },

  // Get job posting by ID
  getJobPostingById: async (id: number): Promise<JobPosting> => {
    const response = await apiClient.get<JobPostingResponse>(
      `/api/job-postings/${id}`
    );
    return response.data.job_posting;
  },

  // Get job seeking posting by ID
  getJobSeekingById: async (id: number): Promise<JobSeekingPosting> => {
    const response = await apiClient.get<JobSeekingResponse>(
      `/api/job-seekings/${id}`
    );
    return response.data.job_seeking;
  },

  // Update job posting
  updateJobPosting: async (id: number, data: UpdateJobPostingRequest): Promise<JobPosting> => {
    const response = await apiClient.put<JobPostingResponse>(
      `/api/job-postings/${id}`,
      data
    );
    return response.data.job_posting;
  },

  // Update job seeking posting
  updateJobSeeking: async (id: number, data: UpdateJobSeekingPostingRequest): Promise<JobSeekingPosting> => {
    const response = await apiClient.put<JobSeekingResponse>(
      `/api/job-seekings/${id}`,
      data
    );
    return response.data.job_seeking;
  },

  // Delete job posting
  deleteJobPosting: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/job-postings/${id}`);
  },

  // Delete job seeking posting
  deleteJobSeeking: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/job-seekings/${id}`);
  },
};
