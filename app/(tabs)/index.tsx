import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { useRooms } from '../../hooks/useRooms';
import { useProjectItems } from '../../hooks/useItems';
import { useProjectTotalSpent } from '../../hooks/useTransactions';
import { useLoadingTimeout } from '../../hooks/useLoadingTimeout';
import { Card, ProgressBar, EmptyState, LoadingScreen, StatusChip, Button } from '../../components/ui';
import { formatCurrency, formatPercentage, formatDateTime } from '../../utils/format';
import type { Item, ItemStatus } from '../../types';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeProject = useProjectStore((s) => s.activeProject);
  const profile = useAuthStore((s) => s.profile);
  const { data: rooms } = useRooms(activeProject?.id);
  const { data: items, isLoading, isError, refetch } = useProjectItems(activeProject?.id);
  const { data: totalSpent = 0 } = useProjectTotalSpent(activeProject?.id);
  const loadingTimeout = useLoadingTimeout(isLoading);

  const stats = useMemo(() => {
    if (!items) return { researching: 0, decided: 0, purchased: 0, installed: 0, total: 0, totalBudget: 0 };
    return {
      researching: items.filter((i) => i.status === 'researching').length,
      decided: items.filter((i) => i.status === 'decided').length,
      purchased: items.filter((i) => i.status === 'purchased').length,
      installed: items.filter((i) => i.status === 'installed').length,
      total: items.length,
      totalBudget: items.reduce((s, i) => s + Number(i.budget || 0), 0),
    };
  }, [items]);

  const overallProgress = formatPercentage(stats.purchased + stats.installed, stats.total);
  const doneCount = stats.purchased + stats.installed;
  const totalBudget = Number(activeProject?.total_budget) || stats.totalBudget;
  const remaining = Math.max(0, totalBudget - totalSpent);
  const overBudget = totalBudget > 0 && totalSpent > totalBudget;

  // Funil da obra: as 4 etapas na ordem do fluxo (Pesquisando -> Instalado).
  const stages = [
    { key: 'researching', label: 'Pesquisando', color: '#3B82F6', count: stats.researching },
    { key: 'decided', label: 'Decididos', color: '#F59E0B', count: stats.decided },
    { key: 'purchased', label: 'Comprados', color: '#8B5CF6', count: stats.purchased },
    { key: 'installed', label: 'Instalados', color: '#10B981', count: stats.installed },
  ];

  const recentItems = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);
  }, [items]);

  const roomBudgets = useMemo(() => {
    if (!items || !rooms) return [];
    return rooms.map((room) => {
      const roomItems = items.filter((i) => i.room_id === room.id);
      const budget = roomItems.reduce((s, i) => s + Number(i.budget || 0), 0);
      const spent = roomItems.reduce((s, i) => s + Number(i.actual_price || 0), 0);
      return { ...room, budget, spent, itemCount: roomItems.length };
    }).filter((r) => r.itemCount > 0).sort((a, b) => b.budget - a.budget);
  }, [items, rooms]);

  if (!activeProject) {
    return (
      <EmptyState
        icon="home"
        title="Bem-vindo ao ControleObra"
        description="Selecione ou crie um projeto para começar"
        actionLabel="Configurar Projeto"
        onAction={() => router.push('/project-setup')}
      />
    );
  }

  if (isLoading && !loadingTimeout) return <LoadingScreen />;

  if (isError || loadingTimeout) {
    return (
      <View className="flex-1 items-center justify-center bg-cream dark:bg-sand-900 p-8">
        <Feather name="alert-circle" size={40} color="#EF4444" />
        <Text className="text-sand-800 dark:text-sand-100 text-lg font-semibold text-center mt-4 mb-2">
          {loadingTimeout ? 'Conexão lenta' : 'Erro ao carregar dados'}
        </Text>
        <Text className="text-sand-500 dark:text-sand-400 text-sm text-center mb-6">Verifique sua conexão e tente novamente</Text>
        <Button title="Tentar novamente" onPress={() => refetch()} size="sm" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream dark:bg-sand-900" contentContainerStyle={{ paddingBottom: 30, paddingTop: insets.top }}>
      <View className="px-4 pt-6 pb-2">
        <Text className="text-sand-500 dark:text-sand-400 text-base">
          Olá, {profile?.full_name?.split(' ')[0] ?? 'Usuário'}
        </Text>
        <Text className="text-sand-900 dark:text-sand-50 text-xl font-bold">{activeProject.name}</Text>
      </View>

      {/* Financial summary */}
      <View className="px-4 mt-4">
        <Card>
          <Text className="text-sand-700 dark:text-sand-200 font-semibold mb-3">Resumo Financeiro</Text>
          <View className="flex-row justify-between mb-2">
            <View>
              <Text className="text-sand-500 dark:text-sand-400 text-xs">Orçamento Total</Text>
              <Text className="text-sand-900 dark:text-sand-50 text-xl font-bold">
                {formatCurrency(Number(activeProject.total_budget) || stats.totalBudget)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-sand-500 dark:text-sand-400 text-xs">Total Gasto</Text>
              <Text className="text-terracotta-500 text-xl font-bold">
                {formatCurrency(totalSpent)}
              </Text>
            </View>
          </View>
          <ProgressBar
            progress={formatPercentage(totalSpent, totalBudget || 1)}
            color={overBudget ? 'bg-red-500' : 'bg-terracotta-500'}
            className="mt-2"
          />
          <View className="flex-row justify-between mt-2">
            <Text className="text-sand-500 dark:text-sand-400 text-xs">
              Restante: {formatCurrency(remaining)}
            </Text>
            <Text className={`text-xs font-medium ${overBudget ? 'text-red-500' : 'text-moss-500'}`}>
              {overBudget ? 'Acima do orçamento' : 'Dentro do orçamento'}
            </Text>
          </View>
        </Card>
      </View>

      {/* Overall progress */}
      <View className="px-4 mt-4">
        <Card>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sand-700 dark:text-sand-200 font-semibold">Progresso Geral</Text>
            <Text className="text-sand-900 dark:text-sand-50 font-bold text-lg">{overallProgress}%</Text>
          </View>
          <ProgressBar progress={overallProgress} color="bg-moss-500" showLabel={false} />
          <Text className="text-sand-500 dark:text-sand-400 text-xs mt-2">
            {stats.total === 0
              ? 'Adicione itens para acompanhar o progresso'
              : doneCount === 0
                ? `${stats.total} itens catalogados — comece marcando os que já decidiu`
                : `${doneCount} de ${stats.total} itens concluídos`}
          </Text>
        </Card>
      </View>

      {/* Etapas dos itens (funil da obra) */}
      <View className="px-4 mt-4">
        <Card>
          <Text className="text-sand-700 dark:text-sand-200 font-semibold mb-3">Etapas dos itens</Text>
          {stats.total > 0 ? (
            <>
              <View className="flex-row h-2.5 rounded-full overflow-hidden bg-sand-200 dark:bg-sand-700 mb-4">
                {stages.map((s) =>
                  s.count > 0 ? (
                    <View
                      key={s.key}
                      style={{ width: `${(s.count / stats.total) * 100}%`, backgroundColor: s.color }}
                    />
                  ) : null
                )}
              </View>
              <View className="flex-row flex-wrap" style={{ rowGap: 10 }}>
                {stages.map((s) => (
                  <View key={s.key} className="flex-row items-center" style={{ width: '50%', paddingRight: 16 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color, marginRight: 8 }} />
                    <Text className="text-sand-600 dark:text-sand-300 text-xs flex-1" numberOfLines={1}>
                      {s.label}
                    </Text>
                    <Text className="text-sand-900 dark:text-sand-50 text-sm font-bold">{s.count}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text className="text-sand-500 dark:text-sand-400 text-sm">Nenhum item cadastrado ainda</Text>
          )}
        </Card>
      </View>

      {/* Budget by room chart */}
      {roomBudgets.length > 0 && (
        <View className="px-4 mt-6">
          <Text className="text-sand-900 dark:text-sand-50 font-bold text-base mb-3">Gastos por Cômodo</Text>
          {roomBudgets.slice(0, 6).map((room) => {
            const maxBudget = Math.max(...roomBudgets.map((r) => r.budget), 1);
            const barWidth = formatPercentage(room.budget, maxBudget);
            return (
              <View key={room.id} className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sand-700 dark:text-sand-200 text-sm">{room.name}</Text>
                  <Text className="text-sand-500 dark:text-sand-400 text-xs">{formatCurrency(room.budget)}</Text>
                </View>
                <View className="bg-sand-100 dark:bg-sand-800 rounded-full h-3 overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${barWidth}%`, backgroundColor: room.color }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Recent activity */}
      {recentItems.length > 0 && (
        <View className="px-4 mt-6">
          <Text className="text-sand-900 dark:text-sand-50 font-bold text-base mb-3">Atividade Recente</Text>
          {recentItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Abrir item ${item.name}`}
              className="bg-white dark:bg-sand-800 rounded-xl p-3 mb-2 border border-sand-100 dark:border-sand-700 flex-row items-center"
              onPress={() => {
                router.push(`/project/${activeProject.id}/room/${item.room_id}/item/${item.id}`);
              }}
            >
              <View className="flex-1 mr-3">
                <Text className="text-sand-900 dark:text-sand-50 font-medium text-sm">{item.name}</Text>
                <Text className="text-sand-400 dark:text-sand-500 text-xs mt-0.5">
                  {item.category} · {formatDateTime(item.updated_at)}
                </Text>
              </View>
              <StatusChip status={item.status} size="sm" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
