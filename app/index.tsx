import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingScreen from '@/components/OnboardingScreen';
import LanguageSetupScreen from '@/components/LanguageSetupScreen';
import { useUser } from '@/hooks/user-store';
import { SafeStateWrapper } from '@/src/polyfills/safe-state-wrapper';

export default function IndexScreen() {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showLanguageSetup, setShowLanguageSetup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user, isLoading: userLoading } = useUser();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Ensure user object is properly initialized before accessing properties
        if (user && typeof user === 'object') {
          if (!user.onboardingCompleted) {
            setShowOnboarding(true);
          } else if (!user.selectedLanguage || !user.nativeLanguage) {
            setShowLanguageSetup(true);
          }
        } else {
          // If user is not properly initialized, show onboarding
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setShowOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (!userLoading && user) {
      checkOnboardingStatus();
    }
  }, [user?.onboardingCompleted, user?.selectedLanguage, user?.nativeLanguage, userLoading, user]);

  useEffect(() => {
    if (!userLoading && !isLoading && user && typeof user === 'object') {
      if (
        user.onboardingCompleted &&
        user.selectedLanguage &&
        user.nativeLanguage
      ) {
        router.replace('/(tabs)/chat');
      }
    }
  }, [user?.onboardingCompleted, user?.selectedLanguage, user?.nativeLanguage, userLoading, isLoading, user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    if (user && typeof user === 'object' && (!user.selectedLanguage || !user.nativeLanguage)) {
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
        <SafeStateWrapper>
          <View style={styles.container} />
        </SafeStateWrapper>
      </SafeAreaView>
    );
  }

  if (showOnboarding) {
    return (
      <SafeStateWrapper>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </SafeStateWrapper>
    );
  }

  if (showLanguageSetup) {
    return (
      <SafeStateWrapper>
        <LanguageSetupScreen onComplete={handleLanguageSetupComplete} />
      </SafeStateWrapper>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SafeStateWrapper>
        <View style={styles.container} />
      </SafeStateWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});