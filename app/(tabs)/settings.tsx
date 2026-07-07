import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUpdateProject } from '../../hooks/useProject';
import { useTheme } from '../../hooks/useTheme';
import type { ThemePreference } from '../../stores/themeStore';
import { signOut } from '../../services/auth';
import { Card } from '../../components/ui';
import { showAlert } from '../../utils/alert';

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'light', label: 'Claro', icon: 'sun' },
  { key: 'dark', label: 'Escuro', icon: 'moon' },
  { key: 'system', label: 'Sistema', icon: 'smartphone' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, profile } = useAuthStore();
  const { activeProject } = useProjectStore();
  const resetProject = useProjectStore((s) => s.reset);
  const updateProject = useUpdateProject();
  const { colors, preference, setPreference } = useTheme();

  const [editingName, setEditingName] = useState(false);
  const [projectName, setProjectName] = useState('');

  async function doSignOut() {
    try {
      await signOut();
    } catch {
      // Se falhar no servidor, limpa localmente mesmo assim
    } finally {
      useAuthStore.getState().reset();
      resetProject();
      queryClient.clear();
    }
  }

  function handleSignOut() {
    showAlert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: doSignOut },
    ]);
  }

  function handleSwitchProject() {
    queryClient.clear();
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
    } catch (error: unknown) {
      showAlert('Erro', error instanceof Error ? error.message : 'Erro ao renomear projeto');
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-cream dark:bg-sand-900 px-4 pt-4"
      contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top }}
    >
      <Text className="text-xl font-bold text-sand-900 dark:text-sand-50 mb-6">Ajustes</Text>

      <Card className="mb-4">
        <View className="flex-row items-center">
          <View className="bg-terracotta-100 dark:bg-terracotta-900 w-12 h-12 rounded-full items-center justify-center mr-3">
            <Feather name="user" size={24} color="#C1694F" />
          </View>
          <View className="flex-1">
            <Text className="text-sand-900 dark:text-sand-50 font-semibold text-base">
              {profile?.full_name ?? user?.email}
            </Text>
            <Text className="text-sand-500 dark:text-sand-400 text-sm">{user?.email}</Text>
          </View>
        </View>
      </Card>

      {/* Aparência / tema */}
      <Card className="mb-4">
        <Text className="text-sand-500 dark:text-sand-400 text-xs uppercase font-medium mb-3">
          Aparência
        </Text>
        <View className="flex-row gap-2">
          {THEME_OPTIONS.map((opt) => {
            const active = preference === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setPreference(opt.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Tema ${opt.label}`}
                className={`flex-1 items-center py-3 rounded-xl border ${
                  active
                    ? 'bg-terracotta-50 dark:bg-terracotta-900 border-terracotta-400'
                    : 'bg-white dark:bg-sand-800 border-sand-200 dark:border-sand-700'
                }`}
              >
                <Feather
                  name={opt.icon}
                  size={20}
                  color={active ? colors.accent : colors.textMuted}
                />
                <Text
                  className={`text-xs font-medium mt-1 ${
                    active
                      ? 'text-terracotta-600 dark:text-terracotta-200'
                      : 'text-sand-600 dark:text-sand-300'
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {activeProject && (
        <Card className="mb-4">
          <Text className="text-sand-500 dark:text-sand-400 text-xs uppercase font-medium mb-2">
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
                placeholderTextColor={colors.placeholder}
                style={{
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 16,
                  color: colors.textPrimary,
                  backgroundColor: colors.inputBg,
                  marginBottom: 10,
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setEditingName(false)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveName}
                  disabled={!projectName.trim() || projectName.trim() === activeProject.name || updateProject.isPending}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: projectName.trim() && projectName.trim() !== activeProject.name ? colors.accent : colors.borderStrong,
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
              accessibilityRole="button"
              accessibilityLabel="Renomear projeto"
            >
              <Text className="text-sand-900 dark:text-sand-50 font-semibold text-base flex-1">
                {activeProject.name}
              </Text>
              <View
                style={{
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Feather name="edit-2" size={12} color={colors.textSecondary} />
                <Text style={{ marginLeft: 4, fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>
                  Editar
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <View className="flex-row items-center mt-2">
            <Feather name="key" size={14} color="#A89270" />
            <Text className="text-sand-500 dark:text-sand-400 text-sm ml-1.5">
              Código: {activeProject.invite_code}
            </Text>
          </View>
        </Card>
      )}

      <TouchableOpacity
        onPress={handleSwitchProject}
        className="flex-row items-center bg-white dark:bg-sand-800 rounded-xl p-4 border border-sand-100 dark:border-sand-700 mb-3"
        accessibilityRole="button"
        accessibilityLabel="Trocar projeto"
      >
        <Feather name="repeat" size={20} color="#5B7553" />
        <Text className="text-sand-800 dark:text-sand-100 font-medium ml-3 flex-1">Trocar Projeto</Text>
        <Feather name="chevron-right" size={18} color="#A89270" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSignOut}
        className="flex-row items-center bg-white dark:bg-sand-800 rounded-xl p-4 border border-red-100 dark:border-red-900 mb-3"
        accessibilityRole="button"
        accessibilityLabel="Sair da conta"
      >
        <Feather name="log-out" size={20} color="#EF4444" />
        <Text className="text-red-500 font-medium ml-3 flex-1">Sair da conta</Text>
        <Feather name="chevron-right" size={18} color="#A89270" />
      </TouchableOpacity>
    </ScrollView>
  );
}
