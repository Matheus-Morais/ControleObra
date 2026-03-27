import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useItem, useUpdateItem, useUpdateItemStatus } from '../../../../../../hooks/useItems';
import {
  useItemOptions,
  useCreateItemOption,
  useChooseOption,
  useDeleteItemOption,
} from '../../../../../../hooks/useItemOptions';
import { useAuthStore } from '../../../../../../stores/authStore';
import {
  Card,
  Button,
  Input,
  StatusChip,
  StarRating,
  LoadingScreen,
  EmptyState,
} from '../../../../../../components/ui';
import { formatCurrency, formatDateTime } from '../../../../../../utils/format';
import { shareViaWhatsApp } from '../../../../../../utils/share';
import { pickImage, uploadPhoto } from '../../../../../../services/storage';
import { addOptionPhoto, type ItemOptionWithPhotos } from '../../../../../../services/itemOptions';
import {
  getComments,
  createComment,
  type ItemCommentWithProfile,
} from '../../../../../../services/comments';
import type { ItemStatus } from '../../../../../../types';

const STATUSES: { key: ItemStatus; label: string; color: string }[] = [
  { key: 'researching', label: 'Pesquisando', color: '#3B82F6' },
  { key: 'decided', label: 'Decidido', color: '#F59E0B' },
  { key: 'purchased', label: 'Comprado', color: '#8B5CF6' },
  { key: 'installed', label: 'Instalado', color: '#10B981' },
];

export default function ItemDetailScreen() {
  const { itemId: itemIdParam } = useLocalSearchParams<{
    id: string;
    roomId: string;
    itemId: string;
  }>();
  const itemId = Array.isArray(itemIdParam) ? itemIdParam[0] : itemIdParam;
  const user = useAuthStore((s) => s.user);
  const { data: item, isLoading } = useItem(itemId);
  const { data: options, refetch: refetchOptions } = useItemOptions(itemId);
  const updateItem = useUpdateItem();
  const updateStatus = useUpdateItemStatus();
  const createOption = useCreateItemOption();
  const chooseOption = useChooseOption();
  const deleteOption = useDeleteItemOption();

  const [showOptionForm, setShowOptionForm] = useState(false);
  const [optionName, setOptionName] = useState('');
  const [optionBrand, setOptionBrand] = useState('');
  const [optionPrice, setOptionPrice] = useState('');
  const [optionStore, setOptionStore] = useState('');
  const [optionUrl, setOptionUrl] = useState('');
  const [optionNotes, setOptionNotes] = useState('');
  const [optionRating, setOptionRating] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [comments, setComments] = useState<ItemCommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  useEffect(() => {
    if (itemId) {
      getComments(itemId).then(setComments).catch(() => {});
    }
  }, [itemId]);

  useEffect(() => {
    if (item) {
      setBudgetValue(String(item.budget || 0));
      setNotesValue(item.notes || '');
    }
  }, [item]);

  const handleStatusChange = useCallback(
    async (status: ItemStatus) => {
      if (!itemId) return;
      try {
        await updateStatus.mutateAsync({ itemId, status });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro ao atualizar status';
        Alert.alert('Erro', message);
      }
    },
    [itemId, updateStatus]
  );

  const handleAddOption = useCallback(async () => {
    if (!optionName.trim() || !itemId) return;
    try {
      await createOption.mutateAsync({
        item_id: itemId,
        model_name: optionName.trim(),
        brand: optionBrand.trim() || null,
        price: optionPrice ? parseFloat(optionPrice) : null,
        store: optionStore.trim() || null,
        url: optionUrl.trim() || null,
        notes: optionNotes.trim() || null,
        rating: optionRating || null,
        is_chosen: false,
        created_by: user?.id ?? null,
      });
      resetOptionForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao adicionar opção';
      Alert.alert('Erro', message);
    }
  }, [
    optionName,
    optionBrand,
    optionPrice,
    optionStore,
    optionUrl,
    optionNotes,
    optionRating,
    itemId,
    user,
    createOption,
  ]);

  function resetOptionForm() {
    setShowOptionForm(false);
    setOptionName('');
    setOptionBrand('');
    setOptionPrice('');
    setOptionStore('');
    setOptionUrl('');
    setOptionNotes('');
    setOptionRating(0);
  }

  const handleChooseOption = useCallback(
    async (optionId: string) => {
      if (!itemId) return;
      try {
        await chooseOption.mutateAsync({ itemId, optionId });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro ao escolher opção';
        Alert.alert('Erro', message);
      }
    },
    [itemId, chooseOption]
  );

  const handleDeleteOption = useCallback(
    (optionId: string) => {
      Alert.alert('Remover opção', 'Tem certeza?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => deleteOption.mutate({ optionId, itemId: itemId! }),
        },
      ]);
    },
    [itemId, deleteOption]
  );

  const handleUploadPhoto = useCallback(
    async (optionId: string) => {
      try {
        const uri = await pickImage();
        if (!uri || !user) return;
        setUploadingPhoto(true);
        const publicUrl = await uploadPhoto(uri, user.id);
        await addOptionPhoto(optionId, publicUrl);
        refetchOptions();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Erro ao enviar foto';
        Alert.alert('Erro', message ?? 'Erro ao enviar foto');
      } finally {
        setUploadingPhoto(false);
      }
    },
    [user, refetchOptions]
  );

  const handleSaveBudget = useCallback(async () => {
    if (!itemId) return;
    try {
      await updateItem.mutateAsync({
        itemId,
        updates: { budget: parseFloat(budgetValue) || 0 },
      });
      setEditingBudget(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar orçamento';
      Alert.alert('Erro', message);
    }
  }, [itemId, budgetValue, updateItem]);

  const handleSaveNotes = useCallback(async () => {
    if (!itemId) return;
    try {
      await updateItem.mutateAsync({
        itemId,
        updates: { notes: notesValue || null },
      });
      setEditingNotes(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar notas';
      Alert.alert('Erro', message);
    }
  }, [itemId, notesValue, updateItem]);

  const handleSendComment = useCallback(async () => {
    if (!newComment.trim() || !itemId || !user) return;
    setLoadingComment(true);
    try {
      await createComment(itemId, user.id, newComment.trim());
      setNewComment('');
      const updated = await getComments(itemId);
      setComments(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar comentário';
      Alert.alert('Erro', message);
    } finally {
      setLoadingComment(false);
    }
  }, [newComment, itemId, user]);

  const handleShare = useCallback(
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

  if (isLoading || !item) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-cream"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: item.name,
          headerStyle: { backgroundColor: '#FAFAF8' },
          headerTintColor: '#33291E',
        }}
      />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header info */}
        <View className="px-4 pt-4">
          <Card>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sand-500 text-sm">{item.category}</Text>
              <StatusChip status={item.status} />
            </View>
            <Text className="text-sand-900 text-xl font-bold">{item.name}</Text>
            <Text className="text-sand-500 text-xs mt-1">
              Qtd: {item.quantity} · Atualizado em {formatDateTime(item.updated_at)}
            </Text>

            {/* Status buttons */}
            <View className="flex-row flex-wrap gap-2 mt-4">
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => handleStatusChange(s.key)}
                  className={`px-3 py-1.5 rounded-full border ${
                    item.status === s.key
                      ? 'border-transparent'
                      : 'border-sand-200 bg-white'
                  }`}
                  style={
                    item.status === s.key
                      ? { backgroundColor: s.color + '20', borderColor: s.color }
                      : undefined
                  }
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: item.status === s.key ? s.color : '#6B7280' }}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>

        {/* Budget */}
        <View className="px-4 mt-4">
          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="text-sand-700 font-semibold">Orçamento</Text>
              <TouchableOpacity onPress={() => setEditingBudget(true)}>
                <Feather name="edit-2" size={16} color="#A89270" />
              </TouchableOpacity>
            </View>
            {editingBudget ? (
              <View className="flex-row items-center mt-2 gap-2">
                <TextInput
                  className="flex-1 border border-sand-300 rounded-lg px-3 py-2 text-base text-sand-900"
                  value={budgetValue}
                  onChangeText={setBudgetValue}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
                <Button title="Salvar" onPress={handleSaveBudget} size="sm" />
              </View>
            ) : (
              <Text className="text-2xl font-bold text-sand-900 mt-1">
                {formatCurrency(Number(item.budget) || 0)}
              </Text>
            )}
            {item.actual_price !== null && item.actual_price !== undefined && (
              <Text className="text-moss-500 text-sm mt-1">
                Preço real: {formatCurrency(Number(item.actual_price))}
              </Text>
            )}
          </Card>
        </View>

        {/* Notes */}
        <View className="px-4 mt-4">
          <Card>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sand-700 font-semibold">Notas</Text>
              <TouchableOpacity onPress={() => setEditingNotes(true)}>
                <Feather name="edit-2" size={16} color="#A89270" />
              </TouchableOpacity>
            </View>
            {editingNotes ? (
              <View>
                <TextInput
                  className="border border-sand-300 rounded-lg px-3 py-2 text-base text-sand-900 min-h-[80px]"
                  value={notesValue}
                  onChangeText={setNotesValue}
                  multiline
                  textAlignVertical="top"
                  placeholder="Adicione notas..."
                />
                <Button title="Salvar" onPress={handleSaveNotes} size="sm" className="mt-2" />
              </View>
            ) : (
              <Text className="text-sand-600 text-sm">
                {item.notes || 'Nenhuma nota adicionada'}
              </Text>
            )}
          </Card>
        </View>

        {/* Options */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sand-900 text-lg font-bold">
              Opções de Produto ({options?.length ?? 0})
            </Text>
            <TouchableOpacity
              onPress={() => setShowOptionForm(true)}
              className="flex-row items-center"
            >
              <Feather name="plus" size={18} color="#C1694F" />
              <Text className="text-terracotta-500 font-medium ml-1 text-sm">Adicionar</Text>
            </TouchableOpacity>
          </View>

          {showOptionForm && (
            <Card className="mb-4">
              <Text className="text-sand-900 font-semibold mb-3">Nova Opção</Text>
              <Input label="Modelo/Nome" placeholder="Ex: Lorenzetti Advanced" value={optionName} onChangeText={setOptionName} />
              <Input label="Marca" placeholder="Ex: Lorenzetti" value={optionBrand} onChangeText={setOptionBrand} />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input label="Preço (R$)" placeholder="0.00" value={optionPrice} onChangeText={setOptionPrice} keyboardType="numeric" />
                </View>
                <View className="flex-1">
                  <Input label="Loja" placeholder="Ex: Leroy Merlin" value={optionStore} onChangeText={setOptionStore} />
                </View>
              </View>
              <Input label="Link URL" placeholder="https://..." value={optionUrl} onChangeText={setOptionUrl} keyboardType="url" />
              <Input label="Observações" placeholder="Notas sobre esta opção" value={optionNotes} onChangeText={setOptionNotes} multiline />
              <View className="mb-4">
                <Text className="text-sand-800 font-medium text-sm mb-2">Avaliação</Text>
                <StarRating rating={optionRating} editable onRate={setOptionRating} />
              </View>
              <View className="flex-row gap-3">
                <Button title="Cancelar" onPress={resetOptionForm} variant="ghost" size="sm" className="flex-1" />
                <Button title="Salvar" onPress={handleAddOption} size="sm" loading={createOption.isPending} className="flex-1" />
              </View>
            </Card>
          )}

          {options?.map((option) => (
            <Card key={option.id} className="mb-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center">
                    {option.is_chosen && (
                      <View className="bg-moss-100 px-2 py-0.5 rounded-full mr-2">
                        <Text className="text-moss-700 text-xs font-medium">Escolhido</Text>
                      </View>
                    )}
                    <Text className="text-sand-900 font-semibold text-base flex-shrink">
                      {option.model_name}
                    </Text>
                  </View>
                  {option.brand && (
                    <Text className="text-sand-500 text-sm mt-0.5">{option.brand}</Text>
                  )}
                </View>
                {option.price !== null && option.price !== undefined && (
                  <Text className="text-terracotta-500 font-bold text-lg">
                    {formatCurrency(Number(option.price))}
                  </Text>
                )}
              </View>

              {option.store && (
                <View className="flex-row items-center mt-2">
                  <Feather name="shopping-bag" size={14} color="#A89270" />
                  <Text className="text-sand-600 text-sm ml-1">{option.store}</Text>
                </View>
              )}

              {option.rating !== null && option.rating !== undefined && (
                <View className="mt-2">
                  <StarRating rating={option.rating} size={16} />
                </View>
              )}

              {option.notes && (
                <Text className="text-sand-500 text-sm mt-2">{option.notes}</Text>
              )}

              {/* Photos */}
              {option.item_option_photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                  {option.item_option_photos.map((photo) => (
                    <Image
                      key={photo.id}
                      source={{ uri: photo.storage_url }}
                      className="w-20 h-20 rounded-lg mr-2"
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              )}

              {/* Action buttons */}
              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-sand-100">
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => handleUploadPhoto(option.id)}
                    className="flex-row items-center"
                    disabled={uploadingPhoto}
                  >
                    <Feather name="camera" size={16} color="#A89270" />
                    <Text className="text-sand-600 text-xs ml-1">Foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleShare(option)}
                    className="flex-row items-center"
                  >
                    <Feather name="share" size={16} color="#A89270" />
                    <Text className="text-sand-600 text-xs ml-1">Enviar</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row gap-3">
                  {!option.is_chosen && (
                    <TouchableOpacity
                      onPress={() => handleChooseOption(option.id)}
                      className="flex-row items-center bg-moss-50 px-3 py-1.5 rounded-full"
                    >
                      <Feather name="check" size={14} color="#5B7553" />
                      <Text className="text-moss-600 text-xs font-medium ml-1">Escolher</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDeleteOption(option.id)}>
                    <Feather name="trash-2" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}

          {(!options || options.length === 0) && !showOptionForm && (
            <EmptyState
              icon="layers"
              title="Nenhuma opção"
              description="Adicione opções de produto para comparar"
              actionLabel="Adicionar Opção"
              onAction={() => setShowOptionForm(true)}
            />
          )}
        </View>

        {/* Comments */}
        <View className="px-4 mt-6">
          <Text className="text-sand-900 text-lg font-bold mb-3">
            Comentários ({comments.length})
          </Text>
          {comments.map((comment) => (
            <View key={comment.id} className="bg-white rounded-xl p-3 mb-2 border border-sand-100">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sand-700 text-xs font-medium">
                  {comment.profiles?.full_name ?? 'Usuário'}
                </Text>
                <Text className="text-sand-400 text-xs">
                  {formatDateTime(comment.created_at)}
                </Text>
              </View>
              <Text className="text-sand-800 text-sm">{comment.message}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Comment input */}
      <View className="px-4 py-3 bg-white border-t border-sand-100">
        <View className="flex-row items-center gap-2">
          <TextInput
            className="flex-1 border border-sand-300 rounded-xl px-4 py-2.5 text-base text-sand-900"
            placeholder="Escreva um comentário..."
            value={newComment}
            onChangeText={setNewComment}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            onPress={handleSendComment}
            disabled={loadingComment || !newComment.trim()}
            className="bg-terracotta-500 w-10 h-10 rounded-full items-center justify-center"
            style={{ opacity: loadingComment || !newComment.trim() ? 0.5 : 1 }}
          >
            <Feather name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
