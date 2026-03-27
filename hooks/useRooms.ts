import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../services/rooms';
import type { Room } from '../types';

type RoomUpdates = Partial<Pick<Room, 'name' | 'icon' | 'color' | 'sort_order'>>;

export function useRooms(projectId: string | undefined) {
  return useQuery({
    queryKey: ['rooms', projectId],
    queryFn: () => getRooms(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (room: Omit<Room, 'id' | 'created_at'>) => createRoom(room),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.project_id] });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roomId,
      updates,
      projectId,
    }: {
      roomId: string;
      updates: RoomUpdates;
      projectId: string;
    }) => updateRoom(roomId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.projectId] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, projectId }: { roomId: string; projectId: string }) =>
      deleteRoom(roomId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.projectId] });
    },
  });
}
