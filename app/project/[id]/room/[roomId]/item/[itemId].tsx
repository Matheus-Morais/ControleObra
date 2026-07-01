import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useItem, useProjectItems } from '../../../../../../hooks/useItems';
import { useRooms } from '../../../../../../hooks/useRooms';
import { useItemOptions } from '../../../../../../hooks/useItemOptions';
import { useComments } from '../../../../../../hooks/useComments';
import { useCategoryEditor } from '../../../../../../hooks/useCategoryEditor';
import { useItemActions } from '../../../../../../hooks/useItemActions';
import { useProjectStore } from '../../../../../../stores/projectStore';
import { useTheme } from '../../../../../../hooks/useTheme';
import { LoadingScreen, EmptyState } from '../../../../../../components/ui';
import {
  ItemHeaderCard,
  EditableTextCard,
  OptionCard,
  OptionForm,
  CommentList,
  CommentComposer,
  CategoryPickerModal,
} from '../../../../../../components/item';
import { formatCurrency } from '../../../../../../utils/format';

function BackButton({ onPress, color }: { onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ marginRight: 8, marginLeft: 10, padding: 10 }}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
    >
      <Feather name="arrow-left" size={24} color={color} />
    </TouchableOpacity>
  );
}

export default function ItemDetailScreen() {
  const { itemId: itemIdParam, roomId } = useLocalSearchParams<{
    id: string;
    roomId: string;
    itemId: string;
  }>();
  const itemId = Array.isArray(itemIdParam) ? itemIdParam[0] : itemIdParam;
  const router = useRouter();
  const { colors } = useTheme();
  const activeProject = useProjectStore((s) => s.activeProject);

  const { data: rooms } = useRooms(activeProject?.id);
  const { data: projectItems } = useProjectItems(activeProject?.id);
  const { data: item, isLoading, isError } = useItem(itemId);
  const { data: options } = useItemOptions(itemId);
  const { data: comments = [] } = useComments(itemId);

  const actions = useItemActions(itemId, item);

  const [showOptionForm, setShowOptionForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  const room = rooms?.find((r) => r.id === roomId);
  const categoryEditor = useCategoryEditor({
    currentCategory: item?.category,
    roomName: room?.name,
    projectItems,
    onSave: actions.saveCategory,
  });

  if (isLoading) return <LoadingScreen />;

  if (isError || !item) {
    return (
      <View className="flex-1 bg-cream dark:bg-sand-900">
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Erro',
            headerStyle: { backgroundColor: colors.headerBg },
            headerTintColor: colors.textPrimary,
            headerLeft: () => <BackButton onPress={() => router.back()} color={colors.textPrimary} />,
          }}
        />
        <EmptyState
          icon="alert-circle"
          title="Item não encontrado"
          description="Não foi possível carregar este item. Verifique sua conexão e tente novamente."
          actionLabel="Voltar"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-cream dark:bg-sand-900"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: item.name,
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.textPrimary,
          headerLeft: () => <BackButton onPress={() => router.back()} color={colors.textPrimary} />,
        }}
      />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <ItemHeaderCard
          item={item}
          onEditCategory={categoryEditor.open}
          onStatusChange={actions.changeStatus}
        />

        <EditableTextCard
          title="Orçamento"
          editing={editingBudget}
          onStartEdit={() => {
            setBudgetValue(String(item.budget || 0));
            setEditingBudget(true);
          }}
          value={budgetValue}
          onChangeValue={setBudgetValue}
          onSave={async () => {
            if (await actions.saveBudget(parseFloat(budgetValue) || 0)) setEditingBudget(false);
          }}
          keyboardType="numeric"
          placeholder="0.00"
          displayContent={
            <>
              <Text className="text-2xl font-bold text-sand-900 mt-1">
                {formatCurrency(Number(item.budget) || 0)}
              </Text>
              {item.actual_price !== null && item.actual_price !== undefined && (
                <Text className="text-moss-500 text-sm mt-1">
                  Preço real: {formatCurrency(Number(item.actual_price))}
                </Text>
              )}
            </>
          }
        />

        <EditableTextCard
          title="Notas"
          editing={editingNotes}
          onStartEdit={() => {
            setNotesValue(item.notes || '');
            setEditingNotes(true);
          }}
          value={notesValue}
          onChangeValue={setNotesValue}
          onSave={async () => {
            if (await actions.saveNotes(notesValue || null)) setEditingNotes(false);
          }}
          multiline
          placeholder="Adicione notas..."
          displayContent={
            <Text className="text-sand-600 text-sm">{item.notes || 'Nenhuma nota adicionada'}</Text>
          }
        />

        {/* Options */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sand-900 dark:text-sand-50 text-lg font-bold">
              Opções de Produto ({options?.length ?? 0})
            </Text>
            <TouchableOpacity
              onPress={() => setShowOptionForm(true)}
              className="flex-row items-center"
              accessibilityRole="button"
              accessibilityLabel="Adicionar opção de produto"
            >
              <Feather name="plus" size={18} color="#C1694F" />
              <Text className="text-terracotta-500 font-medium ml-1 text-sm">Adicionar</Text>
            </TouchableOpacity>
          </View>

          {showOptionForm && (
            <OptionForm
              onCancel={() => setShowOptionForm(false)}
              onSubmit={async (values) => {
                await actions.addOption(values);
                setShowOptionForm(false);
              }}
              loading={actions.creatingOption}
            />
          )}

          {options?.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              uploadingPhoto={actions.uploadingPhoto}
              onChoose={actions.chooseOption}
              onDelete={actions.deleteOption}
              onUploadPhoto={actions.uploadOptionPhoto}
              onShare={actions.share}
            />
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

        <CommentList comments={comments} />
      </ScrollView>

      <CategoryPickerModal
        visible={categoryEditor.visible}
        onClose={categoryEditor.close}
        categoryValue={categoryEditor.categoryValue}
        onChangeCategoryValue={categoryEditor.setCategoryValue}
        categorySearch={categoryEditor.categorySearch}
        onChangeCategorySearch={categoryEditor.setCategorySearch}
        filteredCategories={categoryEditor.filteredCategories}
        newCategoryName={categoryEditor.newCategoryName}
        onChangeNewCategoryName={categoryEditor.setNewCategoryName}
        onAddCustomCategory={categoryEditor.addCustomCategory}
        onSave={categoryEditor.save}
        saving={actions.savingItem}
      />

      <CommentComposer
        value={newComment}
        onChangeText={setNewComment}
        onSend={async () => {
          if (await actions.sendComment(newComment)) setNewComment('');
        }}
        sending={actions.sendingComment}
      />
    </KeyboardAvoidingView>
  );
}
