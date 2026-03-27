import React from 'react';
import { View, Text } from 'react-native';

interface ProgressBarProps {
  progress: number;
  color?: string;
  barColor?: string;
  showLabel?: boolean;
  height?: number;
  className?: string;
}

export function ProgressBar({
  progress,
  color = 'bg-terracotta-500',
  barColor,
  showLabel = true,
  height = 6,
  className = '',
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View className={`${className}`}>
      {showLabel && (
        <Text className="text-sand-600 text-xs mb-1">{Math.round(clampedProgress)}%</Text>
      )}
      <View className="bg-sand-100 rounded-full overflow-hidden" style={{ height }}>
        <View
          className={`${barColor ? '' : color} rounded-full h-full`}
          style={{
            width: `${clampedProgress}%`,
            ...(barColor ? { backgroundColor: barColor } : {}),
          }}
        />
      </View>
    </View>
  );
}
