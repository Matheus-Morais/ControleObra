import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProjectStore } from '../../stores/projectStore';
import { useRealtimeSubscription } from '../../hooks/useRealtime';
import { useTheme } from '../../hooks/useTheme';

export default function TabLayout() {
  const activeProject = useProjectStore((s) => s.activeProject);
  useRealtimeSubscription(activeProject?.id);
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        // As abas usam título grande no próprio corpo (padrão "large title"),
        // então o header nativo redundante fica oculto — mais espaço e hierarquia.
        headerShown: false,
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.headerBg,
          borderTopColor: colors.border,
          // Barra mais alta com respiro embaixo: sobe os ícones/labels (mais
          // confortável no celular, acima do home indicator) mantendo ~52px de
          // área útil para ícone + rótulo (sem cortar o texto). Sem marginBottom,
          // que deixava uma faixa/linha visível abaixo das tabs.
          height: 70 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 12,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          paddingVertical: isAndroid ? 2 : 0,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          lineHeight: 14,
          marginTop: isAndroid ? -1 : 0,
          paddingBottom: isAndroid ? 1 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Cômodos',
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: 'Itens',
          tabBarIcon: ({ color, size }) => (
            <Feather name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="financial"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color, size }) => (
            <Feather name="dollar-sign" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
