import { apiClient } from "./api-client";
import { UploadFileResponse, ListFilesResponse } from "@/types/file";

export const fileApi = {
  /**
   * Upload a file for a customer
   */
  uploadCustomerFile: async (
    customerId: number,
    file: File
  ): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(
      `/api/customers/${customerId}/files`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Upload a customer profile photo
   */
  uploadCustomerProfilePhoto: async (
    customerId: number,
    file: File
  ): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(
      `/api/customers/${customerId}/files/profile`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * List customer files
   */
  listCustomerFiles: async (customerId: number): Promise<ListFilesResponse> => {
    const response = await apiClient.get(`/api/customers/${customerId}/files`);
    return response.data;
  },

  /**
   * Delete customer file
   */
  deleteCustomerFile: async (
    customerId: number,
    fileId: number
  ): Promise<void> => {
    await apiClient.delete(`/api/customers/${customerId}/files/${fileId}`);
  },

  /**
   * Get file URL for download/preview
   */
  getFileUrl: (filePath: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000";
    const bucket = process.env.NEXT_PUBLIC_MINIO_BUCKET || "helpernote";
    return `${baseUrl}/${bucket}/${filePath}`;
  },
};
