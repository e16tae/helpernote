export type PostingStatus = 'published' | 'in_progress' | 'closed' | 'cancelled';
export type SettlementStatus = 'unsettled' | 'settled';

// Runtime constants for PostingStatus
export const POSTING_STATUS = {
  published: 'published' as const,
  in_progress: 'in_progress' as const,
  closed: 'closed' as const,
  cancelled: 'cancelled' as const,
} as const;

export const POSTING_STATUS_LABELS: Record<PostingStatus, string> = {
  published: '공개',
  in_progress: '진행중',
  closed: '마감',
  cancelled: '취소됨',
};

// Job Posting (구인 공고)
export interface JobPosting {
  id: number;
  customer_id: number;
  salary: string; // Decimal as string
  description: string;
  employer_fee_rate?: string; // Decimal as string
  settlement_status: SettlementStatus;
  settlement_amount?: string; // Decimal as string
  settlement_memo?: string;
  posting_status: PostingStatus;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateJobPostingRequest {
  customer_id: number;
  salary: string; // Decimal as string
  description: string;
  employer_fee_rate?: string; // Decimal as string
}

export interface UpdateJobPostingRequest {
  salary?: string; // Decimal as string
  description?: string;
  employer_fee_rate?: string; // Decimal as string
  settlement_status?: SettlementStatus;
  settlement_amount?: string; // Decimal as string
  settlement_memo?: string;
  posting_status?: PostingStatus;
  is_favorite?: boolean;
}

// Job Seeking Posting (구직 공고)
export interface JobSeekingPosting {
  id: number;
  customer_id: number;
  desired_salary: string; // Decimal as string
  description: string;
  preferred_location: string;
  employee_fee_rate?: string; // Decimal as string
  settlement_status: SettlementStatus;
  settlement_amount?: string; // Decimal as string
  settlement_memo?: string;
  posting_status: PostingStatus;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateJobSeekingPostingRequest {
  customer_id: number;
  desired_salary: string; // Decimal as string
  description: string;
  preferred_location: string;
  employee_fee_rate?: string; // Decimal as string
}

export interface UpdateJobSeekingPostingRequest {
  desired_salary?: string; // Decimal as string
  description?: string;
  preferred_location?: string;
  employee_fee_rate?: string; // Decimal as string
  settlement_status?: SettlementStatus;
  settlement_amount?: string; // Decimal as string
  settlement_memo?: string;
  posting_status?: PostingStatus;
  is_favorite?: boolean;
}

// API Response types
export interface JobPostingResponse {
  job_posting: JobPosting;
}

export interface JobPostingsListResponse {
  job_postings: JobPosting[];
  total: number;
}

export interface JobSeekingResponse {
  job_seeking: JobSeekingPosting;
}

export interface JobSeekingsListResponse {
  job_seekings: JobSeekingPosting[];
  total: number;
}

// Query parameters
export interface ListJobPostingsQuery {
  status?: PostingStatus;
  settlement_status?: SettlementStatus;
  is_favorite?: boolean;
  search?: string;
  workType?: string;
  limit?: number;
  offset?: number;
}

export interface ListJobSeekingsQuery {
  status?: PostingStatus;
  settlement_status?: SettlementStatus;
  preferred_location?: string;
  limit?: number;
  offset?: number;
}

// Type aliases for compatibility
export type JobSeeking = JobSeekingPosting;
export type JobSeekingFormData = CreateJobSeekingPostingRequest;
export type JobPostingFormData = CreateJobPostingRequest;
export type JobPostingFilters = ListJobPostingsQuery;
