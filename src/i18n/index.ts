import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation resources
import en from './locales/en.json';
import pa from './locales/pa.json';
import hi from './locales/hi.json';

/**
 * i18n Configuration
 * 
 * Provides multi-language support with:
 * - Auto-detection of device locale
 * - Fallback to English
 * - Type-safe translations
 * - Support for Punjabi, Hindi, and English
 */

const resources = {
  en: { translation: en },
  pa: { translation: pa },
  hi: { translation: hi },
};

// Get device locale
const deviceLocale = Localization.getLocales()[0]?.languageTag ?? 'en';
const languageCode = deviceLocale.split('-')[0]; // Get 'en' from 'en-US'

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: languageCode,
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false,
    },
    
    debug: __DEV__,
  });

export default i18n;

// Export supported languages
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
];

// Helper to change language
export const changeLanguage = async (languageCode: string) => {
  await i18n.changeLanguage(languageCode);
};

// Get current language
export const getCurrentLanguage = () => i18n.language;
