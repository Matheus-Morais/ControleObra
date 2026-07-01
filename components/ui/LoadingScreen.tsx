import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Carregando...' }: LoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-cream dark:bg-sand-900">
      <ActivityIndicator size="large" color="#C1694F" />
      <Text className="text-sand-600 dark:text-sand-300 mt-4 text-base">{message}</Text>
    </View>
  );
}
