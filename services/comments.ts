import type { ItemComment, Profile } from '../types';
import { supabase } from './supabase';

export type ItemCommentWithProfile = ItemComment & { profiles: Profile | null };

export async function getComments(itemId: string): Promise<ItemCommentWithProfile[]> {
  const { data, error } = await supabase
    .from('item_comments')
    .select('*, profiles(*)')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ItemCommentWithProfile[];
}

export async function createComment(
  itemId: string,
  userId: string,
  message: string
): Promise<ItemComment> {
  const { data, error } = await supabase
    .from('item_comments')
    .insert({ item_id: itemId, user_id: userId, message })
    .select()
    .single();

  if (error) throw error;
  return data as ItemComment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('item_comments').delete().eq('id', commentId);
  if (error) throw error;
}
