import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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
  const rawExt = uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? '';
  const contentType = ALLOWED_IMAGE_TYPES[rawExt];
  if (!contentType) throw new Error('Tipo de arquivo não permitido. Use JPG, PNG, GIF, WEBP ou HEIC.');

  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  if (blob.size > MAX_FILE_SIZE) throw new Error('Arquivo muito grande. Máximo: 10 MB.');
  if (!blob.type.startsWith('image/') && blob.type !== '') throw new Error('Arquivo não é uma imagem válida.');

  const arrayBuffer = await new Response(blob).arrayBuffer();

  const { error } = await supabase.storage
    .from('item-photos')
    .upload(fileName, arrayBuffer, {
      contentType,
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
