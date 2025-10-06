import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('**/healthz', () => {
    return HttpResponse.json({ ok: true });
  }),

  http.get('**/api/health', () => {
    return HttpResponse.json({ status: 'healthy', timestamp: Date.now() });
  }),

  // STT transcribe endpoint mock
  http.post('**/api/stt/transcribe', async () => {
    return HttpResponse.json({ 
      text: 'Detected speech example',
      language: 'en',
      confidence: 0.95
    });
  }),

  // Simple STT endpoint for mobile fallback
  http.post('**/api/stt', async () => {
    return HttpResponse.json({ text: 'hello world (mocked)' });
  }),

  http.post('**/api/trpc/*', async ({ request }) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.includes('example.hi')) {
      return HttpResponse.json({
        result: {
          data: { greeting: 'Hello from mock!' }
        }
      });
    }

    if (pathname.includes('auth.login')) {
      return HttpResponse.json({
        result: {
          data: {
            user: { id: '1', email: 'test@example.com', name: 'Test User' },
            token: 'mock-jwt-token'
          }
        }
      });
    }

    if (pathname.includes('lessons.list')) {
      return HttpResponse.json({
        result: {
          data: [
            {
              id: '1',
              title: 'Punjabi Basics',
              language: 'pa',
              level: 'A1',
              xpReward: 10
            }
          ]
        }
      });
    }

    if (pathname.includes('lesson.generate')) {
      return HttpResponse.json({
        result: {
          data: {
            json: {
              items: [
                { id: '1', type: 'mcq', question: 'What is hello?', options: ['Hola', 'Bonjour'], answer: 0 }
              ]
            }
          }
        }
      });
    }

    return HttpResponse.json({
      result: { data: null }
    });
  }),

  http.get('**/api/trpc/*', async ({ request }) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.includes('user.profile')) {
      return HttpResponse.json({
        result: {
          data: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            xp: 100,
            level: 5
          }
        }
      });
    }

    return HttpResponse.json({
      result: { data: null }
    });
  })
];
