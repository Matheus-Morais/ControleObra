import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getProjectTotalSpent,
} from '../services/transactions';
import type { Transaction } from '../types';

export function useTransactions(projectId: string | undefined) {
  return useQuery({
    queryKey: ['transactions', projectId],
    queryFn: () => getTransactions(projectId!),
    enabled: !!projectId,
  });
}

export function useProjectTotalSpent(projectId: string | undefined) {
  return useQuery({
    queryKey: ['total-spent', projectId],
    queryFn: () => getProjectTotalSpent(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transaction: Omit<Transaction, 'id' | 'created_at'>) =>
      createTransaction(transaction),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['total-spent', data.project_id] });
    },
  });
}

export function useDeleteTransaction(projectId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => deleteTransaction(transactionId),
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['transactions', projectId] });
        queryClient.invalidateQueries({ queryKey: ['total-spent', projectId] });
      }
    },
  });
}
