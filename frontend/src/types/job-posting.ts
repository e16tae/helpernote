export type PostingStatus = "Published" | "InProgress" | "Closed" | "Cancelled";
export type SettlementStatus = "Unsettled" | "Settled";

export interface JobPosting {
  id: number;
  customer_id: number;
  salary: number;
  description: string;
  employer_fee_rate: number | null;
  settlement_status: SettlementStatus;
  settlement_amount: number | null;
  settlement_memo: string | null;
  posting_status: PostingStatus;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface JobSeekingPosting {
  id: number;
  customer_id: number;
  desired_salary: number;
  description: string;
  preferred_location: string;
  employee_fee_rate: number | null;
  settlement_status: SettlementStatus;
  settlement_amount: number | null;
  settlement_memo: string | null;
  posting_status: PostingStatus;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface JobPostingMemo {
  id: number;
  job_posting_id: number;
  memo_content: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface JobSeekingMemo {
  id: number;
  job_seeking_posting_id: number;
  memo_content: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateJobPostingRequest {
  customer_id: number;
  salary: number;
  description: string;
  employer_fee_rate?: number | null;
}

export interface UpdateJobPostingRequest {
  salary?: number;
  description?: string;
  employer_fee_rate?: number | null;
  settlement_status?: SettlementStatus;
  settlement_amount?: number | null;
  settlement_memo?: string | null;
  posting_status?: PostingStatus;
  is_favorite?: boolean;
}

export interface CreateJobSeekingRequest {
  customer_id: number;
  desired_salary: number;
  description: string;
  preferred_location: string;
  employee_fee_rate?: number | null;
}

export interface UpdateJobSeekingRequest {
  desired_salary?: number;
  description?: string;
  preferred_location?: string;
  employee_fee_rate?: number | null;
  settlement_status?: SettlementStatus;
  settlement_amount?: number | null;
  settlement_memo?: string | null;
  posting_status?: PostingStatus;
  is_favorite?: boolean;
}
