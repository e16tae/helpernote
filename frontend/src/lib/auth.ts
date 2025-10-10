import apiClient from './api';
import { storage } from './storage';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  User,
} from '@/types/auth';
import type { ApiResponse } from '@/types/api';

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      '/api/auth/login',
      credentials
    );
    const { access_token, refresh_token, user } = response.data;

    // Store tokens and user data
    storage.setAccessToken(access_token);
    storage.setRefreshToken(refresh_token);
    storage.setUser(user);

    return response.data;
  },

  // Register
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/register', data);
    const { access_token, refresh_token, user } = response.data;

    // Store tokens and user data
    storage.setAccessToken(access_token);
    storage.setRefreshToken(refresh_token);
    storage.setUser(user);

    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storage.clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },

  // Forgot password
  resetPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      '/api/auth/forgot-password',
      data
    );
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/auth/me');
    storage.setUser(response.data);
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!storage.getAccessToken();
  },

  // Get user from storage
  getUser: (): User | null => {
    return storage.getUser();
  },
};
