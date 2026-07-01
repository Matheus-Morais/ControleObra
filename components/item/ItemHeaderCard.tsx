import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card, StatusChip } from '../ui';
import { formatDateTime } from '../../utils/format';
import type { ItemStatus, ItemWithOptions } from '../../types';

export const STATUSES: { key: ItemStatus; label: string; color: string }[] = [
  { key: 'researching', label: 'Pesquisando', color: '#3B82F6' },
  { key: 'decided', label: 'Decidido', color: '#F59E0B' },
  { key: 'purchased', label: 'Comprado', color: '#8B5CF6' },
  { key: 'installed', label: 'Instalado', color: '#10B981' },
];

interface ItemHeaderCardProps {
  item: ItemWithOptions;
  onEditCategory: () => void;
  onStatusChange: (status: ItemStatus) => void;
}

/** Cabeçalho do item: categoria, nome, metadados e seletor de status. */
export function ItemHeaderCard({ item, onEditCategory, onStatusChange }: ItemHeaderCardProps) {
  return (
    <View className="px-4 pt-4">
      <Card>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text className="text-sand-500 dark:text-sand-400 text-sm mr-2">{item.category}</Text>
            <TouchableOpacity
              onPress={onEditCategory}
              accessibilityRole="button"
              accessibilityLabel="Editar categoria do item"
            >
              <Feather name="edit-2" size={14} color="#A89270" />
            </TouchableOpacity>
          </View>
          <StatusChip status={item.status} />
        </View>
        <Text className="text-sand-900 dark:text-sand-50 text-xl font-bold">{item.name}</Text>
        <Text className="text-sand-500 dark:text-sand-400 text-xs mt-1">
          Qtd: {item.quantity} · Atualizado em {formatDateTime(item.updated_at)}
        </Text>

        <View className="flex-row flex-wrap gap-2 mt-4">
          {STATUSES.map((s) => {
            const active = item.status === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => onStatusChange(s.key)}
                className={`px-3 py-1.5 rounded-full border ${
                  active ? 'border-transparent' : 'border-sand-200 dark:border-sand-600 bg-white dark:bg-sand-800'
                }`}
                style={active ? { backgroundColor: s.color + '20', borderColor: s.color } : undefined}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Marcar status como ${s.label}`}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: active ? s.color : '#6B7280' }}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>
    </View>
  );
}
