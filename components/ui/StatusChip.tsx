import React from 'react';
import { Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { ItemStatus } from '../../types';

const statusConfig: Record<ItemStatus, { bg: string; text: string; label: string }> = {
  researching: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-700 dark:text-blue-200',
    label: 'Pesquisando',
  },
  decided: {
    bg: 'bg-amber-100 dark:bg-amber-900',
    text: 'text-amber-700 dark:text-amber-200',
    label: 'Decidido',
  },
  purchased: {
    bg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-700 dark:text-purple-200',
    label: 'Comprado',
  },
  installed: {
    bg: 'bg-emerald-100 dark:bg-emerald-900',
    text: 'text-emerald-700 dark:text-emerald-200',
    label: 'Instalado',
  },
};

interface StatusChipProps {
  status: ItemStatus;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const config = statusConfig[status];
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    // key={status} + FadeIn: reanima suavemente quando o status muda.
    <Animated.View
      key={status}
      entering={FadeIn.duration(220)}
      className={`${config.bg} ${sizeStyles} rounded-full self-start`}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}`}
    >
      <Text className={`${config.text} ${textSize} font-medium`}>{config.label}</Text>
    </Animated.View>
  );
}
