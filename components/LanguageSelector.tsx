import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { LANGUAGES } from '@/constants/languages';

interface LanguageSelectorProps {
  onLanguageSelect: (language: string, proficiency: 'beginner' | 'intermediate' | 'advanced') => void;
}

export default function LanguageSelector({ onLanguageSelect }: LanguageSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedProficiency, setSelectedProficiency] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredLanguages = LANGUAGES.filter((lang) => {
    const name = lang.name?.toLowerCase() ?? '';
    const native = lang.nativeName?.toLowerCase() ?? '';
    const code = lang.code?.toLowerCase() ?? '';
    return (
      name.includes(normalizedQuery) ||
      native.includes(normalizedQuery) ||
      code.includes(normalizedQuery)
    );
  });

  const handleLanguagePress = (languageCode: string) => {
    const code = (languageCode ?? '').trim();
    if (!code) return;
    if (__DEV__) {

      console.log('[LanguageSelector] language selected:', code);

    }
    setSelectedLanguage(code);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      if (__DEV__) {

        console.log('[LanguageSelector] continue with', { selectedLanguage, selectedProficiency });

      }
      onLanguageSelect(selectedLanguage, selectedProficiency);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Language</Text>
        <Text style={styles.subtitle}>Which language would you like to practice?</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          testID="language-search-input"
          style={styles.searchInput}
          placeholder="Search languages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
        />
      </View>

      <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
        {filteredLanguages.map((language) => (
          <TouchableOpacity
            testID={`language-item-${language.code}`}
            key={language.code}
            style={[
              styles.languageItem,
              selectedLanguage === language.code && styles.selectedLanguageItem,
            ]}
            onPress={() => handleLanguagePress(language.code)}
          >
            <Text style={styles.flag}>{language.flag}</Text>
            <View style={styles.languageInfo}>
              <Text style={[
                styles.languageName,
                selectedLanguage === language.code && styles.selectedLanguageName,
              ]}>
                {language.name}
              </Text>
              <Text style={styles.nativeName}>{language.nativeName}</Text>
            </View>
            {selectedLanguage === language.code && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedLanguage && (
        <View style={styles.proficiencyContainer}>
          <Text style={styles.proficiencyTitle}>Your Level</Text>
          <View style={styles.proficiencyButtons}>
            {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.proficiencyButton,
                  selectedProficiency === level && styles.selectedProficiencyButton,
                ]}
                onPress={() => setSelectedProficiency(level)}
              >
                <Text style={[
                  styles.proficiencyButtonText,
                  selectedProficiency === level && styles.selectedProficiencyButtonText,
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {selectedLanguage && (
        <TouchableOpacity testID="language-continue-button" style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  languageList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedLanguageItem: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  flag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  selectedLanguageName: {
    color: '#3B82F6',
  },
  nativeName: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  proficiencyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  proficiencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  proficiencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  proficiencyButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  selectedProficiencyButton: {
    backgroundColor: '#3B82F6',
  },
  proficiencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedProficiencyButtonText: {
    color: 'white',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});