import React, { forwardRef } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerClassName = '', ...props }, ref) => {
    return (
      <View className={`mb-4 ${containerClassName}`}>
        {label && (
          <Text className="text-sand-800 font-medium text-sm mb-1.5">{label}</Text>
        )}
        <TextInput
          ref={ref}
          className={`bg-white border rounded-xl px-4 py-3 text-base text-sand-900 ${
            error ? 'border-red-500' : 'border-sand-300'
          }`}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {error && (
          <Text className="text-red-500 text-xs mt-1">{error}</Text>
        )}
      </View>
    );
  }
);
