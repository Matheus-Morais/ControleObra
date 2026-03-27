import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useProjectStore } from '../../stores/projectStore';
import { useRooms, useCreateRoom, useDeleteRoom } from '../../hooks/useRooms';
import { useProjectItems } from '../../hooks/useItems';
import { Card, ProgressBar, FAB, EmptyState, LoadingScreen } from '../../components/ui';
import { DEFAULT_ROOMS } from '../../constants/rooms';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { showAlert } from '../../utils/alert';
import type { Room, Item } from '../../types';

function getRoomProgress(roomId: string, items: Item[]) {
  const roomItems = items.filter((i) => i.room_id === roomId);
  const total = roomItems.length;
  const done = roomItems.filter((i) => i.status === 'purchased' || i.status === 'installed').length;
  const budget = roomItems.reduce((sum, i) => sum + Number(i.budget || 0), 0);
  const spent = roomItems.reduce((sum, i) => sum + Number(i.actual_price || 0), 0);
  return { total, done, budget, spent };
}

export default function RoomsScreen() {
  const router = useRouter();
  const activeProject = useProjectStore((s) => s.activeProject);
  const { data: rooms, isLoading: roomsLoading } = useRooms(activeProject?.id);
  const { data: items = [] } = useProjectItems(activeProject?.id);
  const createRoom = useCreateRoom();
  const deleteRoom = useDeleteRoom();
  const [isAddingRooms, setIsAddingRooms] = useState(false);

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

  const handleRoomPress = useCallback(
    (room: Room) => {
      if (!activeProject) return;
      router.push(`/project/${activeProject.id}/room/${room.id}`);
    },
    [activeProject, router]
  );

  const handleDeleteRoom = useCallback(
    (room: Room) => {
      if (!activeProject) return;
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
    },
    [activeProject, deleteRoom]
  );

  if (!activeProject) {
    return <EmptyState icon="home" title="Nenhum projeto selecionado" description="Selecione ou crie um projeto para começar" />;
  }

  if (roomsLoading) return <LoadingScreen />;

  if (!rooms || rooms.length === 0) {
    return (
      <View className="flex-1 bg-cream">
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
    <View className="flex-1 bg-cream">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-xl font-bold text-sand-900 mb-4">
          Cômodos
        </Text>
        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {rooms.map((room) => {
            const progress = getRoomProgress(room.id, items);
            const pct = formatPercentage(progress.done, progress.total);

            return (
              <Card
                key={room.id}
                onPress={() => handleRoomPress(room)}
                onLongPress={() => handleDeleteRoom(room)}
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
                <Text className="text-sand-900 font-semibold text-sm" numberOfLines={1}>
                  {room.name}
                </Text>
                <Text className="text-sand-500 text-xs mt-0.5">
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
                  <Text className="text-sand-400 text-xs mt-1">
                    {formatCurrency(progress.spent)} / {formatCurrency(progress.budget)}
                  </Text>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
      {!isAddingRooms && (
        <FAB
          onPress={handleAddDefaultRooms}
          icon="plus"
        />
      )}
    </View>
  );
}
