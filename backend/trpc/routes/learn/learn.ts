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

export interface LearnPayload {
  alphabet: AlphabetEntry[];
  numbers: Array<{ value: number; target: string; pronunciation?: string }>;
  commonWords: Array<{ target: string; native: string; pronunciation?: string; theme: string }>;
  phrases: Array<{ target: string; native: string; pronunciation?: string; context: string }>;
  tips: string[];
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

    const prompt = `Create compact structured JSON for a language LEARN page for learners of ${targetName} whose native language is ${nativeName}.
Return ONLY JSON with keys: alphabet, numbers, commonWords, phrases, tips.
- alphabet: 26-40 important items covering the full script/alphabet for ${targetName}. Each item: {id, character, romanization, pronunciation, type, difficulty, examples:[{word, translation (in ${nativeName}), pronunciation}]}.
- numbers: list for 0-20, then tens up to 100. Each: {value, target, pronunciation}.
- commonWords: 30 items mixing themes (people, time, places, food, travel). Each: {target, native (${nativeName}), pronunciation, theme}.
- phrases: 30 high-utility phrases. Each: {target, native (${nativeName}), pronunciation, context}.
- tips: 8 bullet tips about pronunciation, stress, rhythm, polite forms, gender/particles, common pitfalls, mnemonic hooks. Keep tips in ${nativeName}.
Constraints:
- Use plain text, no IPA if unnecessary; keep romanization simple if applicable; omit romanization if language is Latin-based.
- Keep strings short and clean; avoid markdown; ensure valid JSON.`;

    const res = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
    });

    if (!res.ok) {
      throw new Error('Failed to generate content');
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
      throw new Error('Invalid content format');
    }

    const shaped: LearnPayload = {
      alphabet: Array.isArray(parsed?.alphabet) ? parsed!.alphabet : [],
      numbers: Array.isArray(parsed?.numbers) ? parsed!.numbers : [],
      commonWords: Array.isArray(parsed?.commonWords) ? parsed!.commonWords : [],
      phrases: Array.isArray(parsed?.phrases) ? parsed!.phrases : [],
      tips: Array.isArray(parsed?.tips) ? parsed!.tips : [],
    };

    return shaped;
  });