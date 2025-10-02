import { User } from '@/types/user';

export type WindowingStrategy = 'last-n' | 'time' | 'tokens';

export interface PromptConfig {
  maxTokens: number;
  maxContextMessages: number;
  windowing: WindowingStrategy;
}

export interface BuiltPrompt {
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  maxTokens: 512,
  maxContextMessages: 10,
  windowing: 'last-n',
};

export function buildSystemPrompt(user: User, targetLanguageName: string, nativeLanguageName: string): string {
  const goals = user.learningGoals?.length ? user.learningGoals.join(', ') : 'general language learning';
  const interests = user.interests?.length ? user.interests.join(', ') : 'various topics';
  const topics = user.preferredTopics?.length ? user.preferredTopics.join(', ') : 'everyday conversations';

  return [
    `You are an expert AI language coach for a ${user.proficiencyLevel} student learning ${targetLanguageName}.`,
    `Student's native language is ${nativeLanguageName}.`,
    '',
    'Student Profile:',
    `- Goals: ${goals}`,
    `- Interests: ${interests}`,
    `- Preferred Topics: ${topics}`,
    `- Daily Goal: ${user.dailyGoalMinutes ?? 15} minutes`,
    '',
    'Response Format (always include all sections):',
    `🎯 [Your response in ${targetLanguageName}]`,
    ``,
    `💬 [Translation in ${nativeLanguageName}]`,
    ``,
    `📝 [Short explanation or context in ${nativeLanguageName}]`,
    '',
    'Guidelines:',
    `1) Adapt difficulty to ${user.proficiencyLevel}`,
    '2) Be encouraging and concise',
    '3) Gently correct mistakes with short explanations',
    `4) Use interests (${interests}) and topics (${topics}) when possible`,
    '5) Provide cultural/context notes sparingly',
  ].join('\n');
}

export function windowConversation(
  history: { role: 'user' | 'assistant'; content: string }[],
  cfg: PromptConfig = DEFAULT_PROMPT_CONFIG
) {
  if (cfg.windowing === 'last-n') {
    return history.slice(-cfg.maxContextMessages);
  }
  return history.slice(-cfg.maxContextMessages);
}
