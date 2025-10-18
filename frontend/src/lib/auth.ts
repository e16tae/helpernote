import { apiClient } from "./api-client";
import { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types/user";

export const authApi = {
  login: async (data: LoginRequest): Promise<User> => {
    const response = await apiClient.post("/api/auth/login", data);
    const { user } = response.data as AuthResponse;
    return user;
  },

  register: async (data: RegisterRequest): Promise<void> => {
    await apiClient.post("/api/auth/register", data);
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get("/api/profile");
    return response.data.user;
  },

  logout: async () => {
    await apiClient.post("/api/auth/logout");
  },
};
