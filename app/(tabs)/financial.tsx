import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { useProjectItems } from '../../hooks/useItems';
import { useRooms } from '../../hooks/useRooms';
import { Card, Button, Input, EmptyState, ProgressBar, LoadingScreen } from '../../components/ui';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/format';
import { showAlert } from '../../utils/alert';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  getProjectTotalSpent,
} from '../../services/transactions';
import type { Transaction } from '../../types';
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function FinancialScreen() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const user = useAuthStore((s) => s.user);
  const { data: items } = useProjectItems(activeProject?.id);
  const { data: rooms } = useRooms(activeProject?.id);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    if (!activeProject) {
      setLoading(false);
      return;
    }
    setLoadError(false);
    setLoading(true);
    try {
      const [txns, spent] = await Promise.all([
        getTransactions(activeProject.id),
        getProjectTotalSpent(activeProject.id),
      ]);
      setTransactions(txns);
      setTotalSpent(spent);
    } catch (error: any) {
      setLoadError(true);
      showAlert('Erro', error?.message ?? 'Não foi possível carregar os dados financeiros');
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalBudget = items?.reduce((s, i) => s + Number(i.budget || 0), 0) ?? 0;

  const roomBreakdown = rooms?.map((room) => {
    const roomItems = (items ?? []).filter((i) => i.room_id === room.id);
    const budget = roomItems.reduce((s, i) => s + Number(i.budget || 0), 0);
    const spent = roomItems.reduce((s, i) => s + Number(i.actual_price || 0), 0);
    return { name: room.name, color: room.color, budget, spent };
  }).filter((r) => r.budget > 0) ?? [];

  const handleAddTransaction = useCallback(async () => {
    if (!amount.trim() || !activeProject) return;
    try {
      await createTransaction({
        project_id: activeProject.id,
        item_id: null,
        amount: parseFloat(amount),
        description: description.trim() || null,
        paid_at: new Date().toISOString(),
        notes: notes.trim() || null,
        created_by: user?.id ?? null,
      });
      setAmount('');
      setDescription('');
      setNotes('');
      setShowAddForm(false);
      loadData();
    } catch (error: any) {
      showAlert('Erro', error.message);
    }
  }, [amount, description, notes, activeProject, user]);

  const handleDeleteTransaction = useCallback(
    (txnId: string) => {
      showAlert('Remover pagamento', 'Tem certeza?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(txnId);
              loadData();
            } catch (error: any) {
              showAlert('Erro', error?.message ?? 'Não foi possível remover o pagamento');
            }
          },
        },
      ]);
    },
    [loadData]
  );

  const handleExportPDF = useCallback(async () => {
    if (!activeProject) return;

    if (Platform.OS === 'web') {
      const html = `<html><head><style>
        body { font-family: sans-serif; padding: 20px; }
        h1 { color: #C1694F; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #F5F0E8; }
        .total { font-weight: bold; font-size: 18px; }
      </style></head><body>
        <h1>ControleObra - ${activeProject.name}</h1>
        <p>Relatório gerado em ${formatDate(new Date().toISOString())}</p>
        <h2>Resumo</h2>
        <p class="total">Orçamento: R$ ${totalBudget.toFixed(2)}</p>
        <p class="total">Gasto: R$ ${totalSpent.toFixed(2)}</p>
        <h2>Por Cômodo</h2>
        <table>
          <tr><th>Cômodo</th><th>Orçamento</th><th>Gasto</th></tr>
          ${roomBreakdown.map((r) => `<tr><td>${r.name}</td><td>R$ ${r.budget.toFixed(2)}</td><td>R$ ${r.spent.toFixed(2)}</td></tr>`).join('')}
        </table>
        <h2>Pagamentos</h2>
        <table>
          <tr><th>Data</th><th>Descrição</th><th>Valor</th></tr>
          ${transactions.map((t) => `<tr><td>${formatDate(t.paid_at)}</td><td>${t.description ?? '-'}</td><td>R$ ${Number(t.amount).toFixed(2)}</td></tr>`).join('')}
        </table>
      </body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); w.print(); }
      return;
    }

    const html = `<html><head><style>
      body { font-family: sans-serif; padding: 20px; }
      h1 { color: #C1694F; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #F5F0E8; }
      .total { font-weight: bold; font-size: 18px; }
    </style></head><body>
      <h1>ControleObra - ${activeProject.name}</h1>
      <p>Relatório gerado em ${formatDate(new Date().toISOString())}</p>
      <h2>Resumo</h2>
      <p class="total">Orçamento: R$ ${totalBudget.toFixed(2)}</p>
      <p class="total">Gasto: R$ ${totalSpent.toFixed(2)}</p>
      <h2>Por Cômodo</h2>
      <table>
        <tr><th>Cômodo</th><th>Orçamento</th><th>Gasto</th></tr>
        ${roomBreakdown.map((r) => `<tr><td>${r.name}</td><td>R$ ${r.budget.toFixed(2)}</td><td>R$ ${r.spent.toFixed(2)}</td></tr>`).join('')}
      </table>
      <h2>Pagamentos</h2>
      <table>
        <tr><th>Data</th><th>Descrição</th><th>Valor</th></tr>
        ${transactions.map((t) => `<tr><td>${formatDate(t.paid_at)}</td><td>${t.description ?? '-'}</td><td>R$ ${Number(t.amount).toFixed(2)}</td></tr>`).join('')}
      </table>
    </body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error: any) {
      showAlert('Erro', 'Não foi possível gerar o PDF');
    }
  }, [activeProject, totalBudget, totalSpent, roomBreakdown, transactions]);

  if (!activeProject) {
    return <EmptyState icon="dollar-sign" title="Nenhum projeto selecionado" />;
  }

  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (!loading) { setLoadingTimeout(false); return; }
    const t = setTimeout(() => setLoadingTimeout(true), 15000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !loadingTimeout) return <LoadingScreen />;

  if (loadError || loadingTimeout) {
    return (
      <View className="flex-1 items-center justify-center bg-cream p-8">
        <Feather name="alert-circle" size={40} color="#EF4444" />
        <Text className="text-sand-800 text-lg font-semibold text-center mt-4 mb-2">
          {loadingTimeout ? 'Conexão lenta' : 'Erro ao carregar dados'}
        </Text>
        <Text className="text-sand-500 text-sm text-center mb-6">Verifique sua conexão e tente novamente</Text>
        <Button title="Tentar novamente" onPress={() => { setLoadingTimeout(false); loadData(); }} size="sm" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ paddingBottom: 30 }}>
      <View className="px-4 pt-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-sand-900">Financeiro</Text>
          <TouchableOpacity
            onPress={handleExportPDF}
            className="flex-row items-center bg-terracotta-50 px-3 py-2 rounded-lg"
          >
            <Feather name="download" size={16} color="#C1694F" />
            <Text className="text-terracotta-500 font-medium text-sm ml-1">PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <Card className="mb-4">
          <View className="flex-row justify-between mb-3">
            <View>
              <Text className="text-sand-500 text-xs">Orçamento Total</Text>
              <Text className="text-sand-900 text-2xl font-bold">{formatCurrency(totalBudget)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sand-500 text-xs">Total Gasto</Text>
              <Text className="text-terracotta-500 text-2xl font-bold">{formatCurrency(totalSpent)}</Text>
            </View>
          </View>
          <ProgressBar
            progress={formatPercentage(totalSpent, totalBudget || 1)}
            color={totalSpent > totalBudget ? 'bg-red-500' : 'bg-terracotta-500'}
          />
          <View className="flex-row justify-between mt-2">
            <Text className="text-sand-500 text-xs">
              Restante: {formatCurrency(Math.max(0, totalBudget - totalSpent))}
            </Text>
            <Text className={`text-xs font-medium ${totalSpent > totalBudget ? 'text-red-500' : 'text-moss-500'}`}>
              {totalSpent > totalBudget ? 'Acima do orçamento!' : 'Dentro do orçamento'}
            </Text>
          </View>
        </Card>

        {/* Room breakdown */}
        {roomBreakdown.length > 0 && (
          <View className="mb-6">
            <Text className="text-sand-900 font-bold text-base mb-3">Por Cômodo</Text>
            {roomBreakdown.map((room) => (
              <Card key={room.name} className="mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: room.color }}
                    />
                    <Text className="text-sand-800 text-sm font-medium">{room.name}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sand-900 text-sm font-semibold">
                      {formatCurrency(room.budget)}
                    </Text>
                    {room.spent > 0 && (
                      <Text className="text-sand-500 text-xs">
                        Gasto: {formatCurrency(room.spent)}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Transactions */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sand-900 font-bold text-base">Pagamentos</Text>
          <TouchableOpacity onPress={() => setShowAddForm(true)} className="flex-row items-center">
            <Feather name="plus" size={18} color="#C1694F" />
            <Text className="text-terracotta-500 font-medium text-sm ml-1">Adicionar</Text>
          </TouchableOpacity>
        </View>

        {showAddForm && (
          <Card className="mb-4">
            <Input label="Valor (R$)" placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <Input label="Descrição" placeholder="Ex: Compra de piso" value={description} onChangeText={setDescription} />
            <Input label="Notas" placeholder="Observações opcionais" value={notes} onChangeText={setNotes} />
            <View className="flex-row gap-3">
              <Button title="Cancelar" onPress={() => setShowAddForm(false)} variant="ghost" size="sm" className="flex-1" />
              <Button title="Registrar" onPress={handleAddTransaction} size="sm" className="flex-1" />
            </View>
          </Card>
        )}

        {transactions.length === 0 ? (
          <View className="py-8">
            <Text className="text-sand-500 text-center">Nenhum pagamento registrado</Text>
          </View>
        ) : (
          transactions.map((txn) => (
            <Card key={txn.id} className="mb-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sand-900 font-medium text-sm">
                    {txn.description ?? 'Pagamento'}
                  </Text>
                  <Text className="text-sand-400 text-xs mt-0.5">
                    {formatDate(txn.paid_at)}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-terracotta-500 font-bold text-base mr-3">
                    {formatCurrency(Number(txn.amount))}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteTransaction(txn.id)}>
                    <Feather name="trash-2" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}
