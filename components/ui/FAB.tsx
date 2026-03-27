import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  className?: string;
}

export function FAB({ onPress, icon = 'plus', className = '' }: FABProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`absolute bottom-6 right-6 w-14 h-14 rounded-full bg-terracotta-500 items-center justify-center shadow-lg ${className}`}
      style={{ zIndex: 10, elevation: 5 }}
    >
      <Feather name={icon} size={24} color="#fff" />
    </TouchableOpacity>
  );
}
