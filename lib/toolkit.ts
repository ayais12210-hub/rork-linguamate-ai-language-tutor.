import type { ZodType } from 'zod';
import type { CoreMessage } from '@/lib/api';
import { apiClient } from '@/lib/api';

export async function generateObject<T>({
  messages,
  schema,
}: {
  messages: CoreMessage[];
  schema: ZodType<T>;
}): Promise<T> {
  const res = await apiClient.generateText(messages);
  const text = String((res as any)?.completion ?? '');
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const jsonStr = match ? match[0] : text;
    const parsed = JSON.parse(jsonStr);
    return schema.parse(parsed) as T;
  } catch (e) {
    throw new Error('AI_PARSE_ERROR');
  }
}
