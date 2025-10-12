import { apiClient } from "./api-client";
import {
  JobPosting,
  JobSeekingPosting,
  CreateJobPostingRequest,
  CreateJobSeekingRequest,
  JobPostingMemo,
  JobSeekingMemo,
} from "@/types/job-posting";

export const jobPostingApi = {
  // Get all job postings
  getAll: async (): Promise<JobPosting[]> => {
    const response = await apiClient.get("/api/job-postings");
    return response.data.job_postings || [];
  },

  // Get job posting by ID
  getById: async (postingId: number): Promise<JobPosting> => {
    const response = await apiClient.get(`/api/job-postings/${postingId}`);
    return response.data.job_posting;
  },

  // Create new job posting
  create: async (data: CreateJobPostingRequest): Promise<JobPosting> => {
    const response = await apiClient.post("/api/job-postings", data);
    return response.data.job_posting;
  },

  // Update job posting
  update: async (
    postingId: number,
    data: Partial<CreateJobPostingRequest>
  ): Promise<JobPosting> => {
    const response = await apiClient.put(`/api/job-postings/${postingId}`, data);
    return response.data.job_posting;
  },

  // Delete job posting
  delete: async (postingId: number): Promise<void> => {
    await apiClient.delete(`/api/job-postings/${postingId}`);
  },

  // Get job posting memos
  getMemos: async (postingId: number): Promise<JobPostingMemo[]> => {
    const response = await apiClient.get(`/api/job-postings/${postingId}/memos`);
    return response.data;
  },

  // Create job posting memo
  createMemo: async (
    postingId: number,
    memoText: string
  ): Promise<JobPostingMemo> => {
    const response = await apiClient.post(
      `/api/job-postings/${postingId}/memos`,
      { memo_text: memoText }
    );
    return response.data;
  },
};

export const jobSeekingApi = {
  // Get all job seeking postings
  getAll: async (): Promise<JobSeekingPosting[]> => {
    const response = await apiClient.get("/api/job-seekings");
    return response.data.job_seekings || [];
  },

  // Get job seeking posting by ID
  getById: async (seekingId: number): Promise<JobSeekingPosting> => {
    const response = await apiClient.get(`/api/job-seekings/${seekingId}`);
    return response.data.job_seeking;
  },

  // Create new job seeking posting
  create: async (data: CreateJobSeekingRequest): Promise<JobSeekingPosting> => {
    const response = await apiClient.post("/api/job-seekings", data);
    return response.data.job_seeking;
  },

  // Update job seeking posting
  update: async (
    seekingId: number,
    data: Partial<CreateJobSeekingRequest>
  ): Promise<JobSeekingPosting> => {
    const response = await apiClient.put(`/api/job-seekings/${seekingId}`, data);
    return response.data.job_seeking;
  },

  // Delete job seeking posting
  delete: async (seekingId: number): Promise<void> => {
    await apiClient.delete(`/api/job-seekings/${seekingId}`);
  },

  // Get job seeking memos
  getMemos: async (seekingId: number): Promise<JobSeekingMemo[]> => {
    const response = await apiClient.get(`/api/job-seekings/${seekingId}/memos`);
    return response.data;
  },

  // Create job seeking memo
  createMemo: async (
    seekingId: number,
    memoText: string
  ): Promise<JobSeekingMemo> => {
    const response = await apiClient.post(
      `/api/job-seekings/${seekingId}/memos`,
      { memo_text: memoText }
    );
    return response.data;
  },
};
