import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobSeekingApi } from '@/lib/job-posting';
import { queryKeys } from '@/lib/query-keys';
import type { CreateJobSeekingRequest } from '@/types/job-posting';

// Get all job seeking postings
export function useJobSeekings() {
  return useQuery({
    queryKey: queryKeys.jobSeekings.all,
    queryFn: jobSeekingApi.getAll,
  });
}

// Get job seeking posting by ID
export function useJobSeeking(seekingId: number) {
  return useQuery({
    queryKey: queryKeys.jobSeekings.detail(seekingId),
    queryFn: () => jobSeekingApi.getById(seekingId),
    enabled: !!seekingId,
  });
}

// Create job seeking posting
export function useCreateJobSeeking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobSeekingRequest) => jobSeekingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobSeekings.all });
    },
  });
}

// Update job seeking posting
export function useUpdateJobSeeking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seekingId, data }: { seekingId: number; data: Partial<CreateJobSeekingRequest> }) =>
      jobSeekingApi.update(seekingId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobSeekings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobSeekings.detail(variables.seekingId) });
    },
  });
}

// Delete job seeking posting
export function useDeleteJobSeeking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (seekingId: number) => jobSeekingApi.delete(seekingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobSeekings.all });
    },
  });
}

// Get job seeking memos
export function useJobSeekingMemos(seekingId: number) {
  return useQuery({
    queryKey: [...queryKeys.jobSeekings.detail(seekingId), 'memos'] as const,
    queryFn: () => jobSeekingApi.getMemos(seekingId),
    enabled: !!seekingId,
  });
}

// Create job seeking memo
export function useCreateJobSeekingMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seekingId, memoText }: { seekingId: number; memoText: string }) =>
      jobSeekingApi.createMemo(seekingId, memoText),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.jobSeekings.detail(variables.seekingId), 'memos'] as const
      });
    },
  });
}
