import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getItems,
  getItemsByProject,
  getItem,
  createItem,
  updateItem,
  updateItemStatus,
  deleteItem,
} from '../services/items';
import { useAuthStore } from '../stores/authStore';
import type { Item, ItemStatus } from '../types';

export function useItems(roomId: string | undefined) {
  return useQuery({
    queryKey: ['items', roomId],
    queryFn: () => getItems(roomId!),
    enabled: !!roomId,
  });
}

export function useProjectItems(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-items', projectId],
    queryFn: () => getItemsByProject(projectId!),
    enabled: !!projectId,
  });
}

export function useItem(itemId: string | undefined) {
  return useQuery({
    queryKey: ['item', itemId],
    queryFn: () => getItem(itemId!),
    enabled: !!itemId,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Omit<Item, 'id' | 'updated_at' | 'created_at'>) => createItem(item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items', variables.room_id] });
      queryClient.invalidateQueries({ queryKey: ['project-items', variables.project_id] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<Item> }) =>
      updateItem(itemId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['items', data.room_id] });
      queryClient.invalidateQueries({ queryKey: ['item', data.id] });
      queryClient.invalidateQueries({ queryKey: ['project-items', data.project_id] });
    },
  });
}

export function useUpdateItemStatus() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: ItemStatus }) =>
      updateItemStatus(itemId, status, user!.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['items', data.room_id] });
      queryClient.invalidateQueries({ queryKey: ['item', data.id] });
      queryClient.invalidateQueries({ queryKey: ['project-items', data.project_id] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, roomId, projectId }: { itemId: string; roomId: string; projectId: string }) =>
      deleteItem(itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['project-items', variables.projectId] });
    },
  });
}
