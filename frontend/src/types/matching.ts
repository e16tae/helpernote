export type MatchingStatus = "InProgress" | "Completed" | "Cancelled";

export interface Matching {
  id: number;
  job_posting_id: number;
  job_seeking_posting_id: number;
  matched_at: string;
  agreed_salary: number;
  employer_fee_rate: number;
  employee_fee_rate: number;
  employer_fee_amount: number | null;
  employee_fee_amount: number | null;
  matching_status: MatchingStatus;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MatchingMemo {
  id: number;
  matching_id: number;
  memo_content: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SettlementMemo {
  id: number;
  matching_id: number;
  settlement_type: "employer" | "employee";
  settlement_amount: number;
  memo_text: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateMatchingRequest {
  job_posting_id: number;
  job_seeking_posting_id: number;
  agreed_salary: number;
  employer_fee_rate: number;
  employee_fee_rate: number;
}

export interface UpdateMatchingRequest {
  agreed_salary?: number;
  employer_fee_rate?: number;
  employee_fee_rate?: number;
  matching_status?: MatchingStatus;
  cancellation_reason?: string | null;
}
