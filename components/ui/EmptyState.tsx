import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <View className="bg-sand-100 rounded-full p-6 mb-4">
        <Feather name={icon} size={40} color="#A89270" />
      </View>
      <Text className="text-sand-800 text-lg font-semibold text-center mb-2">{title}</Text>
      {description && (
        <Text className="text-sand-500 text-sm text-center mb-6">{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} size="sm" />
      )}
    </View>
  );
}
