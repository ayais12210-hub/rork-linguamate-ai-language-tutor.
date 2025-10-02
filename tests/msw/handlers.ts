import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('**/api/trpc/*', async ({ request }) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.includes('example.hi')) {
      return HttpResponse.json({
        result: {
          data: { greeting: 'Hello from mock!' },
        },
      });
    }

    if (pathname.includes('auth.login')) {
      return HttpResponse.json({
        result: {
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              name: 'Test User',
            },
            token: 'mock-jwt-token',
          },
        },
      });
    }

    if (pathname.includes('lessons.list')) {
      return HttpResponse.json({
        result: {
          data: [
            {
              id: 'lesson-1',
              title: 'Punjabi Basics',
              language: 'pa',
              level: 'A1',
              xpReward: 10,
            },
          ],
        },
      });
    }

    return HttpResponse.json({
      result: { data: null },
    });
  }),

  http.get('**/healthz', () => {
    return HttpResponse.json({ ok: true, timestamp: Date.now() });
  }),

  http.get('**/api/health', () => {
    return HttpResponse.json({ status: 'healthy', uptime: 1000 });
  }),
];
