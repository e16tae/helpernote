import { apiClient } from "./api-client";
import { LoginRequest, LoginResponse, RegisterRequest, User } from "@/types/user";

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post("/api/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<void> => {
    await apiClient.post("/api/auth/register", data);
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get("/api/auth/me");
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
  },
};
