import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useItems, useCreateItem, useDeleteItem, useUpdateItemStatus, useProjectItems } from '../../../../../hooks/useItems';
import { useRooms } from '../../../../../hooks/useRooms';
import { useProjectStore } from '../../../../../stores/projectStore';
import { useAuthStore } from '../../../../../stores/authStore';
import { Card, StatusChip, FAB, EmptyState, LoadingScreen, Button, Input } from '../../../../../components/ui';
import { DEFAULT_ROOMS } from '../../../../../constants/rooms';
import { formatCurrency } from '../../../../../utils/format';
import { showAlert } from '../../../../../utils/alert';
import type { ItemStatus } from '../../../../../types';

const STATUS_FILTERS: { key: ItemStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'researching', label: 'Pesquisando' },
  { key: 'decided', label: 'Decidido' },
  { key: 'purchased', label: 'Comprado' },
  { key: 'installed', label: 'Instalado' },
];

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function resolveRoomCategories(roomName: string | undefined): string[] {
  const fallback = ['Geral'];
  if (!roomName) return fallback;

  const normalized = normalizeLabel(roomName);
  const exact = DEFAULT_ROOMS.find((dr) => normalizeLabel(dr.name) === normalized);
  if (exact?.categories?.length) return exact.categories;

  const partial = DEFAULT_ROOMS.find((dr) => {
    const base = normalizeLabel(dr.name);
    return base.includes(normalized) || normalized.includes(base);
  });
  if (partial?.categories?.length) return partial.categories;

  return fallback;
}

export default function RoomItemsScreen() {
  const { id: projectId, roomId } = useLocalSearchParams<{ id: string; roomId: string }>();
  const router = useRouter();
  const activeProject = useProjectStore((s) => s.activeProject);
  const user = useAuthStore((s) => s.user);
  const { data: rooms } = useRooms(activeProject?.id);
  const { data: items, isLoading, isError, refetch } = useItems(roomId);
  const { data: projectItems } = useProjectItems(projectId);
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();

  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (!isLoading) { setLoadingTimeout(false); return; }
    const t = setTimeout(() => setLoadingTimeout(true), 15000);
    return () => clearTimeout(t);
  }, [isLoading]);

  const room = rooms?.find((r) => r.id === roomId);
  const categories = useMemo(() => resolveRoomCategories(room?.name), [room?.name]);
  const projectCategories = useMemo(
    () =>
      [...new Set((projectItems ?? []).map((i) => (i.category || '').trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [projectItems]
  );
  const availableCategories = useMemo(
    () => [...new Set([...categories, ...projectCategories, ...customCategories])],
    [categories, projectCategories, customCategories]
  );
  const filteredCategories = useMemo(() => {
    const term = normalizeLabel(categorySearch);
    if (!term) return availableCategories;
    return availableCategories.filter((cat) => normalizeLabel(cat).includes(term));
  }, [availableCategories, categorySearch]);

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
      showAlert('Erro', error.message ?? 'Erro ao adicionar item');
    }
  }, [newItemName, newItemCategory, projectId, roomId, user]);

  const openCategorySheet = useCallback(() => {
    setShowCategoryModal(true);
  }, []);

  const closeCategorySheet = useCallback(() => {
    setShowCategoryModal(false);
  }, []);

  const handleSelectCategory = useCallback(
    (category: string) => {
      setNewItemCategory(category);
      setCategorySearch('');
      closeCategorySheet();
    },
    [closeCategorySheet]
  );

  const handleAddCustomCategory = useCallback(() => {
    const value = newCategoryName.trim();
    if (!value) return;
    const exists = availableCategories.some((cat) => normalizeLabel(cat) === normalizeLabel(value));
    if (!exists) {
      setCustomCategories((prev) => [...prev, value]);
    }
    setNewCategoryName('');
    handleSelectCategory(value);
  }, [newCategoryName, availableCategories, handleSelectCategory]);

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      showAlert('Remover item', 'Tem certeza?', [
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
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8, marginLeft: 10, padding: 10 }}>
              <Feather name="arrow-left" size={24} color="#33291E" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Status filters - always visible */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setStatusFilter(f.key)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 8,
              backgroundColor: statusFilter === f.key ? '#B85C38' : '#FFFFFF',
              borderWidth: statusFilter === f.key ? 0 : 1,
              borderColor: '#EDE5D6',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: statusFilter === f.key ? '#FFFFFF' : '#8B7355',
              }}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && !loadingTimeout ? (
        <LoadingScreen />
      ) : isError || loadingTimeout ? (
        <View className="flex-1 items-center justify-center p-8">
          <Feather name="alert-circle" size={40} color="#EF4444" />
          <Text className="text-sand-800 text-lg font-semibold text-center mt-4 mb-2">
            {loadingTimeout ? 'Conexão lenta' : 'Erro ao carregar itens'}
          </Text>
          <Text className="text-sand-500 text-sm text-center mb-6">Verifique sua conexão e tente novamente</Text>
          <Button title="Tentar novamente" onPress={() => { setLoadingTimeout(false); refetch(); }} size="sm" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}>
          {filteredItems.length === 0 && !showAddForm ? (
            <View className="flex-1 items-center justify-center p-8">
              <View className="bg-sand-100 rounded-full p-6 mb-4">
                <Feather name="package" size={40} color="#A89270" />
              </View>
              <Text className="text-sand-800 text-lg font-semibold text-center mb-2">Nenhum item</Text>
              <Text className="text-sand-500 text-sm text-center mb-6">Adicione itens para este cômodo</Text>
              <Button title="Adicionar Item" onPress={() => setShowAddForm(true)} size="sm" />
            </View>
          ) : null}

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
                <View className="mb-3">
                  <Text className="text-sand-800 font-medium text-sm mb-2">Categoria</Text>
                  <TouchableOpacity
                    onPress={openCategorySheet}
                    style={{
                      borderWidth: 1,
                      borderColor: '#D6CDB9',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      backgroundColor: '#fff',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: newItemCategory ? '#33291E' : '#8B7355', fontSize: 14 }}>
                      {newItemCategory || 'Selecionar categoria'}
                    </Text>
                    <Feather name="chevron-down" size={16} color="#8B7355" />
                  </TouchableOpacity>
                </View>
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
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: '#F5F0E8',
                        borderColor: '#D6CDB9',
                        borderWidth: 1,
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        marginTop: 6,
                      }}
                    >
                      <Text style={{ color: '#6F5A3B', fontSize: 11, fontWeight: '600' }}>
                        Categoria: {item.category}
                      </Text>
                    </View>
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
        </ScrollView>
      )}

      {!showAddForm && filteredItems.length > 0 && (
        <FAB onPress={() => setShowAddForm(true)} />
      )}

      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={closeCategorySheet}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeCategorySheet} />
          <View
            style={{
              backgroundColor: '#FAFAF8',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 24,
              maxHeight: '85%',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: '#D6CDB9' }} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#33291E', marginBottom: 12 }}>
              Selecionar categoria
            </Text>

            <TextInput
              value={categorySearch}
              onChangeText={setCategorySearch}
              placeholder="Pesquisar categoria"
              placeholderTextColor="#9CA3AF"
              style={{
                borderWidth: 1,
                borderColor: '#D6CDB9',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 10,
                color: '#33291E',
                fontSize: 14,
                backgroundColor: '#fff',
              }}
            />

            <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ paddingBottom: 8 }}>
              {filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => handleSelectCategory(cat)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    marginBottom: 6,
                    backgroundColor: newItemCategory === cat ? '#DDE9D8' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: newItemCategory === cat ? '#5B7553' : '#EDE5D6',
                  }}
                >
                  <Text style={{ color: '#33291E', fontWeight: '500', fontSize: 14 }}>{cat}</Text>
                </TouchableOpacity>
              ))}
              {filteredCategories.length === 0 && (
                <Text style={{ color: '#8B7355', fontSize: 13, textAlign: 'center', marginVertical: 12 }}>
                  Nenhuma categoria encontrada.
                </Text>
              )}
            </ScrollView>

            <View style={{ marginTop: 8 }}>
              <Text style={{ color: '#33291E', fontWeight: '600', fontSize: 13, marginBottom: 6 }}>
                Adicionar categoria
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Nova categoria"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: '#D6CDB9',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: '#33291E',
                    fontSize: 14,
                    backgroundColor: '#fff',
                  }}
                />
                <TouchableOpacity
                  onPress={handleAddCustomCategory}
                  disabled={!newCategoryName.trim()}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: newCategoryName.trim() ? '#B85C38' : '#D6CDB9',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
