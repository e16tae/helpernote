export interface User {
  id: number;
  username: string;
  phone: string | null;
  default_employer_fee_rate: string;
  default_employee_fee_rate: string;
  created_at: string;
}

export interface UserProfileResponse {
  user: User;
}

export interface UpdateUserProfileRequest {
  phone?: string | null;
  default_employer_fee_rate?: number;
  default_employee_fee_rate?: number;
}

export interface UserMemo {
  memo_id: number;
  user_id: number;
  memo_text: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  security_question_id: number;
  security_answer: string;
  phone?: string;
}

export interface SecurityQuestion {
  id: number;
  question_text: string;
  created_at: string;
  updated_at: string;
}
