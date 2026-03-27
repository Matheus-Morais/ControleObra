import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  editable?: boolean;
  onRate?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 20,
  editable = false,
  onRate,
}: StarRatingProps) {
  return (
    <View className="flex-row gap-1">
      {Array.from({ length: maxStars }, (_, i) => {
        const starNumber = i + 1;
        const filled = starNumber <= rating;

        const star = (
          <Feather
            key={i}
            name={filled ? 'star' : 'star'}
            size={size}
            color={filled ? '#F59E0B' : '#D1D5DB'}
          />
        );

        if (editable && onRate) {
          return (
            <TouchableOpacity key={i} onPress={() => onRate(starNumber)}>
              {star}
            </TouchableOpacity>
          );
        }

        return star;
      })}
    </View>
  );
}
