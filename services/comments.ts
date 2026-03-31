import type { ItemComment, Profile } from '../types';
import { supabase } from './supabase';

export type ItemCommentWithProfile = ItemComment & { profiles: Profile | null };

export async function getComments(itemId: string): Promise<ItemCommentWithProfile[]> {
  const { data: comments, error } = await supabase
    .from('item_comments')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const baseComments = (comments ?? []) as ItemComment[];
  if (baseComments.length === 0) return [];

  const userIds = [...new Set(baseComments.map((c) => c.user_id).filter(Boolean))];
  if (userIds.length === 0) {
    return baseComments.map((c) => ({ ...c, profiles: null }));
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  // Evita quebrar comentários quando o join de perfis falhar por RLS/relacionamento.
  if (profilesError) {
    return baseComments.map((c) => ({ ...c, profiles: null }));
  }

  const profileById = new Map<string, Profile>((profiles ?? []).map((p) => [p.id, p as Profile]));
  return baseComments.map((c) => ({
    ...c,
    profiles: profileById.get(c.user_id) ?? null,
  }));
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
