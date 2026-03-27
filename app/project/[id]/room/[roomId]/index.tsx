import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useItems, useCreateItem, useDeleteItem, useUpdateItemStatus } from '../../../../../hooks/useItems';
import { useRooms } from '../../../../../hooks/useRooms';
import { useProjectStore } from '../../../../../stores/projectStore';
import { useAuthStore } from '../../../../../stores/authStore';
import { Card, StatusChip, FAB, EmptyState, LoadingScreen, Button, Input } from '../../../../../components/ui';
import { DEFAULT_ROOMS } from '../../../../../constants/rooms';
import { formatCurrency } from '../../../../../utils/format';
import type { ItemStatus } from '../../../../../types';

const STATUS_FILTERS: { key: ItemStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'researching', label: 'Pesquisando' },
  { key: 'decided', label: 'Decidido' },
  { key: 'purchased', label: 'Comprado' },
  { key: 'installed', label: 'Instalado' },
];

export default function RoomItemsScreen() {
  const { id: projectId, roomId } = useLocalSearchParams<{ id: string; roomId: string }>();
  const router = useRouter();
  const activeProject = useProjectStore((s) => s.activeProject);
  const user = useAuthStore((s) => s.user);
  const { data: rooms } = useRooms(activeProject?.id);
  const { data: items, isLoading } = useItems(roomId);
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();

  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  const room = rooms?.find((r) => r.id === roomId);
  const defaultRoom = DEFAULT_ROOMS.find((dr) => dr.name === room?.name);
  const categories = defaultRoom?.categories ?? [];

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (statusFilter === 'all') return items;
    return items.filter((i) => i.status === statusFilter);
  }, [items, statusFilter]);

  const handleAddItem = useCallback(async () => {
    if (!newItemName.trim() || !projectId || !roomId) return;
    try {
      await createItem.mutateAsync({
        room_id: roomId,
        project_id: projectId,
        category: newItemCategory || 'Geral',
        name: newItemName.trim(),
        status: 'researching',
        quantity: 1,
        budget: 0,
        actual_price: null,
        notes: null,
        updated_by: user?.id ?? null,
      });
      setNewItemName('');
      setNewItemCategory('');
      setShowAddForm(false);
    } catch (error: any) {
      Alert.alert('Erro', error.message ?? 'Erro ao adicionar item');
    }
  }, [newItemName, newItemCategory, projectId, roomId, user]);

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      Alert.alert('Remover item', 'Tem certeza?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () =>
            deleteItem.mutate({ itemId, roomId: roomId!, projectId: projectId! }),
        },
      ]);
    },
    [roomId, projectId]
  );

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen
        options={{
          headerShown: true,
          title: room?.name ?? 'Itens',
          headerStyle: { backgroundColor: '#FAFAF8' },
          headerTintColor: '#33291E',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8 }}>
              <Feather name="arrow-left" size={24} color="#33291E" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Status filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3">
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              className={`px-4 py-2 rounded-full mr-2 ${
                statusFilter === f.key ? 'bg-terracotta-500' : 'bg-white border border-sand-200'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  statusFilter === f.key ? 'text-white' : 'text-sand-600'
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Add form */}
        {showAddForm && (
          <View className="px-4 mb-4">
            <Card>
              <Text className="text-sand-900 font-semibold mb-3">Novo Item</Text>
              <Input
                label="Nome do item"
                placeholder="Ex: Chuveiro, Piso, Geladeira"
                value={newItemName}
                onChangeText={setNewItemName}
              />
              {categories.length > 0 && (
                <View className="mb-3">
                  <Text className="text-sand-800 font-medium text-sm mb-2">Categoria</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setNewItemCategory(cat)}
                        className={`px-3 py-1.5 rounded-full mr-2 ${
                          newItemCategory === cat
                            ? 'bg-moss-500'
                            : 'bg-sand-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            newItemCategory === cat ? 'text-white' : 'text-sand-700'
                          }`}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              <View className="flex-row gap-3">
                <Button
                  title="Cancelar"
                  onPress={() => setShowAddForm(false)}
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                />
                <Button
                  title="Adicionar"
                  onPress={handleAddItem}
                  size="sm"
                  loading={createItem.isPending}
                  className="flex-1"
                />
              </View>
            </Card>
          </View>
        )}

        {/* Items list */}
        {isLoading ? (
          <LoadingScreen />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon="package"
            title="Nenhum item"
            description="Adicione itens para este cômodo"
            actionLabel="Adicionar Item"
            onAction={() => setShowAddForm(true)}
          />
        ) : (
          <View className="px-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                onPress={() =>
                  router.push(`/project/${projectId}/room/${roomId}/item/${item.id}`)
                }
                className="mb-3"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-sand-900 font-semibold text-base">
                      {item.name}
                    </Text>
                    <Text className="text-sand-500 text-xs mt-0.5">
                      {item.category}
                    </Text>
                    {item.budget > 0 && (
                      <Text className="text-sand-600 text-sm mt-1">
                        {formatCurrency(item.budget)}
                      </Text>
                    )}
                  </View>
                  <View className="items-end">
                    <StatusChip status={item.status} size="sm" />
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id)}
                      className="mt-2 p-1"
                    >
                      <Feather name="trash-2" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {!showAddForm && (
        <FAB onPress={() => setShowAddForm(true)} />
      )}
    </View>
  );
}
