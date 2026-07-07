import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Button } from '../ui';
import { useTheme } from '../../hooks/useTheme';

interface CategoryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  categoryValue: string;
  onChangeCategoryValue: (value: string) => void;
  categorySearch: string;
  onChangeCategorySearch: (value: string) => void;
  filteredCategories: string[];
  newCategoryName: string;
  onChangeNewCategoryName: (value: string) => void;
  onAddCustomCategory: () => void;
  onSave: () => void;
  saving: boolean;
}

/** Bottom-sheet de seleção/edição de categoria do item. */
export function CategoryPickerModal({
  visible,
  onClose,
  categoryValue,
  onChangeCategoryValue,
  categorySearch,
  onChangeCategorySearch,
  filteredCategories,
  newCategoryName,
  onChangeNewCategoryName,
  onAddCustomCategory,
  onSave,
  saving,
}: CategoryPickerModalProps) {
  const { colors } = useTheme();

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
    backgroundColor: colors.inputBg,
  } as const;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 20,
            maxHeight: '85%',
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong }} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>
            Editar categoria
          </Text>

          <TextInput
            value={categorySearch}
            onChangeText={onChangeCategorySearch}
            placeholder="Pesquisar categoria sugerida"
            placeholderTextColor={colors.placeholder}
            style={{ ...inputStyle, marginBottom: 10 }}
          />

          <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ paddingBottom: 8 }}>
            {filteredCategories.map((category) => {
              const selected = categoryValue === category;
              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => onChangeCategoryValue(category)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    marginBottom: 6,
                    backgroundColor: selected ? '#DDE9D8' : colors.inputBg,
                    borderWidth: 1,
                    borderColor: selected ? '#5B7553' : colors.border,
                  }}
                >
                  <Text style={{ color: selected ? '#33291E' : colors.textPrimary, fontWeight: '500', fontSize: 14 }}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {filteredCategories.length === 0 && (
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginVertical: 12 }}>
                Nenhuma categoria sugerida encontrada.
              </Text>
            )}
          </ScrollView>

          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13, marginBottom: 6, marginTop: 4 }}>
            Categoria selecionada
          </Text>
          <TextInput
            value={categoryValue}
            onChangeText={onChangeCategoryValue}
            placeholder="Digite uma categoria"
            placeholderTextColor={colors.placeholder}
            style={{ ...inputStyle, marginBottom: 12 }}
          />

          <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13, marginBottom: 6 }}>
            Criar nova categoria
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TextInput
              value={newCategoryName}
              onChangeText={onChangeNewCategoryName}
              placeholder="Nova categoria"
              placeholderTextColor={colors.placeholder}
              style={{ ...inputStyle, flex: 1 }}
            />
            <TouchableOpacity
              onPress={onAddCustomCategory}
              disabled={!newCategoryName.trim()}
              accessibilityRole="button"
              accessibilityLabel="Adicionar nova categoria"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: newCategoryName.trim() ? colors.accent : colors.borderStrong,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Cancelar" onPress={onClose} variant="ghost" size="sm" className="flex-1" />
            <Button title="Salvar" onPress={onSave} size="sm" className="flex-1" loading={saving} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
