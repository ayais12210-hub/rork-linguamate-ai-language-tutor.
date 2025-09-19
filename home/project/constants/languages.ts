export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  family: string;
  speakers: number;
  countries: string[];
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    difficulty: 'beginner',
    family: 'Germanic',
    speakers: 1500000000,
    countries: ['United States', 'United Kingdom', 'Canada', 'Australia']
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    difficulty: 'beginner',
    family: 'Romance',
    speakers: 500000000,
    countries: ['Spain', 'Mexico', 'Argentina', 'Colombia']
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    difficulty: 'intermediate',
    family: 'Romance',
    speakers: 280000000,
    countries: ['France', 'Canada', 'Belgium', 'Switzerland']
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    difficulty: 'intermediate',
    family: 'Germanic',
    speakers: 100000000,
    countries: ['Germany', 'Austria', 'Switzerland']
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    difficulty: 'intermediate',
    family: 'Romance',
    speakers: 65000000,
    countries: ['Italy', 'San Marino', 'Vatican City']
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    difficulty: 'intermediate',
    family: 'Romance',
    speakers: 260000000,
    countries: ['Portugal', 'Brazil']
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    difficulty: 'advanced',
    family: 'Slavic',
    speakers: 258000000,
    countries: ['Russia', 'Belarus', 'Kazakhstan']
  },
  {
    code: 'zh',
    name: 'Chinese (Mandarin)',
    nativeName: '中文',
    flag: '🇨🇳',
    difficulty: 'advanced',
    family: 'Sino-Tibetan',
    speakers: 918000000,
    countries: ['China', 'Taiwan', 'Singapore']
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    difficulty: 'advanced',
    family: 'Japonic',
    speakers: 125000000,
    countries: ['Japan']
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    difficulty: 'advanced',
    family: 'Koreanic',
    speakers: 77000000,
    countries: ['South Korea', 'North Korea']
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true,
    difficulty: 'advanced',
    family: 'Semitic',
    speakers: 422000000,
    countries: ['Saudi Arabia', 'Egypt', 'UAE', 'Morocco']
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    difficulty: 'intermediate',
    family: 'Indo-European',
    speakers: 600000000,
    countries: ['India']
  }
];

export const getLanguageByCode = (code: string): Language | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

export const getLanguagesByDifficulty = (difficulty: Language['difficulty']): Language[] => {
  return SUPPORTED_LANGUAGES.filter(lang => lang.difficulty === difficulty);
};

export const getLanguagesByFamily = (family: string): Language[] => {
  return SUPPORTED_LANGUAGES.filter(lang => lang.family === family);
};

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0]; // English

export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(lang => lang.code);

export const POPULAR_LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'ja'];

export const RTL_LANGUAGES = SUPPORTED_LANGUAGES.filter(lang => lang.rtl).map(lang => lang.code);