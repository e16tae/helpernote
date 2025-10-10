import apiClient from '@/lib/api';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
  CustomerListResponse,
} from '@/types/customer';
import type { ApiResponse } from '@/types/api';

export const customersApi = {
  /**
   * List customers with optional filters
   */
  async listCustomers(filters?: CustomerFilters): Promise<CustomerListResponse> {
    const params = new URLSearchParams();

    if (filters?.customer_type) {
      params.append('customerType', filters.customer_type);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.pageSize) {
      params.append('pageSize', filters.pageSize.toString());
    }

    const response = await apiClient.get<CustomerListResponse>(
      `/customers?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get a single customer by ID
   */
  async getCustomer(id: string): Promise<Customer> {
    const response = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error('Customer not found');
  },

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const response = await apiClient.post<ApiResponse<Customer>>('/customers', data);
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to create customer');
  },

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    const response = await apiClient.patch<ApiResponse<Customer>>(
      `/customers/${id}`,
      data
    );
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to update customer');
  },

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },

  /**
   * Search customers by query
   */
  async searchCustomers(query: string, page = 1, pageSize = 20): Promise<CustomerListResponse> {
    const response = await apiClient.get<CustomerListResponse>(
      `/customers/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },
};
