import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useProjectItems, useCreateItem } from '../../hooks/useItems';
import { useRooms } from '../../hooks/useRooms';
import { useLoadingTimeout } from '../../hooks/useLoadingTimeout';
import { Card, StatusChip, FAB, EmptyState, LoadingScreen, Button } from '../../components/ui';
import { formatCurrency } from '../../utils/format';
import { showAlert } from '../../utils/alert';
import type { ThemeColors } from '../../constants/theme';
import type { ItemStatus } from '../../types';

const STATUS_FILTERS: { key: ItemStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'researching', label: 'Pesquisando' },
  { key: 'decided', label: 'Decidido' },
  { key: 'purchased', label: 'Comprado' },
  { key: 'installed', label: 'Instalado' },
];

const PURCHASED_STATUSES: ItemStatus[] = ['purchased', 'installed'];

function inputStyle(colors: ThemeColors) {
  return {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.inputBg,
  } as const;
}

/**
 * Tela "Itens": visão global de todos os itens do projeto (independente de
 * cômodo), com cômodo, orçamento, status de compra e valor gasto. Permite
 * adicionar item escolhendo o cômodo. Filtro por etapa no topo.
 */
export default function ItemsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const activeProject = useProjectStore((s) => s.activeProject);
  const user = useAuthStore((s) => s.user);
  const { data: items, isLoading, isError, refetch } = useProjectItems(activeProject?.id);
  const { data: rooms = [] } = useRooms(activeProject?.id);
  const createItem = useCreateItem();
  const loadingTimeout = useLoadingTimeout(isLoading);

  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRoomId, setNewRoomId] = useState<string | null>(null);
  const [newBudget, setNewBudget] = useState('');

  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  const sortedItems = useMemo(() => {
    const list = items ?? [];
    const orderByRoom = new Map(rooms.map((r, i) => [r.id, i]));
    const filtered = statusFilter === 'all' ? list : list.filter((i) => i.status === statusFilter);
    return [...filtered].sort((a, b) => {
      const ra = orderByRoom.get(a.room_id) ?? 999;
      const rb = orderByRoom.get(b.room_id) ?? 999;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }, [items, rooms, statusFilter]);

  const resetForm = useCallback(() => {
    setNewName('');
    setNewRoomId(null);
    setNewBudget('');
  }, []);

  const handleAdd = useCallback(async () => {
    if (!activeProject || !newName.trim() || !newRoomId) return;
    try {
      await createItem.mutateAsync({
        room_id: newRoomId,
        project_id: activeProject.id,
        category: 'Geral',
        name: newName.trim(),
        status: 'researching',
        quantity: 1,
        budget: newBudget ? parseFloat(newBudget) || 0 : 0,
        actual_price: null,
        notes: null,
        updated_by: user?.id ?? null,
      });
      resetForm();
      setShowAddForm(false);
    } catch (e: any) {
      showAlert('Erro', e?.message ?? 'Erro ao adicionar item');
    }
  }, [activeProject, newName, newRoomId, newBudget, user, createItem, resetForm]);

  if (!activeProject) {
    return (
      <View className="flex-1 bg-cream dark:bg-sand-900" style={{ paddingTop: insets.top }}>
        <EmptyState icon="list" title="Nenhum projeto selecionado" description="Selecione ou crie um projeto para ver os itens" />
      </View>
    );
  }

  if (isLoading && !loadingTimeout) return <LoadingScreen />;

  if (isError || loadingTimeout) {
    return (
      <View className="flex-1 items-center justify-center bg-cream dark:bg-sand-900 p-8" style={{ paddingTop: insets.top }}>
        <Feather name="alert-circle" size={40} color="#EF4444" />
        <Text className="text-sand-800 dark:text-sand-100 text-lg font-semibold text-center mt-4 mb-2">
          {loadingTimeout ? 'Conexão lenta' : 'Erro ao carregar itens'}
        </Text>
        <Text className="text-sand-500 dark:text-sand-400 text-sm text-center mb-6">Verifique sua conexão e tente novamente</Text>
        <Button title="Tentar novamente" onPress={() => refetch()} size="sm" />
      </View>
    );
  }

  const totalCount = items?.length ?? 0;

  const listHeader = (
    <View className="px-4 pt-2">
      <Text className="text-sand-900 dark:text-sand-50 text-2xl font-bold">Itens</Text>
      <Text className="text-sand-500 dark:text-sand-400 text-sm mt-0.5 mb-3">
        {totalCount} {totalCount === 1 ? 'item no projeto' : 'itens no projeto'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-4 px-4"
        contentContainerStyle={{ paddingRight: 8, alignItems: 'center' }}
      >
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Filtrar por ${f.label}`}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                backgroundColor: active ? colors.accent : colors.surface,
                borderWidth: active ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: active ? '#FFFFFF' : colors.textSecondary }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1 bg-cream dark:bg-sand-900" style={{ paddingTop: insets.top }}>
      <FlashList
        data={sortedItems}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{ paddingBottom: 110, paddingTop: 8 }}
        ListEmptyComponent={
          <View className="px-4 py-16 items-center">
            <View className="bg-sand-100 dark:bg-sand-800 rounded-full p-6 mb-4">
              <Feather name="list" size={40} color="#A89270" />
            </View>
            <Text className="text-sand-800 dark:text-sand-100 text-lg font-semibold text-center mb-2">
              {statusFilter === 'all' ? 'Nenhum item ainda' : 'Nenhum item nesta etapa'}
            </Text>
            <Text className="text-sand-500 dark:text-sand-400 text-sm text-center mb-6">
              {rooms.length === 0
                ? 'Crie um cômodo primeiro para adicionar itens'
                : statusFilter === 'all'
                  ? 'Adicione o primeiro item do seu projeto'
                  : 'Tente outro filtro ou adicione um item'}
            </Text>
            {rooms.length > 0 && <Button title="Adicionar item" onPress={() => setShowAddForm(true)} size="sm" />}
          </View>
        }
        renderItem={({ item }) => {
          const room = roomById.get(item.room_id);
          const isPurchased = PURCHASED_STATUSES.includes(item.status);
          const spent = Number(item.actual_price || 0);
          const budget = Number(item.budget || 0);
          const overBudget = budget > 0 && spent > budget;
          return (
            <View className="px-4">
              <Card
                className="mb-3"
                onPress={() => router.push(`/project/${activeProject.id}/room/${item.room_id}/item/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Abrir item ${item.name}`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-sand-900 dark:text-sand-50 font-semibold text-base">{item.name}</Text>
                    <View className="flex-row items-center mt-1">
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: room?.color ?? '#A89270', marginRight: 6 }} />
                      <Text className="text-sand-500 dark:text-sand-400 text-xs" numberOfLines={1}>
                        {room?.name ?? 'Sem cômodo'}
                        {item.category ? ` · ${item.category}` : ''}
                      </Text>
                    </View>
                  </View>
                  <StatusChip status={item.status} size="sm" />
                </View>

                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-sand-100 dark:border-sand-700">
                  <View className="flex-row items-center">
                    <Feather name="target" size={13} color={colors.textMuted} />
                    <Text className="text-sand-600 dark:text-sand-300 text-xs ml-1.5">
                      Orçamento: {formatCurrency(budget)}
                    </Text>
                  </View>
                  {isPurchased ? (
                    <View className="flex-row items-center">
                      <Feather name="check-circle" size={13} color={overBudget ? '#EF4444' : '#10B981'} />
                      <Text className="text-xs ml-1.5 font-semibold" style={{ color: overBudget ? '#EF4444' : '#10B981' }}>
                        Gasto: {formatCurrency(spent)}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-sand-400 dark:text-sand-500 text-xs">Não comprado</Text>
                  )}
                </View>
              </Card>
            </View>
          );
        }}
      />

      {rooms.length > 0 && !showAddForm && (
        <FAB onPress={() => setShowAddForm(true)} accessibilityLabel="Adicionar item" />
      )}

      <Modal visible={showAddForm} transparent animationType="slide" onRequestClose={() => setShowAddForm(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowAddForm(false)} />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: insets.bottom + 20,
              maxHeight: '85%',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong }} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Novo item</Text>

            <Text style={{ color: colors.textSecondary, fontWeight: '500', fontSize: 13, marginBottom: 6 }}>Nome</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Ex: Geladeira, Piso, Sofá"
              placeholderTextColor={colors.placeholder}
              style={inputStyle(colors)}
            />

            <Text style={{ color: colors.textSecondary, fontWeight: '500', fontSize: 13, marginTop: 12, marginBottom: 6 }}>
              Cômodo
            </Text>
            <ScrollView style={{ maxHeight: 150 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {rooms.map((r) => {
                const sel = newRoomId === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => setNewRoomId(r.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={`Cômodo ${r.name}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: sel ? colors.accent : colors.inputBg,
                      borderWidth: 1,
                      borderColor: sel ? colors.accent : colors.border,
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: r.color, marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '500', color: sel ? '#FFFFFF' : colors.textPrimary }}>{r.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={{ color: colors.textSecondary, fontWeight: '500', fontSize: 13, marginTop: 12, marginBottom: 6 }}>
              Orçamento (opcional)
            </Text>
            <TextInput
              value={newBudget}
              onChangeText={setNewBudget}
              placeholder="0,00"
              keyboardType="numeric"
              placeholderTextColor={colors.placeholder}
              style={inputStyle(colors)}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <Button title="Cancelar" onPress={() => { setShowAddForm(false); resetForm(); }} variant="ghost" size="sm" className="flex-1" />
              <Button
                title="Adicionar"
                onPress={handleAdd}
                size="sm"
                className="flex-1"
                loading={createItem.isPending}
                disabled={!newName.trim() || !newRoomId}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
