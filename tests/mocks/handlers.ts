// MSW handlers for API mocking
import { http, HttpResponse } from 'msw';
import { z } from 'zod';

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  preferences: {
    language: 'en',
    theme: 'light',
  },
};

const mockLessons = [
  {
    id: 'lesson-1',
    title: 'Basic Greetings',
    difficulty: 'beginner',
    content: 'Hello, how are you?',
  },
  {
    id: 'lesson-2',
    title: 'Numbers',
    difficulty: 'beginner',
    content: 'One, two, three...',
  },
];

// Error responses
const createErrorResponse = (message: string, code: string, status = 400) => {
  return HttpResponse.json(
    {
      error: {
        message,
        code,
        timestamp: Date.now(),
      },
    },
    { status }
  );
};

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    
    if (body.email === 'error@example.com') {
      return createErrorResponse('Invalid credentials', 'AUTH_ERROR', 401);
    }
    
    if (body.email === 'server@example.com') {
      return createErrorResponse('Internal server error', 'SERVER_ERROR', 500);
    }
    
    return HttpResponse.json({
      user: mockUser,
      token: 'mock-jwt-token',
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // User endpoints
  http.get('/api/user/profile', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('Unauthorized', 'AUTH_ERROR', 401);
    }
    
    return HttpResponse.json(mockUser);
  }),

  http.put('/api/user/profile', async ({ request }) => {
    const body = await request.json();
    
    // Simulate validation error
    if (body.email === 'invalid-email') {
      return createErrorResponse('Invalid email format', 'VALIDATION_ERROR', 400);
    }
    
    return HttpResponse.json({
      ...mockUser,
      ...body,
    });
  }),

  // Lessons endpoints
  http.get('/api/lessons', ({ request }) => {
    const url = new URL(request.url);
    const difficulty = url.searchParams.get('difficulty');
    
    let filteredLessons = mockLessons;
    if (difficulty) {
      filteredLessons = mockLessons.filter(lesson => lesson.difficulty === difficulty);
    }
    
    return HttpResponse.json({
      lessons: filteredLessons,
      total: filteredLessons.length,
    });
  }),

  http.get('/api/lessons/:id', ({ params }) => {
    const lesson = mockLessons.find(l => l.id === params.id);
    
    if (!lesson) {
      return createErrorResponse('Lesson not found', 'NOT_FOUND', 404);
    }
    
    return HttpResponse.json(lesson);
  }),

  // Network error simulation
  http.get('/api/network-error', () => {
    return HttpResponse.error();
  }),

  // Timeout simulation
  http.get('/api/timeout', async () => {
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
    return HttpResponse.json({ message: 'This should timeout' });
  }),

  // Invalid JSON response
  http.get('/api/invalid-json', () => {
    return new HttpResponse('invalid json{', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }),

  // Rate limit simulation
  http.get('/api/rate-limit', () => {
    return createErrorResponse('Rate limit exceeded', 'RATE_LIMIT', 429);
  }),

  // Server error simulation
  http.get('/api/server-error', () => {
    return createErrorResponse('Internal server error', 'SERVER_ERROR', 500);
  }),

  // tRPC endpoints (if using tRPC)
  http.post('/api/trpc/user.getProfile', () => {
    return HttpResponse.json({
      result: {
        data: mockUser,
      },
    });
  }),

  http.post('/api/trpc/lessons.getAll', () => {
    return HttpResponse.json({
      result: {
        data: {
          lessons: mockLessons,
          total: mockLessons.length,
        },
      },
    });
  }),

  // tRPC error simulation
  http.post('/api/trpc/error.test', () => {
    return HttpResponse.json(
      {
        error: {
          message: 'tRPC error',
          code: 'INTERNAL_SERVER_ERROR',
          data: {
            code: 'INTERNAL_SERVER_ERROR',
            httpStatus: 500,
          },
        },
      },
      { status: 500 }
    );
  }),
];

// Helper to create dynamic handlers for testing
export const createMockHandler = (
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  response: any,
  status = 200
) => {
  return http[method](path, () => {
    return HttpResponse.json(response, { status });
  });
};

export const createErrorHandler = (
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  message: string,
  code: string,
  status = 400
) => {
  return http[method](path, () => {
    return createErrorResponse(message, code, status);
  });
};