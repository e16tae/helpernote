import apiClient from './api';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  ListCustomersQuery,
  SearchCustomersQuery,
  CustomerResponse,
  CustomersListResponse,
} from '@/types/customer';

export const customerApi = {
  // Create a new customer
  create: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.post<CustomerResponse>(
      '/api/customers',
      data
    );
    return response.data.customer;
  },

  // Get all customers with optional filters
  list: async (query?: ListCustomersQuery): Promise<CustomersListResponse> => {
    const response = await apiClient.get<CustomersListResponse>(
      '/api/customers',
      { params: query }
    );
    return response.data;
  },

  // Get customer by ID
  getById: async (id: number): Promise<Customer> => {
    const response = await apiClient.get<CustomerResponse>(
      `/api/customers/${id}`
    );
    return response.data.customer;
  },

  // Update customer
  update: async (id: number, data: UpdateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.put<CustomerResponse>(
      `/api/customers/${id}`,
      data
    );
    return response.data.customer;
  },

  // Delete customer (soft delete)
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/customers/${id}`);
  },

  // Search customers by name or phone
  search: async (query: SearchCustomersQuery): Promise<CustomersListResponse> => {
    const response = await apiClient.get<CustomersListResponse>(
      '/api/customers/search',
      { params: query }
    );
    return response.data;
  },
};
