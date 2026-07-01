import type { ItemComment, Profile } from '../types';
import { supabase } from './supabase';
import { ItemCommentSchema, ProfileSchema, validate } from './schemas';

export type ItemCommentWithProfile = ItemComment & { profiles: Profile | null };

export async function getComments(itemId: string): Promise<ItemCommentWithProfile[]> {
  const { data: comments, error } = await supabase
    .from('item_comments')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const baseComments = validate(ItemCommentSchema.array(), comments ?? [], 'comments');
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

  const parsedProfiles = validate(ProfileSchema.array(), profiles ?? [], 'comment-profiles');
  const profileById = new Map<string, Profile>(parsedProfiles.map((p) => [p.id, p]));
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
  return validate(ItemCommentSchema, data, 'createComment');
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('item_comments').delete().eq('id', commentId);
  if (error) throw error;
}
