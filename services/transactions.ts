import type { Transaction } from '../types';
import { supabase } from './supabase';
import { AmountRowSchema, TransactionSchema, validate } from './schemas';

export async function getTransactions(projectId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('project_id', projectId)
    .order('paid_at', { ascending: false });

  if (error) throw error;
  return validate(TransactionSchema.array(), data ?? [], 'transactions');
}

export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'created_at'>
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) throw error;
  return validate(TransactionSchema, data, 'createTransaction');
}

export async function updateTransaction(
  transactionId: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return validate(TransactionSchema, data, 'updateTransaction');
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', transactionId);
  if (error) throw error;
}

export async function getProjectTotalSpent(projectId: string): Promise<number> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('project_id', projectId);

  if (error) throw error;
  const rows = validate(AmountRowSchema.array(), data ?? [], 'total-spent');
  return rows.reduce((sum, t) => sum + t.amount, 0);
}
