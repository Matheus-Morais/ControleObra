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

const AUTH_TIMEOUT_MS = 8000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      retryDelay: 1000,
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
        console.warn('Auth timeout: forçando sign out após', AUTH_TIMEOUT_MS, 'ms');
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setProfile(null);
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

export default function RootLayout() {
  const { setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.warn('Erro na sessão:', error.message);
          forceCleanSession(setSession, setProfile, setLoading);
          return;
        }

        if (!session) {
          setSession(null);
          setLoading(false);
          return;
        }

        setSession(session);
        if (session.user) {
          getProfile(session.user.id)
            .then(setProfile)
            .catch((err) => {
              console.warn('Erro ao carregar perfil:', err?.message);
            });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('getSession falhou:', err?.message);
        forceCleanSession(setSession, setProfile, setLoading);
      });

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
