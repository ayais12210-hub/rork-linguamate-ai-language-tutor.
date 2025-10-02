import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <UserProvider>
          <ChatProvider>
            <LearningProgressProvider>
              <ErrorBoundary>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <MonitoringInitializer />
                  <RootLayoutNav />
                  <RatingPrompt />
                </GestureHandlerRootView>
                <SplashCursor />
              </ErrorBoundary>
            </LearningProgressProvider>
          </ChatProvider>
        </UserProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}