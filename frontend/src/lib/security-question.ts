import { apiClient } from "./api-client";

export interface SecurityQuestion {
  id: number;
  question_text: string;
}

export const securityQuestionApi = {
  // Get all security questions (public endpoint)
  getAll: async (): Promise<SecurityQuestion[]> => {
    const response = await apiClient.get("/api/security-questions");
    return response.data.questions || [];
  },
};
