import React, { type ReactNode, useCallback, useEffect } from 'react';
import { SharedErrorBoundary, Button } from './SharedErrorBoundary';
import * as Updates from 'expo-updates';
import { SplashScreen } from 'expo-router/build/exports';
import { Platform, View } from 'react-native';

type ErrorBoundaryState = { hasError: boolean; error: unknown | null };

const DeviceErrorBoundary = () => {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  const handleReload = useCallback(async () => {
    if (Platform.OS === 'web') {
      window.location.reload();
      return;
    }

    Updates.reloadAsync().catch((error) => {
      // no-op, we don't want to show an error here
    });
  }, []);
  return (
    <SharedErrorBoundary
      isOpen
      description="It looks like an error occurred while trying to use your app."
    >
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button color="primary" onPress={handleReload}>
          Restart app
        </Button>
      </View>
    </SharedErrorBoundary>
  );
};

export class DeviceErrorBoundaryWrapper extends React.Component<
  {
    children: ReactNode;
  },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    // Log error to console for debugging
    console.error('Error caught by DeviceErrorBoundary:', error, errorInfo);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return <DeviceErrorBoundary />;
    }
    return this.props.children;
  }
}
