import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, changeLanguage, getCurrentLanguage } from '@/src/i18n';

/**
 * Example: Internationalization (i18n)
 * 
 * Demonstrates multi-language support with react-i18next
 */
export function I18nExample() {
  const { t, i18n } = useTranslation();
  const currentLang = getCurrentLanguage();

  const handleChangeLanguage = async (langCode: string) => {
    try {
      await changeLanguage(langCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('common.welcome')}</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        
        {supportedLanguages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageButton,
              currentLang === lang.code && styles.languageButtonActive,
            ]}
            onPress={() => handleChangeLanguage(lang.code)}
          >
            <Text style={styles.languageText}>
              {lang.nativeName} ({lang.name})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.exampleTitle}>Example Translations:</Text>
        <Text style={styles.exampleText}>• {t('lessons.start')}</Text>
        <Text style={styles.exampleText}>• {t('practice.speak')}</Text>
        <Text style={styles.exampleText}>• {t('practice.listen')}</Text>
        <Text style={styles.exampleText}>• {t('practice.excellent')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  languageButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  languageButtonActive: {
    backgroundColor: '#007AFF',
  },
  languageText: {
    fontSize: 16,
    textAlign: 'center',
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
});
