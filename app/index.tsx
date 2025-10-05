import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingScreen from '@/components/OnboardingScreen';
import LanguageSetupScreen from '@/components/LanguageSetupScreen';
import { useUser } from '@/hooks/user-store';

export default function IndexScreen() {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showLanguageSetup, setShowLanguageSetup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user, isLoading: userLoading } = useUser();

  const checkOnboardingStatus = useCallback(async () => {
    try {
      if (!user.onboardingCompleted) {
        setShowOnboarding(true);
      } else if (!user.selectedLanguage || !user.nativeLanguage) {
        setShowLanguageSetup(true);
      }
    } catch (error) {
      if (__DEV__) {

        console.error('Error checking onboarding status:', error);

      }
      setShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  }, [user.onboardingCompleted, user.selectedLanguage, user.nativeLanguage]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  useEffect(() => {
    if (!userLoading && !isLoading) {
      if (
        user.onboardingCompleted &&
        user.selectedLanguage &&
        user.nativeLanguage
      ) {
        router.replace('/(tabs)/chat');
      }
    }
  }, [user, userLoading, isLoading]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    if (!user.selectedLanguage || !user.nativeLanguage) {
      setShowLanguageSetup(true);
    } else {
      router.replace('/(tabs)/chat');
    }
  };

  const handleLanguageSetupComplete = () => {
    setShowLanguageSetup(false);
    router.replace('/(tabs)/chat');
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