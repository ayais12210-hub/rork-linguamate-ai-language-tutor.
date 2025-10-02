# Web Deployment Preparation

- Domain: <yourdomain.com>
- Hosting: <Vercel/Netlify/Other>
- Build command: expo export --platform web (CI) or npx expo start --web for preview
- Output: dist/ (Expo web export) or .next/ if using SSR (not used here)
- Environment variables: EXPO_PUBLIC_* only; no secrets in client
- Robots.txt and sitemap.xml configured
- 404 and 200 rewrites to index.html for SPA routing
- Image origins allowed via CORS

Performance
- Preload critical fonts (system preferred to avoid custom fonts)
- Use responsive images; CDN caching
- Core Web Vitals budget: LCP <2.5s, CLS <0.1, INP <200ms

