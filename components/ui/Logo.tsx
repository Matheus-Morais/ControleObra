import React from 'react';
import { Image, Text, View } from 'react-native';

const iconSizes = {
  sm: 40,
  md: 64,
  lg: 88,
};

const textSizes = {
  sm: 'text-lg font-bold',
  md: 'text-2xl font-bold',
  lg: 'text-3xl font-bold',
};

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  subtitle?: string;
}

export function Logo({ size = 'md', showText = true, subtitle }: LogoProps) {
  const iconSize = iconSizes[size];

  return (
    <View className="items-center">
      <Image
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        source={require('../../assets/icon.png')}
        style={{ width: iconSize, height: iconSize, borderRadius: iconSize * 0.2 }}
        resizeMode="contain"
      />
      {showText && (
        <Text
          className={`${textSizes[size]} text-sand-900 dark:text-sand-50 mt-3`}
        >
          ControleObra
        </Text>
      )}
      {subtitle && (
        <Text className="text-sand-500 dark:text-sand-400 text-base mt-1 text-center">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
