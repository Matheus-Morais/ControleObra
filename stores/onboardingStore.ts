import { Platform } from 'react-native';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

/**
 * Flag "já viu o onboarding" com persistência manual (mesmo padrão de themeStore/
 * projectStore, por incompatibilidade do zustand/persist com Expo web). No web a
 * leitura é síncrona (localStorage); no nativo é assíncrona (SecureStore).
 */
const STORAGE_KEY = 'onboarding-seen';

function readSync(): boolean {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {}
  return false;
}

async function readAsync(): Promise<boolean> {
  try {
    const raw =
      Platform.OS === 'web'
        ? localStorage.getItem(STORAGE_KEY)
        : await SecureStore.getItemAsync(STORAGE_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
}

function write() {
  try {
    if (Platform.OS === 'web') localStorage.setItem(STORAGE_KEY, 'true');
    else SecureStore.setItemAsync(STORAGE_KEY, 'true');
  } catch {}
}

interface OnboardingState {
  seen: boolean;
  hydrated: boolean;
  markSeen: () => void;
  hydrate: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  seen: readSync(),
  hydrated: Platform.OS === 'web',
  markSeen: () => {
    write();
    set({ seen: true });
  },
  hydrate: async () => {
    if (get().hydrated) return;
    const seen = await readAsync();
    set({ seen, hydrated: true });
  },
}));
