import { cors } from 'hono/cors';
import type { Context } from 'hono';

/**
 * Environment-aware CORS configuration
 * Strict origin checking in production, permissive in development
 */
export function getCorsMiddleware() {
  const isDev = process.env.NODE_ENV === 'development';
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
  
  // Add localhost variations for development
  if (isDev) {
    allowedOrigins.push(
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19006',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:19006',
      'exp://localhost:8081',
      'exp://127.0.0.1:8081'
    );
  }
  
  return cors({
    origin: (origin, c: Context) => {
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin) {
        return isDev ? '*' : null;
      }
      
      // In development, be permissive
      if (isDev) {
        return origin;
      }
      
      // In production, strict origin checking
      if (allowedOrigins.length === 0) {
        console.error('CORS: No allowed origins configured in production!');
        return null;
      }
      
      // Check if origin is in allowed list
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed === origin) return true;
        // Support wildcard subdomains (e.g., *.example.com)
        if (allowed.startsWith('*.')) {
          const domain = allowed.slice(2);
          return origin.endsWith(domain);
        }
        return false;
      });
      
      if (!isAllowed) {
        console.warn(`CORS: Blocked origin ${origin}`);
      }
      
      return isAllowed ? origin : null;
    },
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'x-correlation-id',
      'x-session-id',
      'x-request-id',
      'x-client-version',
      'x-device-id'
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: process.env.CORS_ALLOW_CREDENTIALS === 'true',
    maxAge: 86400, // 24 hours
  });
}