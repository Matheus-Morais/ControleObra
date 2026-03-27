import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { signUp } from '../../services/auth';
import { Button, Input } from '../../components/ui';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
      Alert.alert(
        'Conta criada!',
        'Verifique seu e-mail para confirmar o cadastro.'
      );
    } catch (error: any) {
      Alert.alert('Erro ao cadastrar', error.message ?? 'Tente novamente');
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
            <Text className="text-2xl font-bold text-sand-900">
              Criar Conta
            </Text>
            <Text className="text-sand-500 text-base mt-1">
              Comece a gerenciar sua obra
            </Text>
          </View>

          <Input
            label="Nome completo"
            placeholder="Seu nome"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

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
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Input
            label="Confirmar senha"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Button
            title="Criar conta"
            onPress={handleRegister}
            loading={loading}
            className="mt-2"
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-sand-500">Já tem conta? </Text>
            <Link href="/(auth)/login" asChild>
              <Text className="text-terracotta-500 font-semibold">
                Entrar
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
