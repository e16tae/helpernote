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
}
