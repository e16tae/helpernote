export type CustomerType = "Employer" | "Employee" | "Both";

export interface Customer {
  id: number;
  user_id: number;
  name: string;
  birth_date: string | null;
  phone: string;
  address: string | null;
  profile_photo_id: number | null;
  customer_type: CustomerType;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CustomerMemo {
  id: number;
  customer_id: number;
  memo_content: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CustomerFile {
  id: number;
  customer_id: number;
  file_path: string;
  file_type: string;
  file_size: number | null;
  thumbnail_path: string | null;
  original_filename: string | null;
  mime_type: string | null;
  is_profile: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CustomerTag {
  id: number;
  user_id: number;
  tag_name: string;
  tag_color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateCustomerRequest {
  name: string;
  birth_date?: string | null;
  phone: string;
  address?: string | null;
  customer_type: CustomerType;
}

export interface UpdateCustomerRequest {
  name?: string;
  birth_date?: string | null;
  phone?: string;
  address?: string | null;
  profile_photo_id?: number | null;
  customer_type?: CustomerType;
}
