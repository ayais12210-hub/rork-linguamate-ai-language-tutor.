import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export type AlphabetEntry = {
  id: string;
  character: string;
  romanization?: string;
  pronunciation: string;
  type: 'vowel' | 'consonant' | 'special';
  examples: Array<{ word: string; translation: string; pronunciation?: string }>;
  difficulty: number;
};

export type PhonicsEntry = {
  id: string;
  sound: string;
  ipa?: string;
  graphemes: string[];
  examples: Array<{ word: string; translation: string }>;
  mouthHint?: string;
};

export interface LearnPayload {
  alphabet: AlphabetEntry[];
  numbers: Array<{ value: number; target: string; pronunciation?: string }>;
  commonWords: Array<{ target: string; native: string; pronunciation?: string; theme: string }>;
  phrases: Array<{ target: string; native: string; pronunciation?: string; context: string }>;
  tips: string[];
  phonics?: PhonicsEntry[];
}

function buildFallbackContent(nativeName: string, targetName: string): LearnPayload {
  const alphaBase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const alphabet: AlphabetEntry[] = alphaBase.map((ch, i) => ({
    id: `latin_${i}`,
    character: ch,
    romanization: undefined,
    pronunciation: ch,
    type: 'special',
    examples: [
      { word: `${ch.toLowerCase()}a`, translation: `${ch.toLowerCase()}a (${nativeName})` },
      { word: `${ch.toLowerCase()}o`, translation: `${ch.toLowerCase()}o (${nativeName})` },
    ],
    difficulty: 1,
  }));

  const presets: Record<string, { numbers: { value: number; target: string; pronunciation?: string }[]; commonWords: { target: string; native: string; pronunciation?: string; theme: string }[]; phrases: { target: string; native: string; pronunciation?: string; context: string }[]; tips: string[]; }> = {
    Spanish: {
      numbers: [
        { value: 0, target: 'cero' }, { value: 1, target: 'uno' }, { value: 2, target: 'dos' }, { value: 3, target: 'tres' }, { value: 4, target: 'cuatro' },
        { value: 5, target: 'cinco' }, { value: 6, target: 'seis' }, { value: 7, target: 'siete' }, { value: 8, target: 'ocho' }, { value: 9, target: 'nueve' },
        { value: 10, target: 'diez' }, { value: 11, target: 'once' }, { value: 12, target: 'doce' }, { value: 13, target: 'trece' }, { value: 14, target: 'catorce' },
        { value: 15, target: 'quince' }, { value: 16, target: 'dieciséis' }, { value: 17, target: 'diecisiete' }, { value: 18, target: 'dieciocho' }, { value: 19, target: 'diecinueve' },
        { value: 20, target: 'veinte' }, { value: 30, target: 'treinta' }, { value: 40, target: 'cuarenta' }, { value: 50, target: 'cincuenta' }, { value: 60, target: 'sesenta' },
        { value: 70, target: 'setenta' }, { value: 80, target: 'ochenta' }, { value: 90, target: 'noventa' }, { value: 100, target: 'cien' },
      ],
      commonWords: [
        { target: 'hola', native: 'hello', theme: 'people' },
        { target: 'gracias', native: 'thank you', theme: 'people' },
        { target: 'por favor', native: 'please', theme: 'people' },
        { target: 'sí', native: 'yes', theme: 'people' },
        { target: 'no', native: 'no', theme: 'people' },
        { target: 'amigo', native: 'friend', theme: 'people' },
        { target: 'familia', native: 'family', theme: 'people' },
        { target: 'hoy', native: 'today', theme: 'time' },
        { target: 'mañana', native: 'tomorrow', theme: 'time' },
        { target: 'ayer', native: 'yesterday', theme: 'time' },
        { target: 'ciudad', native: 'city', theme: 'places' },
        { target: 'casa', native: 'house', theme: 'places' },
        { target: 'escuela', native: 'school', theme: 'places' },
        { target: 'agua', native: 'water', theme: 'food' },
        { target: 'pan', native: 'bread', theme: 'food' },
        { target: 'café', native: 'coffee', theme: 'food' },
        { target: 'tren', native: 'train', theme: 'travel' },
        { target: 'aeropuerto', native: 'airport', theme: 'travel' },
        { target: 'billete', native: 'ticket', theme: 'travel' },
        { target: 'baño', native: 'bathroom', theme: 'places' },
      ],
      phrases: [
        { target: '¿Cómo estás?', native: 'How are you?', context: 'general' },
        { target: 'Mucho gusto', native: 'Nice to meet you', context: 'general' },
        { target: '¿Dónde está el baño?', native: 'Where is the bathroom?', context: 'travel' },
        { target: '¿Cuánto cuesta?', native: 'How much is it?', context: 'shopping' },
        { target: 'No entiendo', native: "I don't understand", context: 'learning' },
        { target: '¿Hablas inglés?', native: 'Do you speak English?', context: 'travel' },
        { target: 'Quisiera esto, por favor', native: 'I would like this, please', context: 'restaurant' },
        { target: 'Perdón', native: 'Excuse me / Sorry', context: 'polite' },
        { target: 'Buenos días', native: 'Good morning', context: 'greeting' },
        { target: 'Buenas noches', native: 'Good night', context: 'greeting' },
        { target: '¿Puedes ayudarme?', native: 'Can you help me?', context: 'help' },
        { target: 'Estoy aprendiendo español', native: 'I am learning Spanish', context: 'learning' },
      ],
      tips: [
        'Vocales siempre claras: a e i o u',
        'La r simple vs. rr fuerte: practica vibración',
        'Sílaba tónica marcada; evita diptongos en exceso',
        'C y z antes de e/i con ceceo (ES) o seseo (AL)',
        'Usa por/para correctamente; fíjate en contexto',
        'Género y número concuerdan: el/la; -o/-a',
        'Pronombres clíticos: lo, la, le con verbos',
        'Practica chunks: “¿Puedo tener…?”, “Quisiera…”',
      ],
    },
    French: {
      numbers: [
        { value: 0, target: 'zéro' }, { value: 1, target: 'un' }, { value: 2, target: 'deux' }, { value: 3, target: 'trois' }, { value: 4, target: 'quatre' },
        { value: 5, target: 'cinq' }, { value: 6, target: 'six' }, { value: 7, target: 'sept' }, { value: 8, target: 'huit' }, { value: 9, target: 'neuf' },
        { value: 10, target: 'dix' }, { value: 11, target: 'onze' }, { value: 12, target: 'douze' }, { value: 13, target: 'treize' }, { value: 14, target: 'quatorze' },
        { value: 15, target: 'quinze' }, { value: 16, target: 'seize' }, { value: 17, target: 'dix-sept' }, { value: 18, target: 'dix-huit' }, { value: 19, target: 'dix-neuf' },
        { value: 20, target: 'vingt' }, { value: 30, target: 'trente' }, { value: 40, target: 'quarante' }, { value: 50, target: 'cinquante' }, { value: 60, target: 'soixante' },
        { value: 70, target: 'soixante-dix' }, { value: 80, target: 'quatre-vingts' }, { value: 90, target: 'quatre-vingt-dix' }, { value: 100, target: 'cent' },
      ],
      commonWords: [
        { target: 'bonjour', native: 'hello', theme: 'people' },
        { target: 'merci', native: 'thank you', theme: 'people' },
        { target: 's’il vous plaît', native: 'please', theme: 'people' },
        { target: 'oui', native: 'yes', theme: 'people' },
        { target: 'non', native: 'no', theme: 'people' },
        { target: 'ami', native: 'friend', theme: 'people' },
        { target: 'famille', native: 'family', theme: 'people' },
        { target: 'aujourd’hui', native: 'today', theme: 'time' },
        { target: 'demain', native: 'tomorrow', theme: 'time' },
        { target: 'hier', native: 'yesterday', theme: 'time' },
        { target: 'ville', native: 'city', theme: 'places' },
        { target: 'maison', native: 'house', theme: 'places' },
        { target: 'école', native: 'school', theme: 'places' },
        { target: 'eau', native: 'water', theme: 'food' },
        { target: 'pain', native: 'bread', theme: 'food' },
        { target: 'café', native: 'coffee', theme: 'food' },
        { target: 'train', native: 'train', theme: 'travel' },
        { target: 'aéroport', native: 'airport', theme: 'travel' },
        { target: 'billet', native: 'ticket', theme: 'travel' },
        { target: 'toilettes', native: 'bathroom', theme: 'places' },
      ],
      phrases: [
        { target: 'Comment ça va ?', native: 'How are you?', context: 'general' },
        { target: 'Enchanté(e)', native: 'Nice to meet you', context: 'general' },
        { target: 'Où sont les toilettes ?', native: 'Where is the bathroom?', context: 'travel' },
        { target: 'Ça coûte combien ?', native: 'How much is it?', context: 'shopping' },
        { target: "Je ne comprends pas", native: "I don't understand", context: 'learning' },
        { target: 'Parlez-vous anglais ?', native: 'Do you speak English?', context: 'travel' },
        { target: "Je voudrais ceci, s’il vous plaît", native: 'I would like this, please', context: 'restaurant' },
        { target: 'Pardon', native: 'Excuse me / Sorry', context: 'polite' },
        { target: 'Bonjour', native: 'Good morning', context: 'greeting' },
        { target: 'Bonne nuit', native: 'Good night', context: 'greeting' },
        { target: 'Pouvez-vous m’aider ?', native: 'Can you help me?', context: 'help' },
        { target: 'J’apprends le français', native: 'I am learning French', context: 'learning' },
      ],
      tips: [
        'Voyelles nasales: on, an, in — pratique lente',
        'Liaison: relie mots pour fluidité (les_amis)',
        'R antérieure: gorge légère, pas roulée',
        'E muet souvent chuté en fin de mot',
        'Genres: le/la; accords au pluriel',
        'Tu/vous: politesse selon contexte',
        'Groupes: ou= /u/, eu= /ø/ ~ /œ/',
        'Imite prosodie de locuteurs natifs',
      ],
    },
  };

  const preset = presets[targetName as keyof typeof presets];

  const numbers = preset?.numbers ?? (
    Array.from({ length: 21 }, (_, v) => ({ value: v, target: String(v), pronunciation: String(v) }))
      .concat([20,30,40,50,60,70,80,90,100].map(v => ({ value: v, target: String(v), pronunciation: String(v) })))
  );

  const commonWords = preset?.commonWords ?? [
    { target: 'hello', native: 'hello', theme: 'people' },
    { target: 'please', native: 'please', theme: 'people' },
    { target: 'thank you', native: 'thank you', theme: 'people' },
    { target: 'yes', native: 'yes', theme: 'people' },
    { target: 'no', native: 'no', theme: 'people' },
    { target: 'family', native: 'family', theme: 'people' },
    { target: 'friend', native: 'friend', theme: 'people' },
    { target: 'today', native: 'today', theme: 'time' },
    { target: 'tomorrow', native: 'tomorrow', theme: 'time' },
    { target: 'yesterday', native: 'yesterday', theme: 'time' },
    { target: 'house', native: 'house', theme: 'places' },
    { target: 'city', native: 'city', theme: 'places' },
    { target: 'school', native: 'school', theme: 'places' },
    { target: 'water', native: 'water', theme: 'food' },
    { target: 'bread', native: 'bread', theme: 'food' },
    { target: 'coffee', native: 'coffee', theme: 'food' },
    { target: 'train', native: 'train', theme: 'travel' },
    { target: 'airport', native: 'airport', theme: 'travel' },
    { target: 'ticket', native: 'ticket', theme: 'travel' },
    { target: 'bathroom', native: 'bathroom', theme: 'places' },
  ];

  const phrases = preset?.phrases ?? [
    { target: 'How are you?', native: 'How are you?', context: 'general' },
    { target: 'Nice to meet you', native: 'Nice to meet you', context: 'general' },
    { target: 'Where is the bathroom?', native: 'Where is the bathroom?', context: 'travel' },
    { target: 'How much is it?', native: 'How much is it?', context: 'shopping' },
    { target: "I don't understand", native: "I don't understand", context: 'learning' },
    { target: 'Do you speak English?', native: 'Do you speak English?', context: 'travel' },
    { target: 'I would like this, please', native: 'I would like this, please', context: 'restaurant' },
    { target: 'Excuse me', native: 'Excuse me', context: 'polite' },
    { target: 'Good morning', native: 'Good morning', context: 'greeting' },
    { target: 'Good night', native: 'Good night', context: 'greeting' },
    { target: 'Can you help me?', native: 'Can you help me?', context: 'help' },
    { target: 'I am learning', native: 'I am learning', context: 'learning' },
  ];

  const tips = (preset?.tips ?? [
    'Practice daily for short bursts',
    `Focus on sounds that don’t exist in ${nativeName}`,
    'Learn numbers and greetings first',
    'Repeat out loud to improve memory',
    'Use flashcards and quick quizzes',
    'Associate new words with images',
    'Review mistakes immediately',
    'Celebrate small wins to keep streaks',
  ]);

  return { alphabet, numbers, commonWords, phrases, tips };
}

export const getLearnContentProcedure = publicProcedure
  .input(
    z.object({
      targetName: z.string().min(1),
      nativeName: z.string().min(1),
    })
  )
  .query(async ({ input }) => {
    const { targetName, nativeName } = input;

    try {
      const prompt = `Create compact structured JSON for a language LEARN page for learners of ${targetName} whose native language is ${nativeName}.
Return ONLY JSON with keys: alphabet, numbers, commonWords, phrases, tips, phonics.
- alphabet: 26-40 important items covering the full script/alphabet for ${targetName}. Each item: {id, character, romanization, pronunciation, type, difficulty, examples:[{word, translation (in ${nativeName}), pronunciation}]}.
- numbers: list for 0-20, then tens up to 100. Each: {value, target, pronunciation}.
- commonWords: 30 items mixing themes (people, time, places, food, travel). Each: {target, native (${nativeName}), pronunciation, theme}.
- phrases: 30 high-utility phrases. Each: {target, native (${nativeName}), pronunciation, context}.
- tips: 8 bullet tips about pronunciation, stress, rhythm, polite forms, gender/particles, common pitfalls, mnemonic hooks. Keep tips in ${nativeName}.
- phonics: 12-24 sound units for ${targetName}. Each item: {id, sound, ipa (if available; else omit), graphemes (array of orthographic spellings), examples:[{word, translation (in ${nativeName})}], mouthHint}.
Constraints:
- Use plain text, no markdown; ensure valid JSON only.
- Keep strings short; romanization simple; omit romanization where not applicable.`;

      const res = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });

      if (!res.ok) {
        return buildFallbackContent(nativeName, targetName);
      }

      const json = (await res.json()) as { completion?: string };
      let content: string = String(json.completion ?? '').trim();
      if (content.includes('```')) {
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      }
      const match = content.match(/\{[\s\S]*\}/);
      if (match) content = match[0];

      let parsed: LearnPayload | null = null;
      try {
        parsed = JSON.parse(content) as LearnPayload;
      } catch (e) {
        return buildFallbackContent(nativeName, targetName);
      }

      const shaped: LearnPayload = {
        alphabet: Array.isArray(parsed?.alphabet) ? parsed!.alphabet : [],
        numbers: Array.isArray(parsed?.numbers) ? parsed!.numbers : [],
        commonWords: Array.isArray(parsed?.commonWords) ? parsed!.commonWords : [],
        phrases: Array.isArray(parsed?.phrases) ? parsed!.phrases : [],
        tips: Array.isArray(parsed?.tips) ? parsed!.tips : [],
        phonics: Array.isArray((parsed as any)?.phonics) ? (parsed as any).phonics as PhonicsEntry[] : [],
      };

      return shaped;
    } catch {
      return buildFallbackContent(nativeName, targetName);
    }
  });