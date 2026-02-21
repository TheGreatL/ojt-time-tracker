// Import gesture handler first (required by React Navigation)
import 'react-native-gesture-handler';

// Main App Entry Point

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ProfileProvider } from './src/context/ProfileContext';
import { ToastProvider } from './src/context/ToastContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/database';
import { colors } from './src/styles/theme';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import NetInfo from '@react-native-community/netinfo';
import { processAvatarQueue } from './src/utils/uploadQueue';
import { processOfflineQueue } from './src/utils/offlineQueue';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    initializeApp();

    // Listen for network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('[App] Online detected, processing queues...');
        processAvatarQueue();
        processOfflineQueue();
      }
    });

    return () => unsubscribe();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      await initDatabase();
      // Try processing queues on startup if online
      const netState = await NetInfo.fetch();
      if (netState.isConnected && netState.isInternetReachable) {
        processOfflineQueue();
        processAvatarQueue();
      }
      setIsReady(true);
    } catch (error) {
      console.error('Error initializing app:', error);
      // Still set ready to true to show error screen
      setIsReady(true);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ProfileProvider>
      <ToastProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </ToastProvider>
    </ProfileProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
