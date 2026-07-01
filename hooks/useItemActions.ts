import { useCallback } from 'react';
import { showAlert } from '../utils/alert';
import { shareViaWhatsApp } from '../utils/share';
import { useUpdateItem, useUpdateItemStatus } from './useItems';
import { useCreateItemOption, useChooseOption, useDeleteItemOption } from './useItemOptions';
import { useCreateComment } from './useComments';
import { useUploadOptionPhoto } from './useUploadOptionPhoto';
import { useAuthStore } from '../stores/authStore';
import type { OptionFormValues } from '../components/item';
import type { ItemOptionWithPhotos } from '../services/itemOptions';
import type { ItemStatus, ItemWithOptions } from '../types';

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Controlador de mutations da tela de item: concentra chamadas de escrita,
 * tratamento de erro (showAlert) e flags de pending, mantendo a tela como
 * composição de componentes.
 *
 * Convenções de retorno:
 * - `addOption`/`saveCategory` relançam o erro (o chamador precisa saber que
 *   falhou para preservar o formulário/modal aberto);
 * - `saveBudget`/`saveNotes`/`sendComment` retornam `true` em sucesso;
 * - demais ações apenas alertam em erro.
 */
export function useItemActions(itemId: string | undefined, item: ItemWithOptions | undefined) {
  const user = useAuthStore((s) => s.user);
  const updateItem = useUpdateItem();
  const updateStatus = useUpdateItemStatus();
  const createOption = useCreateItemOption();
  const chooseOptionMutation = useChooseOption();
  const deleteOptionMutation = useDeleteItemOption();
  const createComment = useCreateComment(itemId);
  const uploadPhoto = useUploadOptionPhoto(itemId);

  const changeStatus = useCallback(
    async (status: ItemStatus) => {
      if (!itemId) return;
      try {
        await updateStatus.mutateAsync({ itemId, status });
      } catch (error) {
        showAlert('Erro', messageOf(error, 'Erro ao atualizar status'));
      }
    },
    [itemId, updateStatus]
  );

  const addOption = useCallback(
    async (values: OptionFormValues) => {
      if (!itemId) return;
      try {
        await createOption.mutateAsync({
          item_id: itemId,
          ...values,
          is_chosen: false,
          created_by: user?.id ?? null,
        });
      } catch (error) {
        showAlert('Erro', messageOf(error, 'Erro ao adicionar opção'));
        throw error;
      }
    },
    [itemId, user, createOption]
  );

  const chooseOption = useCallback(
    async (optionId: string) => {
      if (!itemId) return;
      try {
        await chooseOptionMutation.mutateAsync({ itemId, optionId });
      } catch (error) {
        showAlert('Erro', messageOf(error, 'Erro ao escolher opção'));
      }
    },
    [itemId, chooseOptionMutation]
  );

  const deleteOption = useCallback(
    (optionId: string) => {
      if (!itemId) return;
      showAlert('Remover opção', 'Tem certeza?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => deleteOptionMutation.mutate({ optionId, itemId }),
        },
      ]);
    },
    [itemId, deleteOptionMutation]
  );

  const uploadOptionPhoto = useCallback(
    (optionId: string) => {
      uploadPhoto.mutate(optionId, {
        onError: (error) => showAlert('Erro', messageOf(error, 'Erro ao enviar foto')),
      });
    },
    [uploadPhoto]
  );

  const saveCategory = useCallback(
    async (category: string) => {
      if (!itemId) return;
      try {
        await updateItem.mutateAsync({ itemId, updates: { category } });
      } catch (error) {
        showAlert('Erro', messageOf(error, 'Erro ao salvar categoria'));
        throw error;
      }
    },
    [itemId, updateItem]
  );

  const saveBudget = useCallback(
    async (budget: number) => {
      if (!itemId) return false;
      try {
        await updateItem.mutateAsync({ itemId, updates: { budget } });
        return true;
      } catch (error) {
        showAlert('Erro', messageOf(error, 'Erro ao salvar orçamento'));
        return false;
      }
    },
    [itemId, updateItem]
  );

  const saveNotes = useCallback(
    async (notes: string | null) => {
      if (!itemId) return false;
      try {
        await updateItem.mutateAsync({ itemId, updates: { notes } });
        return true;
      } catch (error) {
        showAlert('Erro', messageOf(error, 'Erro ao salvar notas'));
        return false;
      }
    },
    [itemId, updateItem]
  );

  const sendComment = useCallback(
    async (message: string) => {
      if (!message.trim() || !itemId || !user) return false;
      try {
        await createComment.mutateAsync({ userId: user.id, message: message.trim() });
        return true;
      } catch (error) {
        showAlert('Erro', messageOf(error, 'Erro ao enviar comentário'));
        return false;
      }
    },
    [itemId, user, createComment]
  );

  const share = useCallback(
    (option: ItemOptionWithPhotos) => {
      shareViaWhatsApp({
        name: `${item?.name} - ${option.model_name}`,
        brand: option.brand,
        price: option.price,
        store: option.store,
        url: option.url,
      });
    },
    [item]
  );

  return {
    changeStatus,
    addOption,
    chooseOption,
    deleteOption,
    uploadOptionPhoto,
    saveCategory,
    saveBudget,
    saveNotes,
    sendComment,
    share,
    creatingOption: createOption.isPending,
    uploadingPhoto: uploadPhoto.isPending,
    savingItem: updateItem.isPending,
    sendingComment: createComment.isPending,
  };
}
