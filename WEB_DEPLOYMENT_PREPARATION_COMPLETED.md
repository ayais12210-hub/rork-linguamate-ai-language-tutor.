# Web Deployment Preparation - Completed Template

This document provides comprehensive guidance for deploying Linguamate as a web application using React Native Web.

## Deployment Overview

- **Domain**: linguamate.app
- **Hosting Provider**: Vercel (recommended) or Netlify
- **Build Command**: `expo export --platform web`
- **Output Directory**: `dist/`
- **Node Version**: 18.x or higher
- **Framework**: Expo + React Native Web

## Environment Configuration

### Environment Variables

#### Required Variables
```bash
# Backend API URL (if hosted separately)
EXPO_PUBLIC_BACKEND_URL=https://api.linguamate.app

# Rork Toolkit URL (for AI features)
EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com
```

#### Optional Variables
```bash
# Analytics (if using)
EXPO_PUBLIC_ANALYTICS_ID=your-analytics-id

# Feature Flags
EXPO_PUBLIC_ENABLE_PREMIUM=false
EXPO_PUBLIC_ENABLE_SOCIAL=false
```

### Important Notes
- Only `EXPO_PUBLIC_*` variables are accessible in the client
- Never expose secrets or API keys in client-side code
- Backend URL defaults to same origin if not set
- All environment variables are embedded at build time

## Hosting Setup

### Option 1: Vercel (Recommended)

#### Why Vercel?
- Excellent Expo/Next.js support
- Automatic HTTPS
- Global CDN
- Easy environment variable management
- Automatic deployments from Git
- Generous free tier

#### Setup Steps

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Initialize Project**
```bash
vercel
```

4. **Configure vercel.json**
```json
{
  "version": 2,
  "name": "linguamate",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://api.linguamate.app/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

5. **Add Build Script to package.json**
```json
{
  "scripts": {
    "build": "expo export --platform web"
  }
}
```

6. **Deploy**
```bash
vercel --prod
```

7. **Configure Custom Domain**
- Go to Vercel dashboard
- Add domain: linguamate.app
- Configure DNS records as instructed
- Enable automatic HTTPS

### Option 2: Netlify

#### Setup Steps

1. **Install Netlify CLI**
```bash
npm i -g netlify-cli
```

2. **Login to Netlify**
```bash
netlify login
```

3. **Configure netlify.toml**
```toml
[build]
  command = "expo export --platform web"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://api.linguamate.app/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

4. **Deploy**
```bash
netlify deploy --prod
```

### Option 3: Custom Server (Advanced)

If you need more control, deploy to your own server:

1. **Build the app**
```bash
bun run build:web
```

2. **Serve with Nginx**
```nginx
server {
    listen 80;
    server_name linguamate.app;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name linguamate.app;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/linguamate/dist;
    index index.html;
    
    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # API proxy
    location /api/ {
        proxy_pass https://api.linguamate.app/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static assets caching
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Backend Configuration

### If Backend is Separate

1. **Configure CORS**
```typescript
// backend/hono.ts
import { cors } from 'hono/cors';

app.use('/*', cors({
  origin: [
    'https://linguamate.app',
    'https://www.linguamate.app',
    'http://localhost:8081', // Development
  ],
  credentials: true,
}));
```

2. **Set Environment Variable**
```bash
EXPO_PUBLIC_BACKEND_URL=https://api.linguamate.app
```

### If Backend is Same Origin

- No EXPO_PUBLIC_BACKEND_URL needed
- Backend served at `/api`
- Use proxy/rewrites in hosting config

## DNS Configuration

### Domain: linguamate.app

#### A Records (if using custom server)
```
Type: A
Name: @
Value: [Your server IP]
TTL: 3600

Type: A
Name: www
Value: [Your server IP]
TTL: 3600
```

#### CNAME Records (if using Vercel/Netlify)
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com (or Netlify equivalent)
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### API Subdomain (if separate backend)
```
Type: A
Name: api
Value: [Backend server IP]
TTL: 3600
```

## SSL/TLS Configuration

### Automatic (Vercel/Netlify)
- SSL certificates automatically provisioned
- Auto-renewal handled by platform
- No manual configuration needed

### Manual (Custom Server)
```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d linguamate.app -d www.linguamate.app
```

## Performance Optimization

### Build Optimization

1. **Enable Production Mode**
```bash
NODE_ENV=production expo export --platform web
```

2. **Optimize Images**
- Use WebP format where supported
- Implement lazy loading
- Use responsive images
- Compress images before upload

3. **Code Splitting**
- Expo automatically splits code
- Lazy load routes with React.lazy()
- Use dynamic imports for large components

4. **Caching Strategy**
```javascript
// Service worker for offline support (future)
// Cache static assets
// Cache API responses with stale-while-revalidate
```

### CDN Configuration

1. **Static Assets**
- Serve from CDN (Vercel/Netlify includes this)
- Set long cache headers (1 year)
- Use immutable flag

2. **Image CDN** (Optional)
- Use Cloudinary or similar
- Automatic format conversion
- Responsive image delivery

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **INP (Interaction to Next Paint)**: < 200ms

### Monitoring
```javascript
// Add to app/_layout.tsx
if (typeof window !== 'undefined') {
  // Web Vitals monitoring
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
}
```

## SEO Configuration

### Meta Tags

Create `app.json` or update existing:
```json
{
  "expo": {
    "web": {
      "name": "Linguamate - AI Language Tutor",
      "shortName": "Linguamate",
      "description": "Master any language with AI-powered lessons, conversation practice, and expert modules.",
      "lang": "en",
      "backgroundColor": "#ffffff",
      "themeColor": "#6366f1",
      "display": "standalone",
      "orientation": "portrait",
      "startUrl": "/",
      "scope": "/",
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

### robots.txt

Create `public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://linguamate.app/sitemap.xml
```

### sitemap.xml

Create `public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://linguamate.app/</loc>
    <lastmod>2025-10-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://linguamate.app/learn</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://linguamate.app/lessons</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://linguamate.app/modules</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://linguamate.app/chat</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://linguamate.app/profile</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://linguamate.app/privacy-policy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://linguamate.app/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

### Open Graph Tags

Add to HTML head (via Expo config):
```html
<meta property="og:title" content="Linguamate - AI Language Tutor" />
<meta property="og:description" content="Master any language with AI-powered lessons, conversation practice, and expert modules." />
<meta property="og:image" content="https://linguamate.app/og-image.png" />
<meta property="og:url" content="https://linguamate.app" />
<meta property="og:type" content="website" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Linguamate - AI Language Tutor" />
<meta name="twitter:description" content="Master any language with AI-powered lessons, conversation practice, and expert modules." />
<meta name="twitter:image" content="https://linguamate.app/twitter-image.png" />
```

## Analytics & Monitoring

### Google Analytics (Optional)
```javascript
// Add to app/_layout.tsx
if (typeof window !== 'undefined' && process.env.EXPO_PUBLIC_GA_ID) {
  // Initialize GA
}
```

### Error Tracking
- Use Sentry or similar
- Track client-side errors
- Monitor API failures
- Track performance issues

### Uptime Monitoring
- Use UptimeRobot or Pingdom
- Monitor main domain
- Monitor API endpoints
- Set up alerts

## Security

### Security Headers (Already Configured)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy (optional, add if needed)

### HTTPS
- Always use HTTPS in production
- Redirect HTTP to HTTPS
- Use HSTS header (optional)

### API Security
- CORS properly configured
- Rate limiting on backend
- Input validation
- No secrets in client code

## Testing

### Pre-Deployment Checklist

- [ ] Build succeeds locally: `bun run build:web`
- [ ] Test in multiple browsers:
  - [ ] Chrome/Edge (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
- [ ] Test responsive design:
  - [ ] Mobile (320px - 480px)
  - [ ] Tablet (768px - 1024px)
  - [ ] Desktop (1280px+)
- [ ] Test all routes:
  - [ ] / (home/onboarding)
  - [ ] /learn
  - [ ] /lessons
  - [ ] /modules
  - [ ] /chat
  - [ ] /profile
  - [ ] /privacy-policy
  - [ ] /terms
- [ ] Test offline functionality
- [ ] Test error boundaries
- [ ] Test API connectivity
- [ ] Test microphone permission (if applicable)
- [ ] Verify no console errors
- [ ] Check Core Web Vitals
- [ ] Test deep linking
- [ ] Test browser back/forward
- [ ] Test page refresh on routes

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 https://linguamate.app/

# Using k6
k6 run load-test.js
```

## Deployment Workflow

### Manual Deployment
```bash
# 1. Build
bun run build:web

# 2. Test build locally
npx serve dist

# 3. Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

### Automated Deployment (CI/CD)

#### GitHub Actions
```yaml
name: Deploy Web

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install dependencies
        run: bun install
        
      - name: Build
        run: bun run build:web
        env:
          EXPO_PUBLIC_BACKEND_URL: ${{ secrets.BACKEND_URL }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Post-Deployment

### Verification
- [ ] Visit https://linguamate.app
- [ ] Check all routes work
- [ ] Verify API connectivity
- [ ] Test user flows
- [ ] Check analytics tracking
- [ ] Monitor error logs
- [ ] Check performance metrics

### Monitoring
- Set up uptime monitoring
- Configure error alerts
- Monitor Core Web Vitals
- Track user analytics
- Monitor API usage

### Maintenance
- Regular dependency updates
- Security patches
- Performance optimization
- Content updates
- Bug fixes

## Rollback Plan

### If Deployment Fails
1. Check build logs
2. Verify environment variables
3. Test locally
4. Fix issues
5. Redeploy

### If Production Issues
1. Rollback to previous version (Vercel/Netlify UI)
2. Investigate issue
3. Fix in development
4. Test thoroughly
5. Redeploy

## Support & Resources

- **Expo Web Docs**: https://docs.expo.dev/workflow/web/
- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **React Native Web**: https://necolas.github.io/react-native-web/

## Contact

- **Technical Support**: support@linguamate.app
- **DevOps**: devops@linguamate.app
- **Emergency**: emergency@linguamate.app

---

**Last Updated**: 2025-10-02
**Status**: Template - Ready for deployment
**Next Steps**: Choose hosting provider, configure DNS, deploy
