import type { Room } from '../types';
import { supabase } from './supabase';
import { RoomSchema, validate } from './schemas';

export async function getRooms(projectId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return validate(RoomSchema.array(), data ?? [], 'rooms');
}

export async function createRoom(room: Omit<Room, 'id' | 'created_at'>): Promise<Room> {
  const { data, error } = await supabase.from('rooms').insert(room).select().single();

  if (error) throw error;
  return validate(RoomSchema, data, 'createRoom');
}

export async function updateRoom(
  roomId: string,
  updates: Partial<Pick<Room, 'name' | 'icon' | 'color' | 'sort_order'>>
): Promise<Room> {
  const { data, error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('id', roomId)
    .select()
    .single();

  if (error) throw error;
  return validate(RoomSchema, data, 'updateRoom');
}

export async function deleteRoom(roomId: string): Promise<void> {
  const { error } = await supabase.from('rooms').delete().eq('id', roomId);
  if (error) throw error;
}
