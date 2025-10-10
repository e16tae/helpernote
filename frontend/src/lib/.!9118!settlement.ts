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
    const customer_ids = new Set<number>();
    jobPostingsRes.job_postings.forEach(jp => customer_ids.add(jp.customer_id));
    jobSeekingsRes.job_seekings.forEach(js => customer_ids.add(js.customer_id));

    // Fetch customer names
    const customers = await Promise.all(
      Array.from(customer_ids).map(id => customerApi.getById(id))
    );
    const customerMap = new Map(customers.map(c => [c.id, c.name]));

    // Transform job postings to settlement items
    const jobPostingSettlements: SettlementItem[] = jobPostingsRes.job_postings.map(
      (posting: JobPosting) => ({
        id: posting.id,
        posting_type: 'job_posting' as const,
        customer_id: posting.customer_id,
