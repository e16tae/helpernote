import { apiClient } from "./api-client";
import { UploadFileResponse, ListFilesResponse, CustomerFile } from "@/types/file";

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
      `/api/customers/${customerId}/profile-photo`,
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
  listCustomerFiles: async (customerId: number): Promise<CustomerFile[]> => {
    const response = await apiClient.get(`/api/customers/${customerId}/files`);
    if (Array.isArray(response.data)) {
      return response.data as CustomerFile[];
    }
    if (Array.isArray(response.data?.files)) {
      return response.data.files as CustomerFile[];
    }
    return [];
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
