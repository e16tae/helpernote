import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/lib/customer';
import { queryKeys } from '@/lib/query-keys';
import type { CreateCustomerRequest, UpdateCustomerRequest } from '@/types/customer';

// Get all customers
export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers.all,
    queryFn: customerApi.getAll,
  });
}

// Get customer by ID
export function useCustomer(customerId: number) {
  return useQuery({
    queryKey: queryKeys.customers.detail(customerId),
    queryFn: () => customerApi.getById(customerId),
    enabled: !!customerId,
  });
}

// Create customer
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

// Update customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, data }: { customerId: number; data: UpdateCustomerRequest }) =>
      customerApi.update(customerId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.customerId) });
    },
  });
}

// Delete customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: number) => customerApi.delete(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

// Get customer memos
export function useCustomerMemos(customerId: number) {
  return useQuery({
    queryKey: [...queryKeys.customers.detail(customerId), 'memos'] as const,
    queryFn: () => customerApi.getMemos(customerId),
    enabled: !!customerId,
  });
}

// Create customer memo
export function useCreateCustomerMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, memoText }: { customerId: number; memoText: string }) =>
      customerApi.createMemo(customerId, memoText),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.customers.detail(variables.customerId), 'memos'] as const
      });
    },
  });
}

// Get customer files
export function useCustomerFiles(customerId: number) {
  return useQuery({
    queryKey: [...queryKeys.customers.detail(customerId), 'files'] as const,
    queryFn: () => customerApi.getFiles(customerId),
    enabled: !!customerId,
  });
}

// Upload customer file
export function useUploadCustomerFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, file, isProfile = false }: { customerId: number; file: File; isProfile?: boolean }) =>
      customerApi.uploadFile(customerId, file, isProfile),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.customers.detail(variables.customerId), 'files'] as const
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.customerId) });
    },
  });
}
