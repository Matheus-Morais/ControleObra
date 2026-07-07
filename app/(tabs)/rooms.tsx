import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useProjectStore } from '../../stores/projectStore';
import { useTheme } from '../../hooks/useTheme';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '../../hooks/useRooms';
import { useProjectItems } from '../../hooks/useItems';
import { useLoadingTimeout } from '../../hooks/useLoadingTimeout';
import { Card, ProgressBar, FAB, EmptyState, LoadingScreen, Button } from '../../components/ui';
import { DEFAULT_ROOMS } from '../../constants/rooms';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { showAlert } from '../../utils/alert';
import type { Room, Item } from '../../types';

const ROOM_COLORS = [
  '#C1694F', '#A85740', '#5B7553', '#6F9366', '#3B82F6',
  '#6366F1', '#8B5CF6', '#6B7280', '#F59E0B', '#0EA5E9',
  '#A89270', '#EC4899', '#14B8A6', '#EF4444',
];

const ROOM_ICONS = [
  'home', 'grid', 'box', 'star', 'heart',
  'layers', 'square', 'triangle', 'circle', 'hexagon',
];

const EMPTY_ROOM_PROGRESS = { total: 0, done: 0, budget: 0, spent: 0 };

function buildProgressByRoomId(items: Item[]) {
  const byRoom = new Map<string, Item[]>();
  for (const i of items) {
    const list = byRoom.get(i.room_id) ?? [];
    list.push(i);
    byRoom.set(i.room_id, list);
  }
  const map = new Map<string, { total: number; done: number; budget: number; spent: number }>();
  for (const [roomId, roomItems] of byRoom) {
    const total = roomItems.length;
    const done = roomItems.filter((i) => i.status === 'purchased' || i.status === 'installed').length;
    const budget = roomItems.reduce((sum, i) => sum + Number(i.budget || 0), 0);
    const spent = roomItems.reduce((sum, i) => sum + Number(i.actual_price || 0), 0);
    map.set(roomId, { total, done, budget, spent });
  }
  return map;
}

export default function RoomsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const activeProject = useProjectStore((s) => s.activeProject);
  const { data: rooms, isLoading: roomsLoading, isError: roomsError, refetch: refetchRooms } = useRooms(activeProject?.id);
  const { data: items = [] } = useProjectItems(activeProject?.id);
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const [isAddingRooms, setIsAddingRooms] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editName, setEditName] = useState('');
  const [actionRoom, setActionRoom] = useState<Room | null>(null);
  const inputRef = useRef<TextInput>(null);
  const loadingTimeout = useLoadingTimeout(roomsLoading);

  const progressByRoomId = useMemo(() => buildProgressByRoomId(items), [items]);

  const hasRooms = !!rooms && rooms.length > 0;

  const handleAddDefaultRooms = useCallback(async () => {
    if (!activeProject || isAddingRooms) return;
    setIsAddingRooms(true);
    try {
      for (let i = 0; i < DEFAULT_ROOMS.length; i++) {
        const dr = DEFAULT_ROOMS[i];
        await createRoom.mutateAsync({
          project_id: activeProject.id,
          name: dr.name,
          icon: dr.icon,
          color: dr.color,
          sort_order: i,
        });
      }
    } catch (error: any) {
      showAlert('Erro', error.message ?? 'Erro ao adicionar cômodos');
    } finally {
      setIsAddingRooms(false);
    }
  }, [activeProject, createRoom, isAddingRooms]);

  const handleAddCustomRoom = useCallback(async () => {
    const name = newRoomName.trim();
    if (!name || !activeProject) return;

    const colorIndex = (rooms?.length ?? 0) % ROOM_COLORS.length;
    const iconIndex = (rooms?.length ?? 0) % ROOM_ICONS.length;

    try {
      await createRoom.mutateAsync({
        project_id: activeProject.id,
        name,
        icon: ROOM_ICONS[iconIndex],
        color: ROOM_COLORS[colorIndex],
        sort_order: rooms?.length ?? 0,
      });
      setNewRoomName('');
      setShowAddForm(false);
      Keyboard.dismiss();
    } catch (error: any) {
      showAlert('Erro', error?.message ?? 'Erro ao criar cômodo');
    }
  }, [newRoomName, activeProject, rooms, createRoom]);

  const handleRoomPress = useCallback(
    (room: Room) => {
      if (!activeProject) return;
      router.push(`/project/${activeProject.id}/room/${room.id}`);
    },
    [activeProject, router]
  );

  const handleRoomLongPress = useCallback(
    (room: Room) => {
      if (!activeProject) return;
      setActionRoom(room);
    },
    [activeProject]
  );

  const handleActionRename = useCallback(() => {
    if (!actionRoom) return;
    setEditingRoom(actionRoom);
    setEditName(actionRoom.name);
    setActionRoom(null);
  }, [actionRoom]);

  const handleActionDelete = useCallback(() => {
    if (!actionRoom || !activeProject) return;
    const room = actionRoom;
    setActionRoom(null);
    showAlert(
      'Excluir cômodo',
      `Tem certeza que deseja excluir "${room.name}"? Todos os itens deste cômodo serão removidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteRoom.mutate({ roomId: room.id, projectId: activeProject.id }),
        },
      ]
    );
  }, [actionRoom, activeProject, deleteRoom]);

  const handleSaveRename = useCallback(async () => {
    const name = editName.trim();
    if (!name || !editingRoom || !activeProject) return;
    if (name === editingRoom.name) {
      setEditingRoom(null);
      return;
    }

    try {
      await updateRoom.mutateAsync({
        roomId: editingRoom.id,
        updates: { name },
        projectId: activeProject.id,
      });
      setEditingRoom(null);
      setEditName('');
    } catch (error: any) {
      showAlert('Erro', error?.message ?? 'Erro ao renomear cômodo');
    }
  }, [editName, editingRoom, activeProject, updateRoom]);

  if (!activeProject) {
    return <EmptyState icon="home" title="Nenhum projeto selecionado" description="Selecione ou crie um projeto para começar" />;
  }

  if (roomsLoading && !loadingTimeout) return <LoadingScreen />;

  if (roomsError || loadingTimeout) {
    return (
      <View className="flex-1 items-center justify-center bg-cream dark:bg-sand-900 p-8">
        <Feather name="alert-circle" size={40} color="#EF4444" />
        <Text className="text-sand-800 dark:text-sand-100 text-lg font-semibold text-center mt-4 mb-2">
          {loadingTimeout ? 'Conexão lenta' : 'Erro ao carregar cômodos'}
        </Text>
        <Text className="text-sand-500 dark:text-sand-400 text-sm text-center mb-6">Verifique sua conexão e tente novamente</Text>
        <Button title="Tentar novamente" onPress={() => refetchRooms()} size="sm" />
      </View>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <View className="flex-1 bg-cream dark:bg-sand-900">
        <EmptyState
          icon="grid"
          title="Nenhum cômodo ainda"
          description="Adicione os cômodos padrão ou crie um personalizado"
          actionLabel="Adicionar Cômodos Padrão"
          onAction={handleAddDefaultRooms}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream dark:bg-sand-900" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-xl font-bold text-sand-900 dark:text-sand-50 mb-4">
          Cômodos
        </Text>

        {/* Action menu for long press */}
        {actionRoom && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: actionRoom.color + '20',
                  marginRight: 10,
                }}
              >
                <Feather name={actionRoom.icon as any} size={18} color={actionRoom.color} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>
                {actionRoom.name}
              </Text>
              <TouchableOpacity
                onPress={() => setActionRoom(null)}
                style={{ padding: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Fechar menu"
              >
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleActionRename}
                accessibilityRole="button"
                accessibilityLabel="Renomear cômodo"
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  paddingVertical: 10, borderRadius: 8,
                  backgroundColor: colors.inputBg,
                }}
              >
                <Feather name="edit-2" size={16} color={colors.textPrimary} />
                <Text style={{ marginLeft: 6, fontWeight: '500', color: colors.textPrimary, fontSize: 14 }}>Renomear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleActionDelete}
                accessibilityRole="button"
                accessibilityLabel="Excluir cômodo"
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  paddingVertical: 10, borderRadius: 8,
                  backgroundColor: '#FEF2F2',
                }}
              >
                <Feather name="trash-2" size={16} color="#EF4444" />
                <Text style={{ marginLeft: 6, fontWeight: '500', color: '#EF4444', fontSize: 14 }}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Rename form */}
        {editingRoom && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>
              Renomear &quot;{editingRoom.name}&quot;
            </Text>
            <TextInput
              autoFocus
              value={editName}
              onChangeText={setEditName}
              onSubmitEditing={handleSaveRename}
              returnKeyType="done"
              placeholder="Novo nome do cômodo"
              placeholderTextColor={colors.placeholder}
              style={{
                borderWidth: 1,
                borderColor: colors.inputBorder,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 16,
                color: colors.textPrimary,
                backgroundColor: colors.inputBg,
                marginBottom: 12,
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity
                onPress={() => { setEditingRoom(null); setEditName(''); }}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveRename}
                accessibilityRole="button"
                accessibilityLabel="Salvar novo nome"
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: editName.trim() && editName.trim() !== editingRoom.name ? colors.accent : colors.borderStrong,
                }}
                disabled={!editName.trim() || editName.trim() === editingRoom.name}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add custom room form */}
        {showAddForm && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>
              Novo Cômodo
            </Text>
            <TextInput
              ref={inputRef}
              autoFocus
              value={newRoomName}
              onChangeText={setNewRoomName}
              onSubmitEditing={handleAddCustomRoom}
              returnKeyType="done"
              placeholder="Nome do cômodo"
              placeholderTextColor={colors.placeholder}
              style={{
                borderWidth: 1,
                borderColor: colors.inputBorder,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 16,
                color: colors.textPrimary,
                backgroundColor: colors.inputBg,
                marginBottom: 12,
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity
                onPress={() => { setShowAddForm(false); setNewRoomName(''); }}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddCustomRoom}
                accessibilityRole="button"
                accessibilityLabel="Criar cômodo"
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: newRoomName.trim() ? colors.accent : colors.borderStrong,
                }}
                disabled={!newRoomName.trim()}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {rooms.map((room) => {
            const progress = progressByRoomId.get(room.id) ?? EMPTY_ROOM_PROGRESS;
            const pct = formatPercentage(progress.done, progress.total);

            return (
              <Card
                key={room.id}
                onPress={() => handleRoomPress(room)}
                onLongPress={() => handleRoomLongPress(room)}
                accessibilityRole="button"
                accessibilityLabel={`Abrir cômodo ${room.name}`}
                className="mb-1"
                style={{ width: '47%' }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mb-2"
                  style={{ backgroundColor: room.color + '20' }}
                >
                  <Feather
                    name={room.icon as any}
                    size={20}
                    color={room.color}
                  />
                </View>
                <Text className="text-sand-900 dark:text-sand-50 font-semibold text-sm" numberOfLines={1}>
                  {room.name}
                </Text>
                <Text className="text-sand-500 dark:text-sand-400 text-xs mt-0.5">
                  {progress.total} {progress.total === 1 ? 'item' : 'itens'}
                </Text>
                {progress.total > 0 && (
                  <ProgressBar
                    progress={pct}
                    barColor={room.color}
                    className="mt-2"
                    height={4}
                    showLabel={false}
                  />
                )}
                {progress.budget > 0 && (
                  <Text className="text-sand-400 dark:text-sand-500 text-xs mt-1">
                    {formatCurrency(progress.spent)} / {formatCurrency(progress.budget)}
                  </Text>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
      {!showAddForm && !editingRoom && !actionRoom && (
        <FAB
          onPress={() => setShowAddForm(true)}
          icon="plus"
        />
      )}
    </View>
  );
}
