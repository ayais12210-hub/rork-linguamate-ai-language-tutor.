import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingScreen from '@/components/OnboardingScreen';
import LanguageSetupScreen from '@/components/LanguageSetupScreen';
import PlacementQuiz from '@/components/PlacementQuiz';
import ProfileSetup from '@/components/ProfileSetup';
import { useUser } from '@/hooks/user-store';

export default function IndexScreen() {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showLanguageSetup, setShowLanguageSetup] = useState<boolean>(false);
  const [showPlacement, setShowPlacement] = useState<boolean>(false);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user, isLoading: userLoading } = useUser();

  const checkOnboardingStatus = useCallback(async () => {
    try {
      if (!user.onboardingCompleted) {
        setShowOnboarding(true);
      } else if (!user.selectedLanguage || !user.nativeLanguage) {
        setShowLanguageSetup(true);
      } else if (!user.placementCompleted) {
        setShowPlacement(true);
      } else if (!user.profileCompleted) {
        setShowProfileSetup(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true);
    } finally {
      setIsLoading(false);
    }
  }, [user.onboardingCompleted, user.selectedLanguage, user.nativeLanguage, user.placementCompleted, user.profileCompleted]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  useEffect(() => {
    if (!userLoading && !isLoading) {
      if (
        user.onboardingCompleted &&
        user.selectedLanguage &&
        user.nativeLanguage &&
        user.placementCompleted &&
        user.profileCompleted
      ) {
        router.replace('/(tabs)/chat');
      }
    }
  }, [user, userLoading, isLoading]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    if (!user.selectedLanguage || !user.nativeLanguage) {
      setShowLanguageSetup(true);
    } else if (!user.placementCompleted) {
      setShowPlacement(true);
    } else if (!user.profileCompleted) {
      setShowProfileSetup(true);
    } else {
      router.replace('/(tabs)/chat');
    }
  };

  const handleLanguageSetupComplete = () => {
    setShowLanguageSetup(false);
    if (!user.placementCompleted) {
      setShowPlacement(true);
    } else if (!user.profileCompleted) {
      setShowProfileSetup(true);
    } else {
      router.replace('/(tabs)/chat');
    }
  };

  const handlePlacementComplete = () => {
    setShowPlacement(false);
    if (!user.profileCompleted) {
      setShowProfileSetup(true);
    } else {
      router.replace('/(tabs)/chat');
    }
  };

  const handleProfileComplete = () => {
    setShowProfileSetup(false);
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

  if (showPlacement) {
    return <PlacementQuiz onComplete={handlePlacementComplete} />;
  }

  if (showProfileSetup) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
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