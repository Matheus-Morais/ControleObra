import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

function imageContentType(ext: string): string {
  const e = ext.toLowerCase();
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  if (e === 'png') return 'image/png';
  if (e === 'gif') return 'image/gif';
  if (e === 'webp') return 'image/webp';
  if (e === 'heic' || e === 'heif') return 'image/heic';
  return 'image/jpeg';
}

export async function pickImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function uploadPhoto(uri: string, userId: string): Promise<string> {
  const ext = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();
  const arrayBuffer = await new Response(blob).arrayBuffer();

  const { error } = await supabase.storage
    .from('item-photos')
    .upload(fileName, arrayBuffer, {
      contentType: imageContentType(ext),
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from('item-photos').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deletePhoto(url: string): Promise<void> {
  const path = url.split('/item-photos/')[1];
  if (!path) return;

  const { error } = await supabase.storage.from('item-photos').remove([path]);
  if (error) throw error;
}
