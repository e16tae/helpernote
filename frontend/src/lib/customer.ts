import { apiClient } from "./api-client";
import {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerMemo,
  CustomerFile,
} from "@/types/customer";

export const customerApi = {
  // Get all customers
  getAll: async (): Promise<Customer[]> => {
    const response = await apiClient.get("/api/customers");
    return response.data.customers || [];
  },

  // Search customers
  search: async (query: string): Promise<Customer[]> => {
    const response = await apiClient.get("/api/customers/search", {
      params: { q: query },
    });
    return response.data.customers || [];
  },

  // Get customer by ID
  getById: async (customerId: number): Promise<Customer> => {
    const response = await apiClient.get(`/api/customers/${customerId}`);
    return response.data.customer;
  },

  // Create new customer
  create: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.post("/api/customers", data);
    return response.data.customer;
  },

  // Update customer
  update: async (
    customerId: number,
    data: UpdateCustomerRequest
  ): Promise<Customer> => {
    const response = await apiClient.put(`/api/customers/${customerId}`, data);
    return response.data.customer;
  },

  // Delete customer (soft delete)
  delete: async (customerId: number): Promise<void> => {
    await apiClient.delete(`/api/customers/${customerId}`);
  },

  // Get customer memos
  getMemos: async (customerId: number): Promise<CustomerMemo[]> => {
    const response = await apiClient.get(`/api/customers/${customerId}/memos`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.data?.memos)) {
      return response.data.memos;
    }
    return [];
  },

  // Create customer memo
  createMemo: async (
    customerId: number,
    memoText: string
  ): Promise<CustomerMemo> => {
    const response = await apiClient.post(
      `/api/customers/${customerId}/memos`,
      { customer_id: customerId, memo_content: memoText }
    );
    return response.data.memo;
  },

  // Update customer memo
  updateMemo: async (
    customerId: number,
    memoId: number,
    memoText: string
  ): Promise<CustomerMemo> => {
    const response = await apiClient.put(
      `/api/customers/${customerId}/memos/${memoId}`,
      { memo_content: memoText }
    );
    return response.data.memo;
  },

  // Delete customer memo
  deleteMemo: async (customerId: number, memoId: number): Promise<void> => {
    await apiClient.delete(`/api/customers/${customerId}/memos/${memoId}`);
  },

  // Get customer files
  getFiles: async (customerId: number): Promise<CustomerFile[]> => {
    const response = await apiClient.get(`/api/customers/${customerId}/files`);
    if (Array.isArray(response.data)) {
      return response.data as CustomerFile[];
    }
    if (Array.isArray(response.data?.files)) {
      return response.data.files as CustomerFile[];
    }
    return [];
  },

  // Upload customer file
  uploadFile: async (
    customerId: number,
    file: File,
    isProfile: boolean = false
  ): Promise<CustomerFile> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("is_profile", String(isProfile));

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
};
