import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('**/healthz', () => {
    return HttpResponse.json({ ok: true });
  }),

  http.get('**/api/health', () => {
    return HttpResponse.json({ status: 'healthy', timestamp: Date.now() });
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
