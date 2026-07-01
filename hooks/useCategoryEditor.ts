import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_ROOMS } from '../constants/rooms';
import type { Item } from '../types';

function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

interface UseCategoryEditorParams {
  currentCategory: string | null | undefined;
  roomName: string | undefined;
  projectItems: Item[] | undefined;
  onSave: (category: string) => Promise<void>;
}

/**
 * Encapsula todo o estado e a lógica de edição de categoria de um item:
 * categorias sugeridas (por cômodo), categorias já usadas no projeto,
 * categorias customizadas, busca e persistência.
 */
export function useCategoryEditor({
  currentCategory,
  roomName,
  projectItems,
  onSave,
}: UseCategoryEditorParams) {
  const [visible, setVisible] = useState(false);
  const [categoryValue, setCategoryValue] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const suggestedCategories = useMemo(() => {
    if (!roomName) return ['Geral'];
    const normalizedRoom = normalizeLabel(roomName);
    const exact = DEFAULT_ROOMS.find((dr) => normalizeLabel(dr.name) === normalizedRoom);
    if (exact?.categories?.length) return exact.categories;
    const partial = DEFAULT_ROOMS.find((dr) => {
      const normalized = normalizeLabel(dr.name);
      return normalized.includes(normalizedRoom) || normalizedRoom.includes(normalized);
    });
    return partial?.categories?.length ? partial.categories : ['Geral'];
  }, [roomName]);

  const projectCategories = useMemo(
    () =>
      [...new Set((projectItems ?? []).map((i) => (i.category || '').trim()).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [projectItems]
  );

  const availableCategories = useMemo(
    () => [...new Set([...suggestedCategories, ...projectCategories, ...customCategories])],
    [suggestedCategories, projectCategories, customCategories]
  );

  const filteredCategories = useMemo(() => {
    const term = normalizeLabel(categorySearch);
    if (!term) return availableCategories;
    return availableCategories.filter((c) => normalizeLabel(c).includes(term));
  }, [categorySearch, availableCategories]);

  const open = useCallback(() => {
    setCategoryValue(currentCategory || 'Geral');
    setVisible(true);
  }, [currentCategory]);

  const close = useCallback(() => {
    setVisible(false);
    setCategorySearch('');
    setNewCategoryName('');
  }, []);

  const addCustomCategory = useCallback(() => {
    const value = newCategoryName.trim();
    if (!value) return;
    const exists = availableCategories.some((cat) => normalizeLabel(cat) === normalizeLabel(value));
    if (!exists) setCustomCategories((prev) => [...prev, value]);
    setCategoryValue(value);
    setNewCategoryName('');
  }, [newCategoryName, availableCategories]);

  const save = useCallback(async () => {
    try {
      await onSave(categoryValue.trim() || 'Geral');
      close();
    } catch {
      // onSave já tratou/alertou; mantém o modal aberto para nova tentativa.
    }
  }, [categoryValue, onSave, close]);

  return {
    visible,
    open,
    close,
    categoryValue,
    setCategoryValue,
    categorySearch,
    setCategorySearch,
    filteredCategories,
    newCategoryName,
    setNewCategoryName,
    addCustomCategory,
    save,
  };
}
