import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUpdateProject } from '../../hooks/useProject';
import { signOut } from '../../services/auth';
import { Card } from '../../components/ui';
import { showAlert } from '../../utils/alert';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { activeProject } = useProjectStore();
  const reset = useAuthStore((s) => s.reset);
  const resetProject = useProjectStore((s) => s.reset);
  const updateProject = useUpdateProject();

  const [editingName, setEditingName] = useState(false);
  const [projectName, setProjectName] = useState('');

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

  function handleStartEditName() {
    if (!activeProject) return;
    setProjectName(activeProject.name);
    setEditingName(true);
  }

  async function handleSaveName() {
    const name = projectName.trim();
    if (!name || !activeProject) return;
    if (name === activeProject.name) {
      setEditingName(false);
      return;
    }
    try {
      await updateProject.mutateAsync({
        projectId: activeProject.id,
        updates: { name },
      });
      setEditingName(false);
    } catch (error: any) {
      showAlert('Erro', error?.message ?? 'Erro ao renomear projeto');
    }
  }

  return (
    <ScrollView className="flex-1 bg-cream px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
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

          {editingName ? (
            <View>
              <TextInput
                autoFocus
                value={projectName}
                onChangeText={setProjectName}
                onSubmitEditing={handleSaveName}
                returnKeyType="done"
                placeholder="Nome do projeto"
                placeholderTextColor="#9CA3AF"
                style={{
                  borderWidth: 1,
                  borderColor: '#D6CDB9',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 16,
                  color: '#33291E',
                  marginBottom: 10,
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setEditingName(false)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: '#8B7355', fontWeight: '500' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveName}
                  disabled={!projectName.trim() || projectName.trim() === activeProject.name || updateProject.isPending}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: projectName.trim() && projectName.trim() !== activeProject.name ? '#B85C38' : '#D6CDB9',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    {updateProject.isPending ? 'Salvando...' : 'Salvar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleStartEditName}
              style={{ flexDirection: 'row', alignItems: 'center' }}
              activeOpacity={0.7}
            >
              <Text className="text-sand-900 font-semibold text-base flex-1">
                {activeProject.name}
              </Text>
              <View style={{
                backgroundColor: '#F5F0E8', borderRadius: 6,
                paddingHorizontal: 8, paddingVertical: 4,
                flexDirection: 'row', alignItems: 'center',
              }}>
                <Feather name="edit-2" size={12} color="#8B7355" />
                <Text style={{ marginLeft: 4, fontSize: 12, color: '#8B7355', fontWeight: '500' }}>Editar</Text>
              </View>
            </TouchableOpacity>
          )}

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
