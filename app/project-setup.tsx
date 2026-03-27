import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { useCreateProject, useJoinProject, useProjects } from '../hooks/useProject';
import { Button, Input, Card, LoadingScreen } from '../components/ui';
import { showAlert } from '../utils/alert';

export default function ProjectSetupScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const joinProject = useJoinProject();

  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [projectName, setProjectName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  async function handleCreate() {
    if (!projectName.trim()) {
      showAlert('Erro', 'Digite o nome do projeto');
      return;
    }
    try {
      const project = await createProject.mutateAsync(projectName.trim());
      setActiveProject(project);
      router.replace('/(tabs)');
    } catch (error: any) {
      showAlert('Erro', error.message ?? 'Erro ao criar projeto');
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) {
      showAlert('Erro', 'Digite o código de convite');
      return;
    }
    try {
      const project = await joinProject.mutateAsync(inviteCode.trim());
      setActiveProject(project);
      router.replace('/(tabs)');
    } catch (error: any) {
      showAlert('Erro', error.message ?? 'Erro ao entrar no projeto');
    }
  }

  function selectProject(project: any) {
    setActiveProject(project);
    router.replace('/(tabs)');
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-cream"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Seus Projetos',
          headerStyle: { backgroundColor: '#FAFAF8' },
          headerTintColor: '#33291E',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ marginLeft: 10, marginRight: 8, padding: 10 }}>
              <Feather name="arrow-left" size={24} color="#33291E" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-8 pt-6 pb-8">
          <Text className="text-sand-500 mb-6">
            Selecione um projeto ou crie um novo
          </Text>

          {projects && projects.length > 0 && (
            <View className="mb-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  onPress={() => selectProject(project)}
                  className="mb-3"
                >
                  <View className="flex-row items-center">
                    <View className="bg-terracotta-100 w-12 h-12 rounded-xl items-center justify-center mr-3">
                      <Feather name="home" size={24} color="#C1694F" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sand-900 font-semibold text-base">
                        {project.name}
                      </Text>
                      <Text className="text-sand-500 text-xs mt-0.5">
                        Código: {project.invite_code}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#A89270" />
                  </View>
                </Card>
              ))}
            </View>
          )}

          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => setMode('create')}
              className={`flex-1 p-4 rounded-xl border-2 items-center ${
                mode === 'create' ? 'border-terracotta-500 bg-terracotta-50' : 'border-sand-200 bg-white'
              }`}
            >
              <Feather
                name="plus-circle"
                size={28}
                color={mode === 'create' ? '#C1694F' : '#A89270'}
              />
              <Text
                className={`mt-2 font-medium ${
                  mode === 'create' ? 'text-terracotta-500' : 'text-sand-600'
                }`}
              >
                Novo Projeto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('join')}
              className={`flex-1 p-4 rounded-xl border-2 items-center ${
                mode === 'join' ? 'border-terracotta-500 bg-terracotta-50' : 'border-sand-200 bg-white'
              }`}
            >
              <Feather
                name="user-plus"
                size={28}
                color={mode === 'join' ? '#C1694F' : '#A89270'}
              />
              <Text
                className={`mt-2 font-medium ${
                  mode === 'join' ? 'text-terracotta-500' : 'text-sand-600'
                }`}
              >
                Entrar com Código
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'create' && (
            <View>
              <Input
                label="Nome do projeto"
                placeholder='Ex: "Nossa Casa - Rua X"'
                value={projectName}
                onChangeText={setProjectName}
              />
              <Button
                title="Criar Projeto"
                onPress={handleCreate}
                loading={createProject.isPending}
              />
            </View>
          )}

          {mode === 'join' && (
            <View>
              <Input
                label="Código de convite"
                placeholder="Ex: ABC123"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                maxLength={6}
              />
              <Button
                title="Entrar no Projeto"
                onPress={handleJoin}
                loading={joinProject.isPending}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
