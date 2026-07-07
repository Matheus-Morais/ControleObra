import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { StatusConfig } from '../../constants/colors';
import type { ItemStatus } from '../../types';

interface StatusChipProps {
  status: ItemStatus;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const { isDark } = useTheme();
  const cfg = StatusConfig[status];

  const bg = isDark ? cfg.chipBgDark : cfg.chipBg;
  const color = isDark ? cfg.chipTextDark : cfg.chipText;
  const px = size === 'sm' ? 8 : 12;
  const py = size === 'sm' ? 2 : 4;
  const fontSize = size === 'sm' ? 12 : 14;

  return (
    <Animated.View
      key={status}
      entering={FadeIn.duration(220)}
      style={{ backgroundColor: bg, paddingHorizontal: px, paddingVertical: py, borderRadius: 999, alignSelf: 'flex-start' }}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${cfg.label}`}
    >
      <Text style={{ color, fontSize, fontWeight: '500' }}>{cfg.label}</Text>
    </Animated.View>
  );
}
