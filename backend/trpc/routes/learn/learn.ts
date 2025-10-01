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
  const numbers = Array.from({ length: 21 }, (_, v) => ({ value: v, target: String(v), pronunciation: String(v) }))
    .concat([20,30,40,50,60,70,80,90,100].map(v => ({ value: v, target: String(v), pronunciation: String(v) })));
  const themes = ['people','time','places','food','travel'];
  const commonWords = Array.from({ length: 30 }, (_, i) => ({ target: `${targetName} word ${i+1}`, native: `${nativeName} word ${i+1}`, pronunciation: undefined, theme: themes[i % themes.length] }));
  const phrases = Array.from({ length: 20 }, (_, i) => ({ target: `${targetName} phrase ${i+1}`, native: `${nativeName} phrase ${i+1}`, pronunciation: undefined, context: 'general' }));
  const tips = [
    `Practice daily for short bursts`,
    `Focus on sounds that don’t exist in ${nativeName}`,
    `Learn numbers and greetings first`,
    `Repeat out loud to improve memory`,
    `Use flashcards and quick quizzes`,
    `Associate new words with images`,
    `Review mistakes immediately`,
    `Celebrate small wins to keep streaks`,
  ];
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