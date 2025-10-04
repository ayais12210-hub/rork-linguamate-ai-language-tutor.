# 🌐 Web App Info — Linguamate AI Language Tutor

This document describes the **front-facing web app information and configuration** required for production deployment of **Linguamate**.  
It covers SEO, Open Graph, favicons, progressive web app settings, analytics, and user privacy.

---

## 1. Title & Metadata

### Title

Linguamate — AI Language Tutor

- Must be concise (<60 characters for Google).  
- Should include **brand name** + **primary feature**.  
- Appears in browser tab, SERP results, and when bookmarking.

---

### Meta Description

Learn languages smarter with Linguamate — your AI-powered personal tutor. Practice real conversations, master alphabets, vocabulary, grammar, and culture with interactive lessons, quizzes, and progress tracking across iOS, Android, and Web.

- Length: 150–160 characters.  
- Contains primary keywords: *AI tutor, language learning, lessons, practice, grammar, vocabulary*.  
- Displayed in Google search previews.  

---

## 2. Open Graph Metadata (for social sharing)

```html
<meta property="og:type" content="website" />
<meta property="og:title" content="Linguamate — AI Language Tutor" />
<meta property="og:description" content="Master new languages with AI-powered lessons, conversational practice, and gamified progress tracking. Available on Web, iOS, and Android." />
<meta property="og:image" content="https://linguamate.ai/assets/images/og-preview.png" />
<meta property="og:url" content="https://linguamate.ai" />
<meta property="og:site_name" content="Linguamate" />

og:title: Should match <title> but may include branding.

og:description: Shorter, punchier than meta description.

og:image: 1200×630px JPG/PNG under 1 MB.

og:url: Canonical production domain.


Twitter Card support:

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Linguamate — AI Language Tutor" />
<meta name="twitter:description" content="Smarter language learning with AI: alphabets, grammar, quizzes, and conversational practice." />
<meta name="twitter:image" content="https://linguamate.ai/assets/images/og-preview.png" />


---

3. Icons & Favicons

Favicon (required):

assets/images/favicon.png

Size: 32×32 or 48×48 PNG.

Linked via <link rel="icon" type="image/png" href="/assets/images/favicon.png">.


Apple Touch Icon (optional but recommended):

180×180 PNG, no transparency.

<link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png">.


Android/Manifest icons:

192×192 PNG and 512×512 PNG for install prompt.




---

4. Progressive Web App (PWA) [Optional]

If enabling PWA support, add:

Manifest (/manifest.json)

{
  "name": "Linguamate AI Language Tutor",
  "short_name": "Linguamate",
  "description": "Cross-platform AI tutor for smarter language learning",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0a84ff",
  "icons": [
    {
      "src": "/assets/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

Service Worker (service-worker.js)

Cache index.html, JS bundles, CSS, and static assets.

Show offline page if no network.

Use Workbox or Expo defaults for cache strategies.


Add to index.html:

<link rel="manifest" href="/manifest.json" />


---

5. Analytics (Privacy-First)

Google Analytics 4 or Plausible Analytics recommended.

Ensure IP anonymization enabled:

gtag('config', 'GA_MEASUREMENT_ID', {
  anonymize_ip: true
});

Sampling strategy:

Staging: 50–100% events.

Production: 5–10% events (aggregate only).


Track:

Page views (tabs: Learn, Lessons, Modules, Chat, Profile).

Lesson completions, XP earned.

AI chat usage.


Do not log:

Raw prompts or user PII.




---

6. Cookie Banner & Privacy Links

If cookies or local storage are used for analytics or personalization:

Show cookie consent banner on first load.

Options:

“Accept All” → enable analytics + preferences.

“Essential Only” → run only functional cookies.


Banner must link to:

Privacy Policy: https://linguamate.ai/privacy

Terms of Service: https://linguamate.ai/terms



Example banner text:

We use cookies to improve your experience and analyse usage. 
You can choose to accept all cookies or only those essential for functionality. 
See our Privacy Policy for details.


---

7. Technical SEO Setup

Canonical URL:

<link rel="canonical" href="https://linguamate.ai" />

robots.txt:

User-agent: *
Disallow: /api/
Disallow: /admin/
Allow: /
Sitemap: https://linguamate.ai/sitemap.xml

sitemap.xml:
List public routes: /learn, /lessons, /modules, /chat, /profile.

Schema.org JSON-LD (optional):

{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Linguamate AI Language Tutor",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web, iOS, Android",
  "description": "Smarter AI-powered language learning across devices.",
  "offers": {
    "@type": "Offer",
    "price": "0.00",
    "priceCurrency": "GBP"
  }
}



---

8. Accessibility & UX Trust

WCAG 2.1 AA compliance:

Alt text for all images.

Labels for inputs and buttons.

Keyboard navigation fully supported.


Trust markers:

Show GDPR/CCPA compliance badge in footer.

Link to support page: https://linguamate.ai/support.

Clear uninstall/delete account instructions in FAQ.




---

9. Security Headers (to configure on host)

Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

X-Content-Type-Options: nosniff

Referrer-Policy: strict-origin-when-cross-origin

Permissions-Policy: camera=(), microphone=(), geolocation=()

Content-Security-Policy: locked to app + API origins



---

✅ Final Pre-Launch Checklist

[ ] Title + meta description added

[ ] Open Graph + Twitter card tags added

[ ] Favicon and app icons configured

[ ] Optional manifest + service worker tested

[ ] Analytics integrated with IP anonymization

[ ] Cookie banner enabled if needed

[ ] robots.txt + sitemap.xml published

[ ] Privacy Policy + Terms linked in footer

[ ] Accessibility checks passed (contrast, keyboard nav)

[ ] Security headers applied



---

⚡ With this configuration, Linguamate Web will be search-optimised, privacy-compliant, socially shareable, and PWA-ready.


