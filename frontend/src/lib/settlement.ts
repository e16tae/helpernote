import { jobPostingApi } from './job-posting';
import { customerApi } from './customer';
import type {
  SettlementItem,
  SettlementsListResponse,
  SettlementFilters,
  UpdateSettlementRequest,
} from '@/types/settlement';
import type { JobPosting, JobSeekingPosting } from '@/types/job-posting';

export const settlementApi = {
  // List all settlements (combined job postings and job seekings)
  list: async (filters?: SettlementFilters): Promise<SettlementsListResponse> => {
    // Fetch both job postings and job seekings
    const [jobPostingsRes, jobSeekingsRes] = await Promise.all([
      jobPostingApi.listJobPostings({
        settlement_status: filters?.status,
        limit: 1000,
      }),
      jobPostingApi.listJobSeekings({
        settlement_status: filters?.status,
        limit: 1000,
      }),
    ]);

    // Fetch all unique customer IDs
    const customerIds = new Set<number>();
    jobPostingsRes.job_postings.forEach(jp => customerIds.add(jp.customer_id));
    jobSeekingsRes.job_seekings.forEach(js => customerIds.add(js.customer_id));

    // Fetch customer names
    const customers = await Promise.all(
      Array.from(customerIds).map(id => customerApi.getById(id))
    );
    const customerMap = new Map(customers.map(c => [c.id, c.name]));

    // Transform job postings to settlement items
    const jobPostingSettlements: SettlementItem[] = jobPostingsRes.job_postings.map(
      (posting: JobPosting) => ({
        id: posting.id,
        posting_type: 'job_posting' as const,
        customer_id: posting.customer_id,
        customer_name: customerMap.get(posting.customer_id) || 'L  ÆL',
        description: posting.description,
        fee_rate: posting.employer_fee_rate || '0',
        calculated_fee: calculateFee(posting.salary, posting.employer_fee_rate || '0'),
        settlement_status: posting.settlement_status,
        settlement_amount: posting.settlement_amount || null,
        settlement_memo: posting.settlement_memo || null,
        created_at: posting.created_at,
        updated_at: posting.updated_at,
      })
    );

    // Transform job seekings to settlement items
    const jobSeekingSettlements: SettlementItem[] = jobSeekingsRes.job_seekings.map(
      (seeking: JobSeekingPosting) => ({
        id: seeking.id,
        posting_type: 'job_seeking' as const,
        customer_id: seeking.customer_id,
        customer_name: customerMap.get(seeking.customer_id) || 'L  ÆL',
        description: seeking.description,
        fee_rate: seeking.employee_fee_rate || '0',
        calculated_fee: calculateFee(seeking.desired_salary, seeking.employee_fee_rate || '0'),
        settlement_status: seeking.settlement_status,
        settlement_amount: seeking.settlement_amount || null,
        settlement_memo: seeking.settlement_memo || null,
        created_at: seeking.created_at,
        updated_at: seeking.updated_at,
      })
    );

    // Combine and filter by posting type if specified
    let settlements = [...jobPostingSettlements, ...jobSeekingSettlements];

    if (filters?.posting_type) {
      settlements = settlements.filter(s => s.posting_type === filters.posting_type);
    }

    // Filter by search term if specified
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      settlements = settlements.filter(
        s =>
          s.customer_name.toLowerCase().includes(searchLower) ||
          s.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by created_at descending
    settlements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      settlements,
      total: settlements.length,
    };
  },

  // Update settlement status for a posting
  updateStatus: async (
    id: number,
    postingType: 'job_posting' | 'job_seeking',
    data: UpdateSettlementRequest
  ): Promise<void> => {
    if (postingType === 'job_posting') {
      await jobPostingApi.updateJobPosting(id, {
        settlement_status: data.settlement_status,
        settlement_amount: data.settlement_amount,
        settlement_memo: data.settlement_memo,
      });
    } else {
      await jobPostingApi.updateJobSeeking(id, {
        settlement_status: data.settlement_status,
        settlement_amount: data.settlement_amount,
        settlement_memo: data.settlement_memo,
      });
    }
  },
};

// Helper function to calculate fee
function calculateFee(salary: string, feeRate: string): string {
  const salaryNum = parseFloat(salary) || 0;
  const rateNum = parseFloat(feeRate) || 0;
  const fee = (salaryNum * rateNum) / 100;
  return fee.toFixed(2);
}
