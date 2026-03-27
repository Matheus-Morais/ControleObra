import React from 'react';
import { View, Text } from 'react-native';
import type { ItemStatus } from '../../types';

const statusConfig: Record<ItemStatus, { bg: string; text: string; label: string }> = {
  researching: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pesquisando' },
  decided: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Decidido' },
  purchased: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Comprado' },
  installed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Instalado' },
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
    <View className={`${config.bg} ${sizeStyles} rounded-full self-start`}>
      <Text className={`${config.text} ${textSize} font-medium`}>{config.label}</Text>
    </View>
  );
}
