import React from 'react';
import { ScrollView, Image } from 'react-native';
import type { ItemOptionPhoto } from '../../types';

/** Galeria horizontal de fotos de uma opção de produto. */
export function PhotoGallery({ photos }: { photos: ItemOptionPhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
      {photos.map((photo) => (
        <Image
          key={photo.id}
          source={{ uri: photo.storage_url }}
          className="w-20 h-20 rounded-lg mr-2"
          resizeMode="cover"
        />
      ))}
    </ScrollView>
  );
}
