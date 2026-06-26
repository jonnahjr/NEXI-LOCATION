import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <ScrollView style={styles.errorBox}>
            <Text style={styles.errorText}>
              {this.state.error?.name}: {this.state.error?.message}
            </Text>
            <Text style={styles.stackText}>
              {this.state.error?.stack}
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Tap to Reload</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E1A',
    padding: 24,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { color: '#F9FAFB', fontSize: 20, fontWeight: '800', marginBottom: 16 },
  errorBox: {
    backgroundColor: '#1A2236',
    borderRadius: 12,
    padding: 16,
    maxHeight: 200,
    width: '100%',
    marginBottom: 24,
  },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  stackText: { color: '#9CA3AF', fontSize: 11, fontFamily: 'monospace', lineHeight: 16 },
  button: {
    backgroundColor: '#FAA330',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
