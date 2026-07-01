import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Card, Input, Button, StarRating } from '../ui';

export interface OptionFormValues {
  model_name: string;
  brand: string | null;
  price: number | null;
  store: string | null;
  url: string | null;
  notes: string | null;
  rating: number | null;
}

interface OptionFormProps {
  onCancel: () => void;
  /** Deve lançar em caso de erro para o formulário preservar os campos. */
  onSubmit: (values: OptionFormValues) => Promise<void>;
  loading?: boolean;
}

/** Formulário de criação de opção de produto, com estado próprio dos campos. */
export function OptionForm({ onCancel, onSubmit, loading }: OptionFormProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);

  function reset() {
    setName('');
    setBrand('');
    setPrice('');
    setStore('');
    setUrl('');
    setNotes('');
    setRating(0);
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    try {
      await onSubmit({
        model_name: name.trim(),
        brand: brand.trim() || null,
        price: price ? parseFloat(price) : null,
        store: store.trim() || null,
        url: url.trim() || null,
        notes: notes.trim() || null,
        rating: rating || null,
      });
      reset();
    } catch {
      // O chamador já exibiu o erro; mantém os campos preenchidos.
    }
  }

  return (
    <Card className="mb-4">
      <Text className="text-sand-900 dark:text-sand-50 font-semibold mb-3">Nova Opção</Text>
      <Input label="Modelo/Nome" placeholder="Ex: Lorenzetti Advanced" value={name} onChangeText={setName} />
      <Input label="Marca" placeholder="Ex: Lorenzetti" value={brand} onChangeText={setBrand} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Input label="Preço (R$)" placeholder="0.00" value={price} onChangeText={setPrice} keyboardType="numeric" />
        </View>
        <View className="flex-1">
          <Input label="Loja" placeholder="Ex: Leroy Merlin" value={store} onChangeText={setStore} />
        </View>
      </View>
      <Input label="Link URL" placeholder="https://..." value={url} onChangeText={setUrl} keyboardType="url" />
      <Input label="Observações" placeholder="Notas sobre esta opção" value={notes} onChangeText={setNotes} multiline />
      <View className="mb-4">
        <Text className="text-sand-800 dark:text-sand-200 font-medium text-sm mb-2">Avaliação</Text>
        <StarRating rating={rating} editable onRate={setRating} />
      </View>
      <View className="flex-row gap-3">
        <Button title="Cancelar" onPress={onCancel} variant="ghost" size="sm" className="flex-1" />
        <Button title="Salvar" onPress={handleSubmit} size="sm" loading={loading} className="flex-1" />
      </View>
    </Card>
  );
}
