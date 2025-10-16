import { apiClient } from "./api-client";
import { User, UpdateUserProfileRequest } from "@/types/user";

export interface UserMemo {
  id: number;
  user_id: number;
  memo_content: string;
  created_at: string;
  updated_at: string;
}

export interface UserFile {
  id: number;
  user_id: number;
  file_path: string;
  file_type: string;
  file_size: number | null;
  original_filename: string | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}

export const userApi = {
  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get("/api/profile");
    return response.data.user;
  },

  // Update user profile
  updateProfile: async (data: UpdateUserProfileRequest): Promise<User> => {
    const response = await apiClient.put("/api/profile", data);
    return response.data.user;
  },

  // User memos
  getMemos: async (): Promise<UserMemo[]> => {
    const response = await apiClient.get("/api/users/memos");
    return response.data.memos || [];
  },

  createMemo: async (memoContent: string): Promise<UserMemo> => {
    const response = await apiClient.post("/api/users/memos", {
      memo_content: memoContent,
    });
    return response.data.memo;
  },

  updateMemo: async (memoId: number, memoContent: string): Promise<UserMemo> => {
    const response = await apiClient.put(`/api/users/memos/${memoId}`, {
      memo_content: memoContent,
    });
    return response.data.memo;
  },

  deleteMemo: async (memoId: number): Promise<void> => {
    await apiClient.delete(`/api/users/memos/${memoId}`);
  },

  // User files
  getFiles: async (): Promise<UserFile[]> => {
    const response = await apiClient.get("/api/users/files");
    return response.data.files || [];
  },

  uploadFile: async (file: File): Promise<UserFile> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/api/users/files", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.file;
  },

  deleteFile: async (fileId: number): Promise<void> => {
    await apiClient.delete(`/api/users/files/${fileId}`);
  },
};
