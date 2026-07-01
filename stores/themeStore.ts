import { Platform } from 'react-native';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme-preference';

function readSync(): ThemePreference | null {
  try {
    if (Platform.OS === 'web') {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : null;
    }
  } catch {}
  return null;
}

async function readAsync(): Promise<ThemePreference | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? localStorage.getItem(STORAGE_KEY)
        : await SecureStore.getItemAsync(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : null;
  } catch {
    return null;
  }
}

function write(pref: ThemePreference) {
  try {
    if (Platform.OS === 'web') localStorage.setItem(STORAGE_KEY, pref);
    else SecureStore.setItemAsync(STORAGE_KEY, pref);
  } catch {}
}

interface ThemeState {
  preference: ThemePreference;
  hydrated: boolean;
  setPreference: (pref: ThemePreference) => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: readSync() ?? 'system',
  hydrated: Platform.OS === 'web',
  setPreference: (preference) => {
    write(preference);
    set({ preference });
  },
  hydrate: async () => {
    if (get().hydrated) return;
    const pref = await readAsync();
    if (pref) set({ preference: pref });
    set({ hydrated: true });
  },
}));
