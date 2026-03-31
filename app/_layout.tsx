import '../global.css';
import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { getProfile } from '../services/auth';
import { LoadingScreen } from '../components/ui';

const AUTH_TIMEOUT_MS = 10000;

function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as any;
  const msg = (e.message ?? e.msg ?? '').toLowerCase();
  const code = e.code ?? e.status ?? 0;
  return (
    code === 401 || code === 403 ||
    msg.includes('jwt') || msg.includes('token') ||
    msg.includes('refresh') || msg.includes('not authenticated') ||
    msg.includes('invalid claim')
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      networkMode: 'always',
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
  const { session, isLoading } = useAuthStore();
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);
  const segments = useSegments();
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        console.warn('Auth timeout: encerrando estado de loading após', AUTH_TIMEOUT_MS, 'ms');
        setLoading(false);
      }, AUTH_TIMEOUT_MS);
    } else if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading]);

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

  return <>{children}</>;
}

function forceCleanSession(
  setSession: (s: null) => void,
  setProfile: (p: null) => void,
  setLoading: (l: boolean) => void,
) {
  supabase.auth.signOut().catch(() => {});
  setSession(null);
  setProfile(null);
  setLoading(false);
  useProjectStore.getState().reset();
  queryClient.clear();
}

queryClient.getQueryCache().config.onError = (error) => {
  if (isAuthError(error)) {
    console.warn('Auth error em query, forçando sign out:', (error as any)?.message);
    const store = useAuthStore.getState();
    forceCleanSession(store.setSession, store.setProfile, store.setLoading);
  }
};

export default function RootLayout() {
  const { setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          if (sessionError) console.warn('Erro na sessão:', sessionError.message);
          setSession(null);
          setLoading(false);
          return;
        }

        // Validate token server-side (triggers refresh if expired)
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.warn('Sessão inválida:', userError?.message ?? 'user null');
          forceCleanSession(setSession, setProfile, setLoading);
          return;
        }

        // Session is valid — get the fresh session after potential refresh
        const { data: { session: freshSession } } = await supabase.auth.getSession();
        setSession(freshSession ?? session);

        getProfile(user.id)
          .then(setProfile)
          .catch((err) => console.warn('Erro ao carregar perfil:', err?.message));

        setLoading(false);
      } catch (err: any) {
        console.warn('initAuth falhou:', err?.message);
        forceCleanSession(setSession, setProfile, setLoading);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        forceCleanSession(setSession, setProfile, setLoading);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        useProjectStore.getState().reset();
        queryClient.clear();
        return;
      }

      setSession(session);
      if (session?.user) {
        try {
          const profile = await getProfile(session.user.id);
          setProfile(profile);
        } catch (err: any) {
          console.warn('Erro ao atualizar perfil:', err?.message);
        }
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
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
        <StatusBar style="dark" />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
