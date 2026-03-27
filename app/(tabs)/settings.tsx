import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { signOut } from '../../services/auth';
import { Card } from '../../components/ui';
import { showAlert } from '../../utils/alert';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { activeProject } = useProjectStore();
  const reset = useAuthStore((s) => s.reset);
  const resetProject = useProjectStore((s) => s.reset);

  async function doSignOut() {
    try {
      await signOut();
      reset();
      resetProject();
    } catch {}
  }

  function handleSignOut() {
    showAlert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: doSignOut },
    ]);
  }

  function handleSwitchProject() {
    resetProject();
    router.replace('/project-setup');
  }

  return (
    <ScrollView className="flex-1 bg-cream px-4 pt-4">
      <Text className="text-xl font-bold text-sand-900 mb-6">Ajustes</Text>

      <Card className="mb-4">
        <View className="flex-row items-center">
          <View className="bg-terracotta-100 w-12 h-12 rounded-full items-center justify-center mr-3">
            <Feather name="user" size={24} color="#C1694F" />
          </View>
          <View className="flex-1">
            <Text className="text-sand-900 font-semibold text-base">
              {profile?.full_name ?? user?.email}
            </Text>
            <Text className="text-sand-500 text-sm">{user?.email}</Text>
          </View>
        </View>
      </Card>

      {activeProject && (
        <Card className="mb-4">
          <Text className="text-sand-500 text-xs uppercase font-medium mb-2">
            Projeto Ativo
          </Text>
          <Text className="text-sand-900 font-semibold text-base">
            {activeProject.name}
          </Text>
          <View className="flex-row items-center mt-2">
            <Feather name="key" size={14} color="#A89270" />
            <Text className="text-sand-500 text-sm ml-1.5">
              Código: {activeProject.invite_code}
            </Text>
          </View>
        </Card>
      )}

      <TouchableOpacity
        onPress={handleSwitchProject}
        className="flex-row items-center bg-white rounded-xl p-4 border border-sand-100 mb-3"
      >
        <Feather name="repeat" size={20} color="#5B7553" />
        <Text className="text-sand-800 font-medium ml-3 flex-1">Trocar Projeto</Text>
        <Feather name="chevron-right" size={18} color="#A89270" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSignOut}
        className="flex-row items-center bg-white rounded-xl p-4 border border-red-100 mb-3"
      >
        <Feather name="log-out" size={20} color="#EF4444" />
        <Text className="text-red-500 font-medium ml-3 flex-1">Sair da conta</Text>
        <Feather name="chevron-right" size={18} color="#A89270" />
      </TouchableOpacity>
    </ScrollView>
  );
}
