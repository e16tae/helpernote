export type MatchingStatus = 'InProgress' | 'Completed' | 'Cancelled';

export interface Matching {
  id: number;
  job_posting_id: number;
  job_seeking_posting_id: number;
  matched_at: string;
  agreed_salary: string; // Decimal as string
  employer_fee_rate: string; // Decimal as string
  employee_fee_rate: string; // Decimal as string
  employer_fee_amount?: string; // Decimal as string
  employee_fee_amount?: string; // Decimal as string
  matching_status: MatchingStatus;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Expanded data from joins
  job_posting?: {
    id: number;
    customer_id: number;
    salary: string;
    description: string;
    customer_name?: string;
    customer_phone?: string;
  };
  job_seeking_posting?: {
    id: number;
    customer_id: number;
    desired_salary: string;
    description: string;
    preferred_location: string;
    customer_name?: string;
    customer_phone?: string;
  };
}

export interface CreateMatchingRequest {
  job_posting_id: number;
  job_seeking_posting_id: number;
  agreed_salary: string; // Decimal as string
  employer_fee_rate: string; // Decimal as string
  employee_fee_rate: string; // Decimal as string;
}

export interface UpdateMatchingRequest {
  agreed_salary?: string; // Decimal as string
  employer_fee_rate?: string; // Decimal as string
  employee_fee_rate?: string; // Decimal as string
  matching_status?: MatchingStatus;
  cancellation_reason?: string;
}

export interface MatchingResponse {
  matching: Matching;
}

export interface MatchingsListResponse {
  matchings: Matching[];
  total: number;
}

export interface ListMatchingsQuery {
  status?: MatchingStatus;
  settlement_status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Type aliases for compatibility
export type MatchingFormData = CreateMatchingRequest;
export type MatchingFilters = ListMatchingsQuery;

// Fee calculation interface
export interface FeeCalculation {
  employer_fee: string;
  employee_fee: string;
  total_fee: string;
}

// Timeline event for matching history
export interface MatchingTimelineEvent {
  id: number;
  matching_id: number;
  event_type: 'created' | 'updated' | 'cancelled' | 'completed';
  description: string;
  created_at: string;
  created_by?: number;
}
