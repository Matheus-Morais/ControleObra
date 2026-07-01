import React from 'react';
import { View, TouchableOpacity, ViewProps, TouchableOpacityProps } from 'react-native';

interface CardProps extends ViewProps {
  onPress?: () => void;
  onLongPress?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function Card({ onPress, onLongPress, className = '', children, ...props }: CardProps) {
  const baseStyle =
    'bg-white dark:bg-sand-800 rounded-2xl p-4 shadow-sm border border-sand-100 dark:border-sand-700';

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        className={`${baseStyle} ${className}`}
        accessibilityRole="button"
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={`${baseStyle} ${className}`} {...props}>
      {children}
    </View>
  );
}
