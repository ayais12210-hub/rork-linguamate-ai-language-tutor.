import { randomUUID } from 'crypto';
import { Topic, Scene, Session } from '@/schemas/dialogue.schema';

export const MOCK_TOPICS: Topic[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Greetings & Introductions',
    description: 'Learn how to greet people and introduce yourself',
    icon: '👋',
    sceneCount: 3,
    completedCount: 0,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'At the Restaurant',
    description: 'Order food and drinks confidently',
    icon: '🍽️',
    sceneCount: 4,
    completedCount: 0,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Shopping',
    description: 'Navigate stores and make purchases',
    icon: '🛍️',
    sceneCount: 3,
    completedCount: 0,
  },
];

export const MOCK_SCENES: Scene[] = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    topicId: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Meeting Someone New',
    description: 'Practice introducing yourself to a new person',
    level: 'beginner',
    goal: 'Introduce yourself with name and greeting',
    keyPhrases: ['hello', 'my name is', 'nice to meet you'],
    tags: ['greetings', 'introductions', 'basic'],
    starterTurns: [
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        role: 'system',
        text: 'You are meeting someone at a coffee shop. Greet them and introduce yourself.',
        lang: 'en',
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440002',
        role: 'npc',
        text: 'Hello! How are you today?',
        lang: 'en',
      },
    ],
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    topicId: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Asking About Someone',
    description: 'Learn to ask basic questions about others',
    level: 'intermediate',
    goal: 'Ask about name, origin, and occupation',
    keyPhrases: ['what is your name', 'where are you from', 'what do you do'],
    tags: ['questions', 'conversation', 'intermediate'],
    starterTurns: [
      {
        id: '770e8400-e29b-41d4-a716-446655440003',
        role: 'system',
        text: 'You want to learn more about your new friend. Ask them questions.',
        lang: 'en',
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440004',
        role: 'npc',
        text: 'I\'m glad we met! What would you like to know about me?',
        lang: 'en',
      },
    ],
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    topicId: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Ordering a Meal',
    description: 'Order food at a restaurant',
    level: 'beginner',
    goal: 'Order a dish and drink',
    keyPhrases: ['I would like', 'please', 'thank you', 'menu'],
    tags: ['restaurant', 'food', 'ordering'],
    starterTurns: [
      {
        id: '770e8400-e29b-41d4-a716-446655440005',
        role: 'system',
        text: 'You are at a restaurant. The waiter is ready to take your order.',
        lang: 'en',
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440006',
        role: 'npc',
        text: 'Good evening! Are you ready to order?',
        lang: 'en',
      },
    ],
  },
];

const sessions: Map<string, Session> = new Map();

export function getTopics(): Topic[] {
  return MOCK_TOPICS;
}

export function getScenesByTopic(topicId: string): Scene[] {
  return MOCK_SCENES.filter((s) => s.topicId === topicId);
}

export function getSceneById(sceneId: string): Scene | undefined {
  return MOCK_SCENES.find((s) => s.id === sceneId);
}

export function createSession(
  sceneId: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Session {
  const session: Session = {
    id: randomUUID(),
    sceneId,
    startedAt: Date.now(),
    turns: [],
    scores: [],
    difficulty,
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function updateSession(sessionId: string, updates: Partial<Session>): Session | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const updated = { ...session, ...updates };
  sessions.set(sessionId, updated);
  return updated;
}
