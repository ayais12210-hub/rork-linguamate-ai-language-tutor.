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
import { AppErrorBoundary } from '@/components/boundaries/AppErrorBoundary';
import { PreferenceProvider } from '@/app/modules/personalisation/profile-store';
import SplashCursor from '@/components/SplashCursor';
import { MonitoringUtils } from '@/lib/monitoring';
import RatingPrompt from '@/components/RatingPrompt';
import NetworkStatusBanner from '@/components/NetworkStatusBanner';
import { OfflineProvider } from '@/modules/offline/OfflineProvider';
import OfflineBanner from '@/components/OfflineBanner';
import { offlineQueue } from '@/modules/offline/offlineQueue';
import { MonitoringProvider } from '@/app/providers/MonitoringProvider';
import { AnalyticsProvider } from '@/app/providers/AnalyticsProvider';
import { initializeRevenueCat } from '@/features/subscriptions/revenuecat';
import '@/src/i18n';

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
    console.log('[RootLayout] Initializing monitoring with user', user?.id);
    MonitoringUtils.initializeAll(user?.id).catch((e) => {
      console.log('[RootLayout] Monitoring init error', e);
    });
    
    // Initialize RevenueCat
    initializeRevenueCat().catch((e) => {
      console.log('[RootLayout] RevenueCat init error', e);
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
    // Hide splash screen after a short delay to ensure app is properly initialized
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('[RootLayout] Failed to hide splash screen:', error);
      }
    };

    // Small delay to ensure all providers are initialized
    const timer = setTimeout(hideSplash, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <MonitoringProvider>
      <AnalyticsProvider>
        <QueryClientProvider client={queryClient}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <OfflineProvider>
              <UserProvider>
                <ChatProvider>
                  <LearningProgressProvider>
                    <AppErrorBoundary>
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
                    </AppErrorBoundary>
                  </LearningProgressProvider>
                </ChatProvider>
              </UserProvider>
            </OfflineProvider>
          </trpc.Provider>
        </QueryClientProvider>
      </AnalyticsProvider>
    </MonitoringProvider>
  );
}