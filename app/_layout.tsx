import '../global.css';
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { getProfile } from '../services/auth';
import { LoadingScreen, ErrorBoundary } from '../components/ui';

function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as any;
  const code = Number(e.code ?? e.status ?? 0);
  if (code === 401 || code === 403) return true;
  const msg = (e.message ?? '').toLowerCase();
  return (
    msg.includes('jwt expired') ||
    msg.includes('invalid refresh token') ||
    msg.includes('not authenticated') ||
    msg.includes('invalid claim')
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      networkMode: 'always',
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (isAuthError(error)) return false;
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
    mutations: {
      retry: false,
      networkMode: 'always',
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authError = useAuthStore((s) => s.authError);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (authError && !session) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAF8',
          padding: 32,
        }}
      >
        <Feather name="wifi-off" size={48} color="#EF4444" />
        <Text
          style={{
            color: '#33291E',
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center',
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Erro de conexão
        </Text>
        <Text
          style={{
            color: '#8B7355',
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          Não foi possível verificar sua sessão. Verifique sua conexão.
        </Text>
        <TouchableOpacity
          onPress={() => {
            useAuthStore.getState().setAuthError(null);
            useAuthStore.getState().setLoading(true);
            initializeAuth();
          }}
          style={{
            backgroundColor: '#C1694F',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
            Tentar novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

function forceCleanSession() {
  supabase.auth.signOut().catch(() => {});
  useAuthStore.getState().setSession(null);
  useAuthStore.getState().setProfile(null);
  useAuthStore.getState().setLoading(false);
  useAuthStore.getState().setAuthError(null);
  useProjectStore.getState().reset();
  queryClient.clear();
}

queryClient.getQueryCache().config.onError = (error) => {
  if (isAuthError(error)) {
    console.warn('Auth error em query, forçando sign out:', (error as any)?.message);
    forceCleanSession();
  }
};

async function initializeAuth() {
  const { setSession, setProfile, setLoading, setAuthError } = useAuthStore.getState();

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.warn('Erro ao restaurar sessão:', error.message);
      setSession(null);
      setAuthError(error.message);
      setLoading(false);
      return;
    }

    if (!session) {
      setSession(null);
      setLoading(false);
      return;
    }

    setSession(session);
    setAuthError(null);
    setLoading(false);

    if (session.user) {
      getProfile(session.user.id)
        .then(setProfile)
        .catch((err) => console.warn('Erro ao carregar perfil:', err?.message));
    }
  } catch (err: any) {
    console.warn('initAuth falhou:', err?.message);
    setSession(null);
    setAuthError(err?.message ?? 'Falha na inicialização');
    setLoading(false);
  }
}

export default function RootLayout() {
  const initDoneRef = useRef(false);

  useEffect(() => {
    initializeAuth().then(() => {
      initDoneRef.current = true;
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!initDoneRef.current) return;

      const { setSession, setProfile } = useAuthStore.getState();

      if (event === 'TOKEN_REFRESHED' && !session) {
        forceCleanSession();
        return;
      }

      if (event === 'SIGNED_OUT') {
        forceCleanSession();
        return;
      }

      setSession(session);
      useAuthStore.getState().setAuthError(null);

      if (session?.user) {
        getProfile(session.user.id)
          .then(setProfile)
          .catch((err) => console.warn('Erro ao atualizar perfil:', err?.message));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <AuthGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="project-setup" />
              <Stack.Screen
                name="project"
                options={{ headerShown: false }}
              />
            </Stack>
          </AuthGuard>
        </ErrorBoundary>
        <StatusBar style="dark" />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
