import React from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  className?: string;
  accessibilityLabel?: string;
}

export function FAB({ onPress, icon = 'plus', className = '', accessibilityLabel = 'Adicionar' }: FABProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.9, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 140 });
      }}
      className={`absolute bottom-6 right-6 w-14 h-14 rounded-full bg-terracotta-500 items-center justify-center shadow-lg ${className}`}
      style={[{ zIndex: 10, elevation: 5 }, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Feather name={icon} size={24} color="#fff" />
    </AnimatedPressable>
  );
}
