import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pickImage, uploadPhoto } from '../services/storage';
import { addOptionPhoto } from '../services/itemOptions';
import { useAuthStore } from '../stores/authStore';

/**
 * Encapsula o fluxo de anexar foto a uma opção: escolher imagem → upload no
 * Storage → registrar a foto. Retorna `null` quando o usuário cancela o picker.
 * Mantém a tela livre de chamadas diretas a `services/*`.
 */
export function useUploadOptionPhoto(itemId: string | undefined) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (optionId: string) => {
      const uri = await pickImage();
      if (!uri || !user) return null;
      const publicUrl = await uploadPhoto(uri, user.id);
      return addOptionPhoto(optionId, publicUrl);
    },
    onSuccess: (result) => {
      if (result && itemId) {
        queryClient.invalidateQueries({ queryKey: ['item-options', itemId] });
      }
    },
  });
}
