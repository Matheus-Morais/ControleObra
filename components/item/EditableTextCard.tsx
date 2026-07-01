import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card, Button } from '../ui';
import { useTheme } from '../../hooks/useTheme';

interface EditableTextCardProps {
  title: string;
  editing: boolean;
  onStartEdit: () => void;
  value: string;
  onChangeValue: (value: string) => void;
  onSave: () => void;
  /** Conteúdo mostrado quando não está em edição. */
  displayContent: React.ReactNode;
  multiline?: boolean;
  keyboardType?: 'numeric' | 'default';
  placeholder?: string;
}

/**
 * Card com um campo editável inline (usado para Orçamento e Notas do item).
 * Alterna entre exibição e um TextInput com botão Salvar.
 */
export function EditableTextCard({
  title,
  editing,
  onStartEdit,
  value,
  onChangeValue,
  onSave,
  displayContent,
  multiline = false,
  keyboardType = 'default',
  placeholder,
}: EditableTextCardProps) {
  const { colors } = useTheme();
  return (
    <View className="px-4 mt-4">
      <Card>
        <View className={`flex-row items-center justify-between ${multiline ? 'mb-2' : ''}`}>
          <Text className="text-sand-700 dark:text-sand-200 font-semibold">{title}</Text>
          <TouchableOpacity
            onPress={onStartEdit}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${title.toLowerCase()}`}
          >
            <Feather name="edit-2" size={16} color="#A89270" />
          </TouchableOpacity>
        </View>
        {editing ? (
          <View className={multiline ? undefined : 'flex-row items-center mt-2 gap-2'}>
            <TextInput
              style={{
                flex: multiline ? undefined : 1,
                borderWidth: 1,
                borderColor: colors.inputBorder,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 16,
                color: colors.textPrimary,
                backgroundColor: colors.inputBg,
                ...(multiline ? { minHeight: 80, textAlignVertical: 'top' as const } : {}),
              }}
              value={value}
              onChangeText={onChangeValue}
              keyboardType={keyboardType}
              multiline={multiline}
              placeholder={placeholder}
              placeholderTextColor={colors.placeholder}
            />
            <Button
              title="Salvar"
              onPress={onSave}
              size="sm"
              className={multiline ? 'mt-2' : undefined}
            />
          </View>
        ) : (
          displayContent
        )}
      </Card>
    </View>
  );
}
