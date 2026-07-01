import { useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { useThemeStore } from '../stores/themeStore';
import { darkColors, lightColors, type ThemeColors } from '../constants/theme';

/**
 * Sincroniza a preferência de tema persistida com o NativeWind.
 * Deve ser chamado uma única vez, no layout raiz.
 */
export function useApplyThemePreference() {
  const preference = useThemeStore((s) => s.preference);
  const { setColorScheme } = useColorScheme();
  useEffect(() => {
    setColorScheme(preference);
  }, [preference, setColorScheme]);
}

export interface UseThemeResult {
  colorScheme: 'light' | 'dark';
  isDark: boolean;
  colors: ThemeColors;
  preference: ReturnType<typeof useThemeStore.getState>['preference'];
  setPreference: ReturnType<typeof useThemeStore.getState>['setPreference'];
}

/** Cor resolvida + tokens semânticos do tema atual. */
export function useTheme(): UseThemeResult {
  const { colorScheme } = useColorScheme();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const isDark = colorScheme === 'dark';
  return {
    colorScheme: isDark ? 'dark' : 'light',
    isDark,
    colors: isDark ? darkColors : lightColors,
    preference,
    setPreference,
  };
}
