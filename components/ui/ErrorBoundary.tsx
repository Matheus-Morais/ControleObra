import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
          <Feather name="alert-triangle" size={48} color="#EF4444" />
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
            Algo deu errado
          </Text>
          <Text
            style={{
              color: '#8B7355',
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            Ocorreu um erro inesperado. Tente novamente.
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
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

    return this.props.children;
  }
}
