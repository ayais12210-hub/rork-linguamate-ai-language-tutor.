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
import ErrorBoundary from '@/components/ErrorBoundary';
import SplashCursor from '@/components/SplashCursor';
import { MonitoringUtils } from '@/lib/monitoring';
import RatingPrompt from '@/components/RatingPrompt';
import NetworkStatusBanner from '@/components/NetworkStatusBanner';
import { OfflineProvider } from '@/modules/offline/OfflineProvider';
import OfflineBanner from '@/components/OfflineBanner';
import { offlineQueue } from '@/modules/offline/offlineQueue';
import LiquidEther from '@/components/LiquidEther';

SplashScreen.preventAutoHideAsync();

const queryClient = createQueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
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
    console.log('[RootLayout] Initializing monitoring with user', user?.id);
    MonitoringUtils.initializeAll(user?.id).catch((e) => {
      console.log('[RootLayout] Monitoring init error', e);
    });
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
                  <LiquidEther
                    colors={['#5227FF', '#FF9FFC', '#B19EEF']}
                    mouseForce={20}
                    cursorSize={100}
                    isViscous={false}
                    viscous={30}
                    iterationsViscous={32}
                    iterationsPoisson={32}
                    resolution={0.5}
                    isBounce={false}
                    autoDemo={true}
                    autoSpeed={0.5}
                    autoIntensity={2.2}
                    takeoverDuration={0.25}
                    autoResumeDelay={3000}
                    autoRampDuration={0.6}
                  />
                  <GestureHandlerRootView style={{ flex: 1 }} testID="root-gesture-container">
                    <MonitoringInitializer />
                    <OfflineInitializer />
                    <OnlineStatusSync />
                    <RootLayoutNav />
                    <RatingPrompt />
                    <NetworkStatusBanner />
                    <OfflineBanner />
                  </GestureHandlerRootView>
                  <SplashCursor />
                </ErrorBoundary>
              </LearningProgressProvider>
            </ChatProvider>
          </UserProvider>
        </OfflineProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}