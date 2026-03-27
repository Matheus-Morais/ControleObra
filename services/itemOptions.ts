import type { ItemOption, ItemOptionPhoto } from '../types';
import { supabase } from './supabase';

export type ItemOptionWithPhotos = ItemOption & {
  item_option_photos: ItemOptionPhoto[];
};

export async function getItemOptions(itemId: string): Promise<ItemOptionWithPhotos[]> {
  const { data, error } = await supabase
    .from('item_options')
    .select('*, item_option_photos(*)')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ItemOptionWithPhotos[];
}

export async function createItemOption(
  option: Omit<ItemOption, 'id' | 'created_at'>
): Promise<ItemOption> {
  const { data, error } = await supabase.from('item_options').insert(option).select().single();

  if (error) throw error;
  return data as ItemOption;
}

export async function updateItemOption(
  optionId: string,
  updates: Partial<ItemOption>
): Promise<ItemOption> {
  const { data, error } = await supabase
    .from('item_options')
    .update(updates)
    .eq('id', optionId)
    .select()
    .single();

  if (error) throw error;
  return data as ItemOption;
}

export async function chooseOption(itemId: string, optionId: string): Promise<ItemOption> {
  const { error: clearError } = await supabase
    .from('item_options')
    .update({ is_chosen: false })
    .eq('item_id', itemId);

  if (clearError) throw clearError;

  const { data, error } = await supabase
    .from('item_options')
    .update({ is_chosen: true })
    .eq('id', optionId)
    .select()
    .single();

  if (error) throw error;
  return data as ItemOption;
}

export async function deleteItemOption(optionId: string): Promise<void> {
  const { error } = await supabase.from('item_options').delete().eq('id', optionId);
  if (error) throw error;
}

export async function addOptionPhoto(
  optionId: string,
  storageUrl: string,
  sortOrder: number = 0
): Promise<ItemOptionPhoto> {
  const { data, error } = await supabase
    .from('item_option_photos')
    .insert({ item_option_id: optionId, storage_url: storageUrl, sort_order: sortOrder })
    .select()
    .single();

  if (error) throw error;
  return data as ItemOptionPhoto;
}

export async function deleteOptionPhoto(photoId: string): Promise<void> {
  const { error } = await supabase.from('item_option_photos').delete().eq('id', photoId);
  if (error) throw error;
}
