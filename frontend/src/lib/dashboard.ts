import { apiClient } from "./api-client";

export interface DashboardStats {
  total_customers: number;
  job_postings_count: number;
  job_seekings_count: number;
  matchings_count: number;
  pending_amount: string;
  total_revenue: string;
}

export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get("/api/dashboard/stats");
    return response.data;
  },
};
