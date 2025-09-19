import { Language } from '@/types/user';

export const LANGUAGES: Language[] = [
  // English Variants
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'en-us', name: 'English (US)', flag: '🇺🇸', nativeName: 'English (US)' },
  { code: 'en-gb', name: 'English (UK)', flag: '🇬🇧', nativeName: 'English (UK)' },

  // Indo-European (Romance/Germanic/Slavic/etc.)
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱', nativeName: 'Nederlands' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦', nativeName: 'Українська' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱', nativeName: 'Polski' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿', nativeName: 'Čeština' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰', nativeName: 'Slovenčina' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬', nativeName: 'Български' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸', nativeName: 'Српски' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷', nativeName: 'Hrvatski' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴', nativeName: 'Română' },
  { code: 'el', name: 'Greek', flag: '🇬🇷', nativeName: 'Ελληνικά' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴', nativeName: 'Norsk' },
  { code: 'da', name: 'Danish', flag: '🇩🇰', nativeName: 'Dansk' },
  { code: 'is', name: 'Icelandic', flag: '🇮🇸', nativeName: 'Íslenska' },
  { code: 'ga', name: 'Irish', flag: '🇮🇪', nativeName: 'Gaeilge' },
  { code: 'cy', name: 'Welsh', flag: '🏴', nativeName: 'Cymraeg' },
  { code: 'eu', name: 'Basque', flag: '🇪🇸', nativeName: 'Euskera' },
  { code: 'ca', name: 'Catalan', flag: '🇪🇸', nativeName: 'Català' },
  { code: 'gl', name: 'Galician', flag: '🇪🇸', nativeName: 'Galego' },
  { code: 'lb', name: 'Luxembourgish', flag: '🇱🇺', nativeName: 'Lëtzebuergesch' },
  { code: 'be', name: 'Belarusian', flag: '🇧🇾', nativeName: 'Беларуская' },
  { code: 'mt', name: 'Maltese', flag: '🇲🇹', nativeName: 'Malti' },

  // Uralic
  { code: 'fi', name: 'Finnish', flag: '🇫🇮', nativeName: 'Suomi' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺', nativeName: 'Magyar' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪', nativeName: 'Eesti' },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹', nativeName: 'Lietuvių' },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻', nativeName: 'Latviešu' },

  // Indo-Aryan & Iranian
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰', nativeName: 'اردو' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳', nativeName: 'ગુજરાતી' },
  { code: 'fa', name: 'Persian (Farsi)', flag: '🇮🇷', nativeName: 'فارسی' },
  { code: 'ps', name: 'Pashto', flag: '🇦🇫', nativeName: 'پښتو' },
  { code: 'ku', name: 'Kurdish', flag: '🏳️', nativeName: 'Kurdî' },

  // Dravidian
  { code: 'ta', name: 'Tamil', flag: '🇮🇳', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳', nativeName: 'മലയാളം' },

  // Sino-Tibetan
  { code: 'zh', name: 'Chinese (Mandarin)', flag: '🇨🇳', nativeName: '中文' },
  { code: 'zh-hans', name: 'Chinese (Simplified)', flag: '🇨🇳', nativeName: '简体中文' },
  { code: 'zh-hant', name: 'Chinese (Traditional)', flag: '🇹🇼', nativeName: '繁體中文' },
  { code: 'yue', name: 'Cantonese', flag: '🇭🇰', nativeName: '廣東話' },
  { code: 'bo', name: 'Tibetan', flag: '🏔️', nativeName: 'བོད་ཡིག' },

  // Semitic
  { code: 'ar', name: 'Arabic (MSA)', flag: '🇸🇦', nativeName: 'العربية الفصحى' },
  { code: 'ar-eg', name: 'Arabic (Egyptian)', flag: '🇪🇬', nativeName: 'العربية المصرية' },
  { code: 'ar-lev', name: 'Arabic (Levantine)', flag: '🇱🇧', nativeName: 'العربية الشامية' },
  { code: 'ar-gulf', name: 'Arabic (Gulf)', flag: '🇶🇦', nativeName: 'العربية الخليجية' },
  { code: 'ar-mag', name: 'Arabic (Maghrebi)', flag: '🇲🇦', nativeName: 'العربية المغاربية' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱', nativeName: 'עברית' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹', nativeName: 'አማርኛ' },

  // Turkic
  { code: 'az', name: 'Azerbaijani', flag: '🇦🇿', nativeName: 'Azərbaycan' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'uz', name: 'Uzbek', flag: '🇺🇿', nativeName: 'Oʻzbek' },
  { code: 'kk', name: 'Kazakh', flag: '🇰🇿', nativeName: 'Қазақ' },

  // East & Southeast Asian
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', flag: '🇹🇭', nativeName: 'ไทย' },
  { code: 'tl', name: 'Tagalog/Filipino', flag: '🇵🇭', nativeName: 'Filipino' },
  { code: 'km', name: 'Khmer', flag: '🇰🇭', nativeName: 'ខ្មែរ' },
  { code: 'my', name: 'Burmese', flag: '🇲🇲', nativeName: 'မြန်မာ' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾', nativeName: 'Bahasa Melayu' },

  // African (selected)
  { code: 'sw', name: 'Swahili', flag: '🇰🇪', nativeName: 'Kiswahili' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬', nativeName: 'Yorùbá' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬', nativeName: 'Igbo' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦', nativeName: 'isiZulu' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬', nativeName: 'Hausa' },
  { code: 'so', name: 'Somali', flag: '🇸🇴', nativeName: 'Soomaali' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦', nativeName: 'isiXhosa' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦', nativeName: 'Afrikaans' },

  // South Asian & Himalayan
  { code: 'ne', name: 'Nepali', flag: '🇳🇵', nativeName: 'नेपाली' },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰', nativeName: 'සිංහල' },

  // Caucasus & Central Asia
  { code: 'ka', name: 'Georgian', flag: '🇬🇪', nativeName: 'ქართული' },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲', nativeName: 'Հայերեն' },
  { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬', nativeName: 'Кыргыз' },
  { code: 'tg', name: 'Tajik', flag: '🇹🇯', nativeName: 'Тоҷикӣ' },
  { code: 'mn', name: 'Mongolian', flag: '🇲🇳', nativeName: 'Монгол' },

  // Americas & Indigenous
  { code: 'qu', name: 'Quechua', flag: '🇵🇪', nativeName: 'Runa Simi' },
  { code: 'gn', name: 'Guarani', flag: '🇵🇾', nativeName: "Avañe'ẽ" },
  { code: 'mi', name: 'Māori', flag: '🇳🇿', nativeName: 'Te Reo Māori' },
  { code: 'haw', name: 'Hawaiian', flag: '🇺🇸', nativeName: 'ʻŌlelo Hawaiʻi' },
  { code: 'nah', name: 'Nahuatl', flag: '🇲🇽', nativeName: 'Nāhuatl' },
  { code: 'iu', name: 'Inuktitut', flag: '🇨🇦', nativeName: 'ᐃᓄᒃᑎᑐᑦ' },

  // Constructed / Fictional (practice sets)
  { code: 'eo', name: 'Esperanto', flag: '🟩', nativeName: 'Esperanto' },
  { code: 'tlh', name: 'Klingon', flag: '🛸', nativeName: 'tlhIngan Hol' },
  { code: 'doth', name: 'Dothraki', flag: '🐎', nativeName: 'Dothraki' },
  { code: 'val', name: 'High Valyrian', flag: '🐉', nativeName: 'Valyrio' },
];

export const FREE_MESSAGES_PER_DAY = 5;

export const BADGES = [
  { id: 'first_chat', name: 'First Steps', description: 'Sent your first message', icon: '🎯', requiredValue: 1, type: 'totalChats' },
  { id: 'streak_3', name: '3-Day Streak', description: 'Practiced for 3 days in a row', icon: '🔥', requiredValue: 3, type: 'streakDays' },
  { id: 'streak_7', name: 'Week Warrior', description: 'Practiced for 7 days in a row', icon: '⚡', requiredValue: 7, type: 'streakDays' },
  { id: 'streak_30', name: 'Monthly Master', description: 'Practiced for 30 days in a row', icon: '👑', requiredValue: 30, type: 'streakDays' },
  { id: 'chats_50', name: 'Chatterbox', description: 'Completed 50 conversations', icon: '💬', requiredValue: 50, type: 'totalChats' },
  { id: 'chats_100', name: 'Conversation King', description: 'Completed 100 conversations', icon: '🗣️', requiredValue: 100, type: 'totalChats' },
  { id: 'words_100', name: 'Vocabulary Builder', description: 'Learned 100 new words', icon: '📚', requiredValue: 100, type: 'wordsLearned' },
];