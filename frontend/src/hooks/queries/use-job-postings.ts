import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobPostingApi } from '@/lib/job-posting';
import { queryKeys } from '@/lib/query-keys';
import type { CreateJobPostingRequest } from '@/types/job-posting';

// Get all job postings
export function useJobPostings() {
  return useQuery({
    queryKey: queryKeys.jobPostings.all,
    queryFn: jobPostingApi.getAll,
  });
}

// Get job posting by ID
export function useJobPosting(postingId: number) {
  return useQuery({
    queryKey: queryKeys.jobPostings.detail(postingId),
    queryFn: () => jobPostingApi.getById(postingId),
    enabled: !!postingId,
  });
}

// Create job posting
export function useCreateJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobPostingRequest) => jobPostingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobPostings.all });
    },
  });
}

// Update job posting
export function useUpdateJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postingId, data }: { postingId: number; data: Partial<CreateJobPostingRequest> }) =>
      jobPostingApi.update(postingId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobPostings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobPostings.detail(variables.postingId) });
    },
  });
}

// Delete job posting
export function useDeleteJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postingId: number) => jobPostingApi.delete(postingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobPostings.all });
    },
  });
}

// Get job posting memos
export function useJobPostingMemos(postingId: number) {
  return useQuery({
    queryKey: [...queryKeys.jobPostings.detail(postingId), 'memos'] as const,
    queryFn: () => jobPostingApi.getMemos(postingId),
    enabled: !!postingId,
  });
}

// Create job posting memo
export function useCreateJobPostingMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postingId, memoText }: { postingId: number; memoText: string }) =>
      jobPostingApi.createMemo(postingId, memoText),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.jobPostings.detail(variables.postingId), 'memos'] as const
      });
    },
  });
}
