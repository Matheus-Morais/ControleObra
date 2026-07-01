/**
 * Tokens semânticos de cor por tema. Usados nos pontos que dependem de `style`
 * inline (TextInput, headers do Stack, modais, ErrorBoundary), onde as variantes
 * `dark:` do NativeWind não alcançam. Os elementos com `className` usam as
 * variantes `dark:` diretamente (ver componentes de UI).
 */
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  placeholder: string;
  inputBg: string;
  inputBorder: string;
  headerBg: string;
  overlay: string;
  accent: string;
  danger: string;
}

export const lightColors: ThemeColors = {
  background: '#FAFAF8', // cream
  surface: '#FFFFFF',
  surfaceAlt: '#F5F0E8', // sand-50
  border: '#EDE5D6', // sand-100
  borderStrong: '#D6CDB9',
  textPrimary: '#33291E', // sand-900
  textSecondary: '#6E5B42', // sand-700
  textMuted: '#A89270', // sand-500
  placeholder: '#9CA3AF',
  inputBg: '#FFFFFF',
  inputBorder: '#D6CDB9',
  headerBg: '#FAFAF8',
  overlay: 'rgba(0,0,0,0.35)',
  accent: '#C1694F', // terracotta-500
  danger: '#EF4444',
};

export const darkColors: ThemeColors = {
  background: '#1F1810',
  surface: '#33291E', // sand-900
  surfaceAlt: '#50412F', // sand-800
  border: '#50412F', // sand-800
  borderStrong: '#6E5B42', // sand-700
  textPrimary: '#F5F0E8', // sand-50
  textSecondary: '#D9CAB0', // sand-300
  textMuted: '#A89270', // sand-500
  placeholder: '#8C7658', // sand-600
  inputBg: '#3A2E22',
  inputBorder: '#6E5B42',
  headerBg: '#1F1810',
  overlay: 'rgba(0,0,0,0.6)',
  accent: '#CC785C', // terracotta-400 (mais brilhante no escuro)
  danger: '#F87171',
};
