import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingScreen from '@/components/OnboardingScreen';
import LanguageSetupScreen from '@/components/LanguageSetupScreen';
import { useUser } from '@/hooks/user-store';
import { useSafeNavigation } from '@/src/polyfills/logbox-state-fix';

export default function IndexScreen() {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showLanguageSetup, setShowLanguageSetup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user, isLoading: userLoading } = useUser();
  const isMountedRef = useRef<boolean>(true);
  const { safeNavigate } = useSafeNavigation();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        if (!user.onboardingCompleted) {
          if (isMountedRef.current) {
            setShowOnboarding(true);
          }
        } else if (!user.selectedLanguage || !user.nativeLanguage) {
          if (isMountedRef.current) {
            setShowLanguageSetup(true);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        if (isMountedRef.current) {
          setShowOnboarding(true);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    if (!userLoading) {
      checkOnboardingStatus();
    }
  }, [user.onboardingCompleted, user.selectedLanguage, user.nativeLanguage, userLoading]);

  useEffect(() => {
    if (!userLoading && !isLoading && isMountedRef.current) {
      if (
        user.onboardingCompleted &&
        user.selectedLanguage &&
        user.nativeLanguage
      ) {
        safeNavigate(() => router.replace('/(tabs)/chat'));
      }
    }
  }, [user, userLoading, isLoading, safeNavigate]);

  const handleOnboardingComplete = () => {
    if (isMountedRef.current) {
      setShowOnboarding(false);
      if (!user.selectedLanguage || !user.nativeLanguage) {
        setShowLanguageSetup(true);
      } else {
        safeNavigate(() => router.replace('/(tabs)/chat'));
      }
    }
  };

  const handleLanguageSetupComplete = () => {
    if (isMountedRef.current) {
      setShowLanguageSetup(false);
      safeNavigate(() => router.replace('/(tabs)/chat'));
    }
  };

  if (isLoading || userLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.container} />
      </SafeAreaView>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (showLanguageSetup) {
    return <LanguageSetupScreen onComplete={handleLanguageSetupComplete} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});