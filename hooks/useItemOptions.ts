import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getItemOptions,
  createItemOption,
  updateItemOption,
  chooseOption,
  deleteItemOption,
  addOptionPhoto,
  deleteOptionPhoto,
  type ItemOptionWithPhotos,
} from '../services/itemOptions';
import type { ItemOption } from '../types';

export function useItemOptions(itemId: string | undefined) {
  return useQuery({
    queryKey: ['item-options', itemId],
    queryFn: () => getItemOptions(itemId!),
    enabled: !!itemId,
  });
}

export function useCreateItemOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (option: Omit<ItemOption, 'id' | 'created_at'>) => createItemOption(option),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['item-options', variables.item_id] });
      queryClient.invalidateQueries({ queryKey: ['item', variables.item_id] });
    },
  });
}

export function useUpdateItemOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      optionId,
      updates,
      itemId,
    }: {
      optionId: string;
      updates: Partial<ItemOption>;
      itemId: string;
    }) => updateItemOption(optionId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['item-options', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['item', variables.itemId] });
    },
  });
}

export function useChooseOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, optionId }: { itemId: string; optionId: string }) =>
      chooseOption(itemId, optionId),
    // Optimistic: marca a opção como escolhida (e desmarca as demais) na hora.
    onMutate: async ({ itemId, optionId }) => {
      const key = ['item-options', itemId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ItemOptionWithPhotos[]>(key);
      queryClient.setQueryData<ItemOptionWithPhotos[]>(key, (old) =>
        old?.map((opt) => ({ ...opt, is_chosen: opt.id === optionId }))
      );
      return { itemId, previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['item-options', ctx.itemId], ctx.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['item-options', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['item', variables.itemId] });
    },
  });
}

export function useDeleteItemOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ optionId, itemId }: { optionId: string; itemId: string }) =>
      deleteItemOption(optionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['item-options', variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['item', variables.itemId] });
    },
  });
}

export function useAddOptionPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      optionId,
      storageUrl,
      itemId,
    }: {
      optionId: string;
      storageUrl: string;
      itemId: string;
    }) => addOptionPhoto(optionId, storageUrl),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['item-options', variables.itemId] });
    },
  });
}

export function useDeleteOptionPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ photoId, itemId }: { photoId: string; itemId: string }) =>
      deleteOptionPhoto(photoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['item-options', variables.itemId] });
    },
  });
}
