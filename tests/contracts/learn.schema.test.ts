import { z } from 'zod';

// Learn content schemas
export const alphabetEntrySchema = z.object({
  id: z.string(),
  character: z.string().min(1),
  romanization: z.string().optional(),
  pronunciation: z.string(),
  type: z.enum(['vowel', 'consonant', 'special']),
  examples: z.array(z.object({
    word: z.string(),
    translation: z.string(),
    pronunciation: z.string().optional(),
  })),
  difficulty: z.number().int().min(1).max(5),
});

export const numberEntrySchema = z.object({
  value: z.number().int().min(0),
  target: z.string(),
  pronunciation: z.string().optional(),
});

export const wordEntrySchema = z.object({
  target: z.string(),
  native: z.string(),
  pronunciation: z.string().optional(),
  theme: z.string(),
});

export const phraseEntrySchema = z.object({
  target: z.string(),
  native: z.string(),
  pronunciation: z.string().optional(),
  context: z.string(),
});

export const phonicsEntrySchema = z.object({
  id: z.string(),
  sound: z.string(),
  ipa: z.string().optional(),
  graphemes: z.array(z.string()),
  examples: z.array(z.object({
    word: z.string(),
    translation: z.string(),
  })),
  mouthHint: z.string().optional(),
});

export const grammarEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  explanation: z.string(),
  examples: z.array(z.object({
    target: z.string(),
    native: z.string(),
  })),
});

export const dialogueTurnSchema = z.object({
  speaker: z.string(),
  target: z.string(),
  native: z.string(),
});

export const dialogueEntrySchema = z.object({
  id: z.string(),
  scene: z.string(),
  turns: z.array(dialogueTurnSchema),
});

export const learnContentRequestSchema = z.object({
  targetName: z.string(),
  nativeName: z.string(),
});

export const learnContentResponseSchema = z.object({
  alphabet: z.array(alphabetEntrySchema),
  numbers: z.array(numberEntrySchema),
  commonWords: z.array(wordEntrySchema),
  phrases: z.array(phraseEntrySchema),
  tips: z.array(z.string()),
  phonics: z.array(phonicsEntrySchema).optional(),
  grammar: z.array(grammarEntrySchema).optional(),
  dialogues: z.array(dialogueEntrySchema).optional(),
});

// Contract tests
describe('Learn API Contract Tests', () => {
  describe('Get content endpoint', () => {
    it('should validate learn content request', () => {
      const validRequest = {
        targetName: 'Spanish',
        nativeName: 'English',
      };

      expect(() => learnContentRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should validate complete learn content response', () => {
      const validResponse = {
        alphabet: [
          {
            id: 'a1',
            character: 'A',
            romanization: 'a',
            pronunciation: 'ah',
            type: 'vowel',
            examples: [
              { word: 'apple', translation: 'manzana', pronunciation: 'ah-pel' },
            ],
            difficulty: 1,
          },
        ],
        numbers: [
          { value: 0, target: 'cero' },
          { value: 1, target: 'uno', pronunciation: 'oo-no' },
        ],
        commonWords: [
          { target: 'hola', native: 'hello', theme: 'greetings' },
          { target: 'gracias', native: 'thank you', pronunciation: 'grah-see-ahs', theme: 'polite' },
        ],
        phrases: [
          { target: '¿Cómo estás?', native: 'How are you?', context: 'greeting' },
        ],
        tips: [
          'Practice pronunciation daily',
          'Focus on common phrases first',
        ],
        phonics: [
          {
            id: 'ph1',
            sound: 'rr',
            ipa: '/r̄/',
            graphemes: ['rr', 'r'],
            examples: [
              { word: 'perro', translation: 'dog' },
              { word: 'carro', translation: 'car' },
            ],
            mouthHint: 'Roll your tongue against the roof of your mouth',
          },
        ],
        grammar: [
          {
            id: 'g1',
            title: 'Gender and Articles',
            explanation: 'Spanish nouns have gender (masculine/feminine)',
            examples: [
              { target: 'el libro', native: 'the book (masculine)' },
              { target: 'la mesa', native: 'the table (feminine)' },
            ],
          },
        ],
        dialogues: [
          {
            id: 'd1',
            scene: 'At a restaurant',
            turns: [
              { speaker: 'Waiter', target: '¿Qué desea?', native: 'What would you like?' },
              { speaker: 'Customer', target: 'Un café, por favor', native: 'A coffee, please' },
            ],
          },
        ],
      };

      expect(() => learnContentResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('should validate response with optional fields missing', () => {
      const minimalResponse = {
        alphabet: [],
        numbers: [],
        commonWords: [],
        phrases: [],
        tips: [],
      };

      expect(() => learnContentResponseSchema.parse(minimalResponse)).not.toThrow();
    });

    it('should reject invalid alphabet entries', () => {
      const invalidAlphabet = {
        alphabet: [
          {
            id: 'a1',
            character: '', // Empty character
            pronunciation: 'ah',
            type: 'invalid', // Invalid type
            examples: [],
            difficulty: 10, // Out of range
          },
        ],
        numbers: [],
        commonWords: [],
        phrases: [],
        tips: [],
      };

      expect(() => learnContentResponseSchema.parse(invalidAlphabet)).toThrow();
    });

    it('should reject invalid number entries', () => {
      const invalidNumbers = {
        alphabet: [],
        numbers: [
          { value: -5, target: '' }, // Negative value, empty target
          { value: 1.5, target: 'uno' }, // Non-integer
        ],
        commonWords: [],
        phrases: [],
        tips: [],
      };

      expect(() => learnContentResponseSchema.parse(invalidNumbers)).toThrow();
    });
  });

  describe('Schema edge cases', () => {
    it('should handle special characters in content', () => {
      const specialCharsResponse = {
        alphabet: [
          {
            id: 'n1',
            character: 'ñ',
            pronunciation: 'eñe',
            type: 'consonant',
            examples: [
              { word: 'niño', translation: 'child' },
            ],
            difficulty: 2,
          },
        ],
        numbers: [],
        commonWords: [
          { target: '¿Qué?', native: 'What?', theme: 'questions' },
          { target: '¡Hola!', native: 'Hello!', theme: 'greetings' },
        ],
        phrases: [
          { target: '¿Cómo te llamas?', native: 'What\'s your name?', context: 'introduction' },
        ],
        tips: ['Use ¿ and ? for questions in Spanish'],
      };

      expect(() => learnContentResponseSchema.parse(specialCharsResponse)).not.toThrow();
    });

    it('should validate complex phonics entries', () => {
      const complexPhonics = {
        alphabet: [],
        numbers: [],
        commonWords: [],
        phrases: [],
        tips: [],
        phonics: [
          {
            id: 'fr_nasal',
            sound: 'on',
            ipa: '/ɔ̃/',
            graphemes: ['on', 'om'],
            examples: [
              { word: 'bonjour', translation: 'hello' },
              { word: 'nom', translation: 'name' },
            ],
            mouthHint: 'Lower the soft palate to produce nasal sound',
          },
        ],
      };

      expect(() => learnContentResponseSchema.parse(complexPhonics)).not.toThrow();
    });
  });
});