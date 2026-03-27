import type { Item, ItemStatus, ItemWithOptions } from '../types';
import { supabase } from './supabase';

export async function getItems(roomId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Item[];
}

export async function getItemsByProject(projectId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Item[];
}

export async function getItem(itemId: string): Promise<ItemWithOptions> {
  const { data, error } = await supabase
    .from('items')
    .select('*, item_options(*, item_option_photos(*))')
    .eq('id', itemId)
    .single();

  if (error) throw error;
  return data as ItemWithOptions;
}

export async function createItem(
  item: Omit<Item, 'id' | 'updated_at' | 'created_at'>
): Promise<Item> {
  const { data, error } = await supabase.from('items').insert(item).select().single();

  if (error) throw error;
  return data as Item;
}

export async function updateItem(itemId: string, updates: Partial<Item>): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as Item;
}

export async function updateItemStatus(
  itemId: string,
  status: ItemStatus,
  userId: string
): Promise<Item> {
  return updateItem(itemId, { status, updated_by: userId });
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', itemId);
  if (error) throw error;
}
