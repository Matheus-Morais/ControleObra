import React, { forwardRef, useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  /** Mostra um botão de olho para alternar a visibilidade da senha. */
  passwordToggle?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerClassName = '', passwordToggle = false, secureTextEntry, ...props }, ref) => {
    const { colors } = useTheme();
    const [hidden, setHidden] = useState(true);
    const secure = passwordToggle ? hidden : secureTextEntry;

    return (
      <View className={`mb-4 ${containerClassName}`}>
        {label && (
          <Text className="text-sand-800 dark:text-sand-200 font-medium text-sm mb-1.5">{label}</Text>
        )}
        <View className="justify-center">
          <TextInput
            ref={ref}
            secureTextEntry={secure}
            className={`bg-white dark:bg-sand-800 border rounded-xl px-4 py-3 ${passwordToggle ? 'pr-12' : ''} text-base text-sand-900 dark:text-sand-50 ${
              error ? 'border-red-500' : 'border-sand-300 dark:border-sand-600'
            }`}
            placeholderTextColor={colors.placeholder}
            {...props}
          />
          {passwordToggle && (
            <TouchableOpacity
              onPress={() => setHidden((h) => !h)}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}
            >
              <Feather name={hidden ? 'eye' : 'eye-off'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {error && (
          <Text className="text-red-500 text-xs mt-1">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
