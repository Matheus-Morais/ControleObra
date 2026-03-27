import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { signIn } from '../../services/auth';
import { Button, Input } from '../../components/ui';
import { showAlert } from '../../utils/alert';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      showAlert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error: any) {
      showAlert('Erro ao entrar', error.message ?? 'Tente novamente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-cream"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-8 py-12">
          <View className="items-center mb-10">
            <View className="bg-terracotta-500 w-16 h-16 rounded-2xl items-center justify-center mb-4">
              <Feather name="home" size={32} color="#fff" />
            </View>
            <Text className="text-3xl font-bold text-sand-900">
              ControleObra
            </Text>
            <Text className="text-sand-500 text-base mt-1">
              Gerencie sua obra com facilidade
            </Text>
          </View>

          <Input
            label="E-mail"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Senha"
            placeholder="Sua senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          <Button
            title="Entrar"
            onPress={handleLogin}
            loading={loading}
            className="mt-2"
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-sand-500">Não tem conta? </Text>
            <Link href="/(auth)/register" asChild>
              <Text className="text-terracotta-500 font-semibold">
                Cadastre-se
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
