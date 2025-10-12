import { apiClient } from "./api-client";
import { JobPosting, JobSeekingPosting } from "@/types/job-posting";

export interface UpdateSettlementRequest {
  settlement_status?: "unsettled" | "settled";
  settlement_amount?: number;
  settlement_memo?: string;
}

export const settlementApi = {
  // Update job posting settlement
  updateJobPostingSettlement: async (
    postingId: number,
    data: UpdateSettlementRequest
  ): Promise<JobPosting> => {
    const response = await apiClient.put(
      `/api/job-postings/${postingId}/settlement`,
      data
    );
    return response.data.job_posting;
  },

  // Update job seeking settlement
  updateJobSeekingSettlement: async (
    seekingId: number,
    data: UpdateSettlementRequest
  ): Promise<void> => {
    await apiClient.put(`/api/job-seekings/${seekingId}/settlement`, data);
  },

  // Toggle favorite for job posting
  toggleJobPostingFavorite: async (postingId: number): Promise<JobPosting> => {
    const response = await apiClient.post(`/api/job-postings/${postingId}/favorite`);
    return response.data.job_posting;
  },

  // Toggle favorite for job seeking
  toggleJobSeekingFavorite: async (seekingId: number): Promise<JobSeekingPosting> => {
    const response = await apiClient.post(`/api/job-seekings/${seekingId}/favorite`);
    return response.data.job_seeking;
  },
};
