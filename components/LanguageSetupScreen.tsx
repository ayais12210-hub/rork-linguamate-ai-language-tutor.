import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Globe, Target } from 'lucide-react-native';
import { LANGUAGES } from '@/constants/languages';
import { useUser } from '@/hooks/user-store';

interface LanguageSetupScreenProps {
  onComplete: () => void;
}

export default function LanguageSetupScreen({ onComplete }: LanguageSetupScreenProps) {
  const { user, updateUser } = useUser();
  const [step, setStep] = useState<number>(1);
  const [selectedNative, setSelectedNative] = useState<string>(user.nativeLanguage || 'en');
  const [selectedTarget, setSelectedTarget] = useState<string>(user.selectedLanguage || '');
  const [selectedProficiency, setSelectedProficiency] = useState<'beginner' | 'intermediate' | 'advanced'>(user.proficiencyLevel);

  const handleNativeLanguageSelect = (languageCode: string) => {
    setSelectedNative(languageCode);
    setStep(2);
  };

  const handleTargetLanguageSelect = (languageCode: string) => {
    setSelectedTarget(languageCode);
    setStep(3);
  };

  const handleProficiencySelect = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setSelectedProficiency(level);
    setStep(4);
  };

  const handleComplete = () => {
    updateUser({
      nativeLanguage: selectedNative,
      selectedLanguage: selectedTarget,
      proficiencyLevel: selectedProficiency,
    });
    onComplete();
  };

  const nativeLang = LANGUAGES.find(lang => lang.code === selectedNative);
  const targetLang = LANGUAGES.find(lang => lang.code === selectedTarget);

  const renderLanguageSelection = (title: string, subtitle: string, onSelect: (code: string) => void, excludeCode?: string) => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Globe size={32} color="white" />
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepSubtitle}>{subtitle}</Text>
      </View>
      
      <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
        {LANGUAGES.filter(lang => lang.code !== excludeCode).map((language) => (
          <TouchableOpacity
            key={language.code}
            style={styles.languageItem}
            onPress={() => onSelect(language.code)}
          >
            <View style={styles.languageInfo}>
              <Text style={styles.languageFlag}>{language.flag}</Text>
              <View style={styles.languageText}>
                <Text style={styles.languageName}>{language.name}</Text>
                <Text style={styles.languageNative}>{language.nativeName}</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#6B7280" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderProficiencySelection = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Target size={32} color="white" />
        <Text style={styles.stepTitle}>Your Level</Text>
        <Text style={styles.stepSubtitle}>How well do you know {targetLang?.name}?</Text>
      </View>
      
      <View style={styles.proficiencyList}>
        {[
          { level: 'beginner' as const, title: 'Beginner', description: 'Just starting out or know basic words' },
          { level: 'intermediate' as const, title: 'Intermediate', description: 'Can have simple conversations' },
          { level: 'advanced' as const, title: 'Advanced', description: 'Fluent but want to perfect skills' },
        ].map((option) => (
          <TouchableOpacity
            key={option.level}
            style={[
              styles.proficiencyItem,
              selectedProficiency === option.level && styles.selectedProficiencyItem
            ]}
            onPress={() => handleProficiencySelect(option.level)}
          >
            <Text style={[
              styles.proficiencyTitle,
              selectedProficiency === option.level && styles.selectedProficiencyTitle
            ]}>
              {option.title}
            </Text>
            <Text style={[
              styles.proficiencyDescription,
              selectedProficiency === option.level && styles.selectedProficiencyDescription
            ]}>
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSummary = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Perfect!</Text>
        <Text style={styles.stepSubtitle}>Let&apos;s confirm your language setup</Text>
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Your Native Language</Text>
          <View style={styles.summaryLanguage}>
            <Text style={styles.summaryFlag}>{nativeLang?.flag}</Text>
            <Text style={styles.summaryName}>{nativeLang?.name}</Text>
          </View>
        </View>
        
        <View style={styles.summaryArrow}>
          <Text style={styles.arrowText}>→</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Learning</Text>
          <View style={styles.summaryLanguage}>
            <Text style={styles.summaryFlag}>{targetLang?.flag}</Text>
            <Text style={styles.summaryName}>{targetLang?.name}</Text>
          </View>
        </View>
        
        <View style={styles.proficiencyBadge}>
          <Text style={styles.proficiencyBadgeText}>
            {selectedProficiency.charAt(0).toUpperCase() + selectedProficiency.slice(1)} Level
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
        <Text style={styles.completeButtonText}>Start Learning!</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {step} of 4</Text>
        </View>
        
        {step === 1 && renderLanguageSelection(
          "What's your native language?",
          "This helps us translate from your language to your target language",
          handleNativeLanguageSelect
        )}
        
        {step === 2 && renderLanguageSelection(
          "What language do you want to learn?",
          "Choose the language you'd like to practice and improve",
          handleTargetLanguageSelect,
          selectedNative
        )}
        
        {step === 3 && renderProficiencySelection()}
        
        {step === 4 && renderSummary()}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  languageList: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingVertical: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 14,
    color: '#6B7280',
  },
  proficiencyList: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 8,
  },
  proficiencyItem: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedProficiencyItem: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
  },
  proficiencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedProficiencyTitle: {
    color: '#3B82F6',
  },
  proficiencyDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  selectedProficiencyDescription: {
    color: '#1E40AF',
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  summaryLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  summaryName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryArrow: {
    marginVertical: 10,
  },
  arrowText: {
    fontSize: 24,
    color: '#6B7280',
  },
  proficiencyBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  proficiencyBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  completeButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});