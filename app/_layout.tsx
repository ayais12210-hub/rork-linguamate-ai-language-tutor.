import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient, OnlineStatusSync } from '@/lib/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UserProvider, useUser } from '@/hooks/user-store';
import { ChatProvider } from '@/hooks/chat-store';
import { LearningProgressProvider } from '@/state/learning-progress';
import { trpc, trpcClient } from '@/lib/trpc';
import ErrorBoundary from '@/app/providers/ErrorBoundary';
import { PreferenceProvider } from '@/app/modules/personalisation/profile-store';
import SplashCursor from '@/components/SplashCursor';
import { MonitoringUtils } from '@/lib/monitoring';
import RatingPrompt from '@/components/RatingPrompt';
import NetworkStatusBanner from '@/components/NetworkStatusBanner';
import { OfflineProvider } from '@/modules/offline/OfflineProvider';
import OfflineBanner from '@/components/OfflineBanner';
import { offlineQueue } from '@/modules/offline/offlineQueue';
import { initializeSentry } from '@/lib/sentry';
import { initializeLogger } from '@/lib/log';
import { featureFlags } from '@/lib/flags';
import NetworkBoundary from '@/components/NetworkBoundary';

SplashScreen.preventAutoHideAsync();

const queryClient = createQueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="landing" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="terms" options={{ title: 'Terms & Conditions' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

function MonitoringInitializer() {
  const { user } = useUser();
  useEffect(() => {
    const initializeAll = async () => {
      try {
        // Initialize feature flags first
        await featureFlags.initialize();
        
        // Initialize logger
        await initializeLogger(user?.id);
        
        // Initialize Sentry
        await initializeSentry({
          environment: process.env.NODE_ENV || 'development',
          release: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
        });
        
        // Initialize existing monitoring
        console.log('[RootLayout] Initializing monitoring with user', user?.id);
        await MonitoringUtils.initializeAll(user?.id);
        
        console.log('[RootLayout] All monitoring systems initialized');
      } catch (error) {
        console.error('[RootLayout] Failed to initialize monitoring:', error);
      }
    };
    
    initializeAll();
    
    return () => {
      MonitoringUtils.cleanup();
    };
  }, [user?.id]);
  return null;
}

function OfflineInitializer() {
  useEffect(() => {
    console.log('[RootLayout] Initializing offline queue');
    offlineQueue.initialize().catch((e) => {
      console.log('[RootLayout] Offline queue init error', e);
    });
  }, []);
  return null;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <OfflineProvider>
          <UserProvider>
            <ChatProvider>
              <LearningProgressProvider>
                <ErrorBoundary>
                  <NetworkBoundary>
                    <GestureHandlerRootView style={{ flex: 1 }} testID="root-gesture-container">
                      <MonitoringInitializer />
                      <OfflineInitializer />
                      <OnlineStatusSync />
                      <PreferenceProvider>
                        <RootLayoutNav />
                      </PreferenceProvider>
                      <RatingPrompt />
                      <NetworkStatusBanner />
                      <OfflineBanner />
                    </GestureHandlerRootView>
                    <SplashCursor />
                  </NetworkBoundary>
                </ErrorBoundary>
              </LearningProgressProvider>
            </ChatProvider>
          </UserProvider>
        </OfflineProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}