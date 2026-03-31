import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProjectStore } from '../../stores/projectStore';
import { useRealtimeSubscription } from '../../hooks/useRealtime';

export default function TabLayout() {
  const activeProject = useProjectStore((s) => s.activeProject);
  useRealtimeSubscription(activeProject?.id);
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#FAFAF8' },
        headerTintColor: '#33291E',
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: '#FAFAF8',
          borderTopColor: '#EDE5D6',
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          marginBottom: 2,
        },
        tabBarActiveTintColor: '#C1694F',
        tabBarInactiveTintColor: '#A89270',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
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
