# 🌐 Web Deployment Preparation — Linguamate

This document provides a comprehensive checklist for deploying the **Linguamate AI Language Tutor** web application into a production-ready environment.  
It covers hosting setup, build configuration, environment variables, SEO, performance, security, and monitoring considerations.  

---

## 1. Domain & Hosting

- **Domain:**  
  - Example: `https://linguamate.ai` or `https://app.linguamate.ai`  
  - DNS managed via registrar (e.g., Cloudflare, Namecheap, Route53).  
  - Point `A` or `CNAME` records to hosting provider.  

- **Hosting Provider:**  
  - Vercel (recommended for Expo + React Native Web static exports).  
  - Alternatives: Netlify, Cloudflare Pages, GitHub Pages (less feature-rich).  
  - Ensure provider supports:  
    - HTTP/2 or HTTP/3  
    - Automatic SSL/TLS with Let’s Encrypt  
    - CDN edge caching for global delivery  

---

## 2. Build & Export Configuration

- **Build Commands:**  
  - Preview:  
    ```bash
    npx expo start --web
    ```  
  - CI/CD export:  
    ```bash
    expo export --platform web
    ```  

- **Output Directory:**  
  - `dist/` (Expo static export)  
  - If using Next.js with SSR: `.next/` (not currently required)  

- **CI/CD Pipeline:**  
  - GitHub Actions → build on push/merge → deploy to Vercel/Netlify.  
  - Cache `node_modules` and `.expo` for faster builds.  
  - Run `bunx playwright test` for E2E before deploy.  
  - Lint + Typecheck gates in CI.  

---

## 3. Environment Variables

- Use **Expo public variables only**:  
  - `EXPO_PUBLIC_BACKEND_URL` → API base URL (`https://api.linguamate.ai`)  
  - `EXPO_PUBLIC_TOOLKIT_URL` → AI service endpoints (`https://toolkit.rork.com`)  

- **Rules:**  
  - Never commit secrets (API keys, DB credentials).  
  - Expo “public” vars are bundled into the client → safe for non-sensitive endpoints only.  
  - Secrets belong in backend services or hosting provider’s secret manager.  

---

## 4. Routing & SPA Configuration

- **404 / 200 Rules:**  
  - All unknown routes must rewrite to `index.html` (for SPA navigation).  
  - Example (Netlify `_redirects`):  
    ```
    /*    /index.html   200
    ```

- **Deep Link Testing:**  
  - Refresh on `/learn`, `/chat`, `/profile` → must load correctly.  
  - Invalid routes (e.g. `/foo`) → show styled 404 page.  

---

## 5. SEO, Robots & Sitemaps

- **robots.txt:**  
  - Allow crawlers on all public pages.  
  - Disallow `/api/*` and `/admin/*`.  
  - Example:  
    ```
    User-agent: *
    Disallow: /api/
    Disallow: /admin/
    Allow: /
    Sitemap: https://linguamate.ai/sitemap.xml
    ```

- **sitemap.xml:**  
  - Auto-generated with links to `/learn`, `/lessons`, `/modules`, `/chat`, `/profile`.  
  - Regenerate on deploy if routes change.  

- **Meta tags & Open Graph:**  
  - Title, description, keywords optimised for SEO.  
  - Open Graph tags for previews (image, description).  

---

## 6. Asset Handling

- **Images:**  
  - Serve responsive image sets (`srcset`) where possible.  
  - Use CDN with caching + compression (WebP/AVIF).  
  - Preload key hero image on landing page.  

- **Fonts:**  
  - Prefer **system fonts** (`-apple-system, Roboto, sans-serif`) to avoid large custom font payloads.  
  - If custom fonts required: preload WOFF2 only.  

- **Caching:**  
  - Set cache headers:  
    - HTML → no-cache  
    - Static assets → long-term caching with hash in filename  

---

## 7. Performance Targets (Core Web Vitals)

- **Largest Contentful Paint (LCP):** < 2.5s (95th percentile)  
- **Cumulative Layout Shift (CLS):** < 0.1  
- **Interaction to Next Paint (INP):** < 200ms  

**Techniques:**  
- Code splitting: lazy load non-critical screens.  
- Preload React Query state for critical tabs.  
- Use skeleton loaders for lessons/chat.  
- Compress assets (gzip + Brotli).  
- Lighthouse audits: Performance ≥ 80, A11y ≥ 90.  

---

## 8. Security & Compliance

- **Transport Security:**  
  - Enforce HTTPS, HSTS headers.  
  - No mixed content (HTTP assets).  

- **CORS:**  
  - Allow only approved origins (`linguamate.ai`, `staging.linguamate.ai`).  
  - Block wildcard `*` in production.  

- **Content Security Policy (CSP):**  
  - Example:  
    ```
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://toolkit.rork.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.linguamate.ai https://toolkit.rork.com;
    ```
  
- **Cookies:**  
  - If used: `Secure`, `HttpOnly`, `SameSite=Lax` or `Strict`.  
  - No 3rd-party ad cookies.  

- **Data Privacy Compliance:**  
  - Privacy policy & terms linked in footer.  
  - GDPR/CCPA compliant (user data minimal, no tracking).  

---

## 9. Observability & Monitoring

- **Error Boundaries:**  
  - Catch runtime errors, show fallback UI.  

- **Analytics:**  
  - Only aggregate, anonymised events.  
  - No Advertising ID collection.  

- **Logging:**  
  - Use correlation IDs for debugging.  
  - No PII or tokens in logs.  

- **Monitoring Tools:**  
  - Uptime monitor (Pingdom, UptimeRobot).  
  - Error tracking (Sentry/LogRocket optional).  
  - CI/CD pipeline → push Lighthouse + A11y scores to artifacts.  

---

## 10. Testing Before Deploy

- **Responsive layout:** test on iPhone, Android, tablet, desktop.  
- **Cross-browser:** Safari, Chrome, Firefox, Edge.  
- **Network conditions:** Fast 3G, Offline mode → banners & retries.  
- **Deep links:** refresh on `/lessons`, `/profile`.  
- **A11y:** run `bun run a11y` (axe tests in CI).  
- **Lighthouse budget:**  
  - Perf ≥ 80  
  - A11y ≥ 90  
  - Best Practices ≥ 90  
  - SEO ≥ 90  

---

## 11. Deployment Steps (Vercel Example)

1. **Connect repo** to Vercel.  
2. **Set build command:**  
   ```bash
   expo export --platform web

3. Set output directory: dist/


4. Set environment variables:

EXPO_PUBLIC_BACKEND_URL=https://api.linguamate.ai

EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com



5. Configure rewrites:

[
  { "source": "/(.*)", "destination": "/index.html" }
]


6. Enable Analytics + Monitoring in dashboard.


7. Trigger deploy on main branch merges.




---

12. Post-Deployment Checklist

[ ] HTTPS enabled + SSL lock in browser.

[ ] Pages load in <3s globally (check via Chrome DevTools Throttling).

[ ] Offline UX verified (banner + cached lessons).

[ ] SEO meta tags present + OG preview images.

[ ] No console errors/warnings in production build.

[ ] Robots.txt and sitemap.xml reachable.

[ ] Privacy Policy and Terms linked in footer.

[ ] Lighthouse scores: Perf > 80, A11y > 90.

[ ] Logs monitored for first 24h after deploy.



---

✅ Following this checklist ensures Linguamate’s web app is secure, performant, compliant, and user-friendly before public launch.

