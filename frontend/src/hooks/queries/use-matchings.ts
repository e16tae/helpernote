import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingApi } from '@/lib/matching';
import { queryKeys } from '@/lib/query-keys';
import type { CreateMatchingRequest, UpdateMatchingRequest } from '@/types/matching';

// Get all matchings
export function useMatchings() {
  return useQuery({
    queryKey: queryKeys.matchings.all,
    queryFn: matchingApi.getAll,
  });
}

// Get matching by ID
export function useMatching(matchingId: number) {
  return useQuery({
    queryKey: queryKeys.matchings.detail(matchingId),
    queryFn: () => matchingApi.getById(matchingId),
    enabled: !!matchingId,
  });
}

// Create matching
export function useCreateMatching() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMatchingRequest) => matchingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matchings.all });
    },
  });
}

// Update matching
export function useUpdateMatching() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchingId, data }: { matchingId: number; data: UpdateMatchingRequest }) =>
      matchingApi.update(matchingId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matchings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.matchings.detail(variables.matchingId) });
    },
  });
}

// Delete matching
export function useDeleteMatching() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchingId: number) => matchingApi.delete(matchingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matchings.all });
    },
  });
}

// Get matching memos
export function useMatchingMemos(matchingId: number) {
  return useQuery({
    queryKey: [...queryKeys.matchings.detail(matchingId), 'memos'] as const,
    queryFn: () => matchingApi.getMemos(matchingId),
    enabled: !!matchingId,
  });
}

// Create matching memo
export function useCreateMatchingMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchingId, memoText }: { matchingId: number; memoText: string }) =>
      matchingApi.createMemo(matchingId, memoText),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.matchings.detail(variables.matchingId), 'memos'] as const
      });
    },
  });
}

// Get settlement memos (currently not implemented in API)
// export function useSettlementMemos(matchingId: number) {
//   return useQuery({
//     queryKey: [...queryKeys.matchings.detail(matchingId), 'settlement-memos'] as const,
//     queryFn: () => matchingApi.getSettlementMemos(matchingId),
//     enabled: !!matchingId,
//   });
// }

// Create settlement memo (currently not implemented in API)
// export function useCreateSettlementMemo() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({
//       matchingId,
//       settlementType,
//       settlementAmount,
//       memoText
//     }: {
//       matchingId: number;
//       settlementType: 'employer' | 'employee';
//       settlementAmount: number;
//       memoText: string;
//     }) =>
//       matchingApi.createSettlementMemo(matchingId, settlementType, settlementAmount, memoText),
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: [...queryKeys.matchings.detail(variables.matchingId), 'settlement-memos'] as const
//       });
//       // Also invalidate the matching detail to update settlement status
//       queryClient.invalidateQueries({ queryKey: queryKeys.matchings.detail(variables.matchingId) });
//     },
//   });
// }
