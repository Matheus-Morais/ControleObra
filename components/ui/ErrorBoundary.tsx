import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

/** UI de fallback temável (componente funcional para poder usar useTheme). */
function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        padding: 32,
      }}
    >
      <Feather name="alert-triangle" size={48} color={colors.danger} />
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 18,
          fontWeight: '600',
          textAlign: 'center',
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        Algo deu errado
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
        Ocorreu um erro inesperado. Tente novamente.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={{ backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Tentar novamente"
      >
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error.message, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}
