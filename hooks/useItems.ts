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
import { patchItemInLists, restoreListSnapshots, type ListSnapshot } from './optimistic';
import type { Item, ItemStatus, ItemWithOptions } from '../types';

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
    // Optimistic: reflete o novo status na UI antes da resposta do backend.
    onMutate: async ({ itemId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['item', itemId] });
      const previousItem = queryClient.getQueryData<ItemWithOptions>(['item', itemId]);
      queryClient.setQueryData<ItemWithOptions>(['item', itemId], (old) =>
        old ? { ...old, status } : old
      );
      const listSnapshots = patchItemInLists(queryClient, itemId, (it) => ({ ...it, status }));
      return { itemId, previousItem, listSnapshots };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      if (ctx.previousItem) queryClient.setQueryData(['item', ctx.itemId], ctx.previousItem);
      restoreListSnapshots(queryClient, ctx.listSnapshots);
    },
    // Reconcilia com o backend/realtime independentemente de sucesso ou erro.
    onSettled: (data, _err, variables) => {
      const itemId = data?.id ?? variables.itemId;
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['items', data.room_id] });
        queryClient.invalidateQueries({ queryKey: ['project-items', data.project_id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['items'] });
        queryClient.invalidateQueries({ queryKey: ['project-items'] });
      }
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
