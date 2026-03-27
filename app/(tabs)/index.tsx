import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { useRooms } from '../../hooks/useRooms';
import { useProjectItems } from '../../hooks/useItems';
import { Card, ProgressBar, EmptyState, LoadingScreen, StatusChip } from '../../components/ui';
import { formatCurrency, formatPercentage, formatDateTime } from '../../utils/format';
import { getProjectTotalSpent } from '../../services/transactions';
import type { Item, ItemStatus } from '../../types';

function StatusSummaryCard({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  return (
    <View className="bg-white rounded-xl p-3 border border-sand-100 flex-1" style={{ minWidth: '45%' }}>
      <View className="flex-row items-center mb-1">
        <View className="w-8 h-8 rounded-lg items-center justify-center mr-2" style={{ backgroundColor: color + '20' }}>
          <Feather name={icon as any} size={16} color={color} />
        </View>
        <Text className="text-sand-500 text-xs">{label}</Text>
      </View>
      <Text className="text-sand-900 text-2xl font-bold">{count}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const activeProject = useProjectStore((s) => s.activeProject);
  const profile = useAuthStore((s) => s.profile);
  const { data: rooms } = useRooms(activeProject?.id);
  const { data: items, isLoading } = useProjectItems(activeProject?.id);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (activeProject) {
      getProjectTotalSpent(activeProject.id).then(setTotalSpent).catch(() => {});
    }
  }, [activeProject]);

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

  if (isLoading) return <LoadingScreen />;

  return (
    <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ paddingBottom: 30 }}>
      <View className="px-4 pt-6 pb-2">
        <Text className="text-sand-500 text-base">
          Olá, {profile?.full_name?.split(' ')[0] ?? 'Usuário'}
        </Text>
        <Text className="text-sand-900 text-xl font-bold">{activeProject.name}</Text>
      </View>

      {/* Financial summary */}
      <View className="px-4 mt-4">
        <Card>
          <Text className="text-sand-700 font-semibold mb-3">Resumo Financeiro</Text>
          <View className="flex-row justify-between mb-2">
            <View>
              <Text className="text-sand-500 text-xs">Orçamento Total</Text>
              <Text className="text-sand-900 text-xl font-bold">
                {formatCurrency(Number(activeProject.total_budget) || stats.totalBudget)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-sand-500 text-xs">Total Gasto</Text>
              <Text className="text-terracotta-500 text-xl font-bold">
                {formatCurrency(totalSpent)}
              </Text>
            </View>
          </View>
          <ProgressBar
            progress={formatPercentage(totalSpent, Number(activeProject.total_budget) || stats.totalBudget || 1)}
            color="bg-terracotta-500"
            className="mt-2"
          />
        </Card>
      </View>

      {/* Overall progress */}
      <View className="px-4 mt-4">
        <Card>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sand-700 font-semibold">Progresso Geral</Text>
            <Text className="text-sand-900 font-bold text-lg">{overallProgress}%</Text>
          </View>
          <ProgressBar progress={overallProgress} color="bg-moss-500" showLabel={false} />
          <Text className="text-sand-500 text-xs mt-2">
            {stats.purchased + stats.installed} de {stats.total} itens concluídos
          </Text>
        </Card>
      </View>

      {/* Status cards */}
      <View className="px-4 mt-4 flex-row flex-wrap" style={{ gap: 10 }}>
        <StatusSummaryCard icon="search" label="Pesquisando" count={stats.researching} color="#3B82F6" />
        <StatusSummaryCard icon="check-circle" label="Decididos" count={stats.decided} color="#F59E0B" />
        <StatusSummaryCard icon="shopping-cart" label="Comprados" count={stats.purchased} color="#8B5CF6" />
        <StatusSummaryCard icon="check-square" label="Instalados" count={stats.installed} color="#10B981" />
      </View>

      {/* Budget by room chart */}
      {roomBudgets.length > 0 && (
        <View className="px-4 mt-6">
          <Text className="text-sand-900 font-bold text-base mb-3">Gastos por Cômodo</Text>
          {roomBudgets.slice(0, 6).map((room) => {
            const maxBudget = Math.max(...roomBudgets.map((r) => r.budget), 1);
            const barWidth = formatPercentage(room.budget, maxBudget);
            return (
              <View key={room.id} className="mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sand-700 text-sm">{room.name}</Text>
                  <Text className="text-sand-500 text-xs">{formatCurrency(room.budget)}</Text>
                </View>
                <View className="bg-sand-100 rounded-full h-3 overflow-hidden">
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
          <Text className="text-sand-900 font-bold text-base mb-3">Atividade Recente</Text>
          {recentItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-white rounded-xl p-3 mb-2 border border-sand-100 flex-row items-center"
              onPress={() => {
                router.push(`/project/${activeProject.id}/room/${item.room_id}/item/${item.id}`);
              }}
            >
              <View className="flex-1 mr-3">
                <Text className="text-sand-900 font-medium text-sm">{item.name}</Text>
                <Text className="text-sand-400 text-xs mt-0.5">
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
