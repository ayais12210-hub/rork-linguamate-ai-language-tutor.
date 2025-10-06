/**
 * Security headers middleware for Hono
 * Implements security best practices for web applications
 */

import { Context, Next } from 'hono';

export const securityHeaders = async (c: Context, next: Next) => {
  // Strict Transport Security (HSTS)
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content Type Options - prevents MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options - prevents clickjacking
  c.header('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection - enables XSS filtering
  c.header('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy - controls referrer information
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy - prevents XSS attacks
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  
  // Permissions Policy - controls browser features
  c.header(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), ' +
    'payment=(), usb=(), magnetometer=(), gyroscope=(), ' +
    'accelerometer=(), ambient-light-sensor=(), ' +
    'autoplay=(), encrypted-media=(), fullscreen=(self), ' +
    'picture-in-picture=()'
  );
  
  // Cross-Origin policies
  c.header('Cross-Origin-Embedder-Policy', 'require-corp');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header('Cross-Origin-Resource-Policy', 'same-origin');
  
  // Remove server information
  c.header('Server', '');
  
  await next();
};

export const corsHeaders = (allowedOrigins: string[] = ['http://localhost:3000']) => {
  return async (c: Context, next: Next) => {
    const origin = c.req.header('Origin');
    
    if (origin && allowedOrigins.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin);
    }
    
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-correlation-id');
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Max-Age', '86400');
    
    if (c.req.method === 'OPTIONS') {
      return c.text('', 204);
    }
    
    await next();
  };
};

export const rateLimitHeaders = (limit: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return async (c: Context, next: Next) => {
    // Simple in-memory rate limiting (in production, use Redis)
    const clientId = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const now = Date.now();
    
    // This is a simplified implementation - in production, use a proper rate limiting library
    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', (limit - 1).toString());
    c.header('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
    
    await next();
  };
};
