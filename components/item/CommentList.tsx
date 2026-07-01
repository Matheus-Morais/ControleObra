import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatDateTime } from '../../utils/format';
import { useTheme } from '../../hooks/useTheme';
import type { ItemCommentWithProfile } from '../../services/comments';

/** Lista de comentários de um item. */
export function CommentList({ comments }: { comments: ItemCommentWithProfile[] }) {
  return (
    <View className="px-4 mt-6">
      <Text className="text-sand-900 dark:text-sand-50 text-lg font-bold mb-3">
        Comentários ({comments.length})
      </Text>
      {comments.map((comment) => (
        <View
          key={comment.id}
          className="bg-white dark:bg-sand-800 rounded-xl p-3 mb-2 border border-sand-100 dark:border-sand-700"
        >
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sand-700 dark:text-sand-300 text-xs font-medium">
              {comment.profiles?.full_name ?? 'Usuário'}
            </Text>
            <Text className="text-sand-400 dark:text-sand-500 text-xs">
              {formatDateTime(comment.created_at)}
            </Text>
          </View>
          <Text className="text-sand-800 dark:text-sand-100 text-sm">{comment.message}</Text>
        </View>
      ))}
    </View>
  );
}

interface CommentComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  sending: boolean;
}

/** Barra fixa de escrita de comentário. */
export function CommentComposer({ value, onChangeText, onSend, sending }: CommentComposerProps) {
  const { colors } = useTheme();
  const disabled = sending || !value.trim();
  return (
    <View className="px-4 py-3 bg-white dark:bg-sand-800 border-t border-sand-100 dark:border-sand-700">
      <View className="flex-row items-center gap-2">
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.inputBorder,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 16,
            color: colors.textPrimary,
            backgroundColor: colors.inputBg,
          }}
          placeholder="Escreva um comentário..."
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.placeholder}
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={disabled}
          className="bg-terracotta-500 w-10 h-10 rounded-full items-center justify-center"
          style={{ opacity: disabled ? 0.5 : 1 }}
          accessibilityRole="button"
          accessibilityLabel="Enviar comentário"
        >
          <Feather name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
