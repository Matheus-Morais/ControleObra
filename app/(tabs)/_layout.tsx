import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProjectStore } from '../../stores/projectStore';
import { useRealtimeSubscription } from '../../hooks/useRealtime';

export default function TabLayout() {
  const activeProject = useProjectStore((s) => s.activeProject);
  useRealtimeSubscription(activeProject?.id);
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#FAFAF8' },
        headerTintColor: '#33291E',
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: '#FAFAF8',
          borderTopColor: '#EDE5D6',
          height: (isAndroid ? 62 : 56) + insets.bottom,
          paddingBottom: insets.bottom + (isAndroid ? 2 : 0),
          paddingTop: isAndroid ? 4 : 8,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          paddingVertical: isAndroid ? 2 : 0,
        },
        tabBarActiveTintColor: '#C1694F',
        tabBarInactiveTintColor: '#A89270',
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
