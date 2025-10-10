export type CustomerType = 'employer' | 'employee' | 'both';

export interface Customer {
  id: number;
  user_id: number;
  name: string;
  birth_date?: string; // ISO date string
  phone: string;
  address?: string;
  profile_photo_id?: number;
  customer_type: CustomerType;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateCustomerRequest {
  name: string;
  birth_date?: string; // ISO date string (YYYY-MM-DD)
  phone: string;
  address?: string;
  customer_type: CustomerType;
}

export interface UpdateCustomerRequest {
  name?: string;
  birth_date?: string; // ISO date string (YYYY-MM-DD)
  phone?: string;
  address?: string;
  profile_photo_id?: number;
  customer_type?: CustomerType;
}

export interface ListCustomersQuery {
  customer_type?: CustomerType;
  limit?: number;
  offset?: number;
}

export interface SearchCustomersQuery {
  q: string;
  limit?: number;
  offset?: number;
}

export interface CustomerResponse {
  customer: Customer;
}

export interface CustomersListResponse {
  customers: Customer[];
  total: number;
}
