import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getComments,
  createComment,
  deleteComment,
  type ItemCommentWithProfile,
} from '../services/comments';

export function useComments(itemId: string | undefined) {
  return useQuery({
    queryKey: ['comments', itemId],
    queryFn: () => getComments(itemId!),
    enabled: !!itemId,
  });
}

export function useCreateComment(itemId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, message }: { userId: string; message: string }) =>
      createComment(itemId!, userId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', itemId] });
    },
  });
}

export function useDeleteComment(itemId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', itemId] });
    },
  });
}
