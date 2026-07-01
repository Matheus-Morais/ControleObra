import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Card, StarRating } from '../ui';
import { PhotoGallery } from './PhotoGallery';
import { formatCurrency } from '../../utils/format';
import type { ItemOptionWithPhotos } from '../../services/itemOptions';

interface OptionCardProps {
  option: ItemOptionWithPhotos;
  uploadingPhoto: boolean;
  onChoose: (optionId: string) => void;
  onDelete: (optionId: string) => void;
  onUploadPhoto: (optionId: string) => void;
  onShare: (option: ItemOptionWithPhotos) => void;
}

/** Card de uma opção de produto (preço, avaliação, fotos e ações). */
export function OptionCard({
  option,
  uploadingPhoto,
  onChoose,
  onDelete,
  onUploadPhoto,
  onShare,
}: OptionCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(250)}>
    <Card className="mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center">
            {option.is_chosen && (
              <View className="bg-moss-100 dark:bg-moss-900 px-2 py-0.5 rounded-full mr-2">
                <Text className="text-moss-700 dark:text-moss-200 text-xs font-medium">Escolhido</Text>
              </View>
            )}
            <Text className="text-sand-900 dark:text-sand-50 font-semibold text-base flex-shrink">
              {option.model_name}
            </Text>
          </View>
          {option.brand && (
            <Text className="text-sand-500 dark:text-sand-400 text-sm mt-0.5">{option.brand}</Text>
          )}
        </View>
        {option.price !== null && option.price !== undefined && (
          <Text className="text-terracotta-500 font-bold text-lg">
            {formatCurrency(Number(option.price))}
          </Text>
        )}
      </View>

      {option.store && (
        <View className="flex-row items-center mt-2">
          <Feather name="shopping-bag" size={14} color="#A89270" />
          <Text className="text-sand-600 dark:text-sand-300 text-sm ml-1">{option.store}</Text>
        </View>
      )}

      {option.rating !== null && option.rating !== undefined && (
        <View className="mt-2">
          <StarRating rating={option.rating} size={16} />
        </View>
      )}

      {option.notes && (
        <Text className="text-sand-500 dark:text-sand-400 text-sm mt-2">{option.notes}</Text>
      )}

      <PhotoGallery photos={option.item_option_photos} />

      {/* Action buttons */}
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-sand-100 dark:border-sand-700">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => onUploadPhoto(option.id)}
            className="flex-row items-center"
            disabled={uploadingPhoto}
            accessibilityRole="button"
            accessibilityLabel={`Adicionar foto à opção ${option.model_name}`}
          >
            <Feather name="camera" size={16} color="#A89270" />
            <Text className="text-sand-600 dark:text-sand-300 text-xs ml-1">Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onShare(option)}
            className="flex-row items-center"
            accessibilityRole="button"
            accessibilityLabel={`Compartilhar opção ${option.model_name}`}
          >
            <Feather name="share" size={16} color="#A89270" />
            <Text className="text-sand-600 dark:text-sand-300 text-xs ml-1">Enviar</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row gap-3">
          {!option.is_chosen && (
            <TouchableOpacity
              onPress={() => onChoose(option.id)}
              className="flex-row items-center bg-moss-50 dark:bg-moss-900 px-3 py-1.5 rounded-full"
              accessibilityRole="button"
              accessibilityLabel={`Escolher opção ${option.model_name}`}
            >
              <Feather name="check" size={14} color="#5B7553" />
              <Text className="text-moss-600 dark:text-moss-200 text-xs font-medium ml-1">Escolher</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onDelete(option.id)}
            accessibilityRole="button"
            accessibilityLabel={`Remover opção ${option.model_name}`}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
    </Animated.View>
  );
}
