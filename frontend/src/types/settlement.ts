export type SettlementStatus = 'unsettled' | 'settled';

export type PostingType = 'job_posting' | 'job_seeking';

// Settlement item representing a posting (either job_posting or job_seeking_posting)
export interface SettlementItem {
  id: number;
  posting_type: PostingType;
  customer_id: number;
  customer_name: string;
  description: string;
  fee_rate: string;
  calculated_fee: string;
  settlement_status: SettlementStatus;
  settlement_amount: string | null;
  settlement_memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettlementsListResponse {
  settlements: SettlementItem[];
  total: number;
}

export interface UpdateSettlementRequest {
  settlement_status: SettlementStatus;
  settlement_amount?: string;
  settlement_memo?: string;
}

export interface SettlementFilters {
  status?: SettlementStatus;
  posting_type?: PostingType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Type aliases for compatibility
export type Settlement = SettlementItem;

// Settlement form data
export interface SettlementFormData {
  settlement_status: SettlementStatus;
  settlement_amount?: string;
  settlement_memo?: string;
}

// Settlement statistics
export interface SettlementStats {
  total_unsettled: number;
  total_settled: number;
  total_unsettled_amount: string;
  total_settled_amount: string;
  monthly_stats?: {
    month: string;
    settled_count: number;
    settled_amount: string;
  }[];
}

// Settlement export data
export interface SettlementExportData {
  settlements: SettlementItem[];
  total_amount: string;
  export_date: string;
}
