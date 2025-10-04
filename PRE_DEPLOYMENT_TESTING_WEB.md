# 🌐 Pre-Deployment Testing (Web)

This checklist ensures that the Linguamate web app is fully production-ready before deployment.  
Run all steps on both **staging** and **production builds**.

---

## 1. Responsive Design & Layout
- ✅ Test **mobile** viewports (375px, 414px, 768px widths).  
- ✅ Test **tablet** viewports (768px – 1024px).  
- ✅ Test **desktop** viewports (≥1280px, ultrawide 1440–1920px).  
- ✅ Check all main pages (Learn, Lessons, Modules, Chat, Profile).  
- ✅ Ensure navigation bar adapts correctly to viewport changes.  
- ✅ Confirm text truncation/wrapping does not break UI on small screens.  
- ✅ Test dynamic font scaling (browser zoom 80–200%).  
- ✅ Check touch targets are ≥44px on mobile.  
- ✅ Dark mode theming displays correctly across all viewports.

---

## 2. Routing & Navigation
- ✅ All **SPA deep links** (e.g. `/learn`, `/chat`, `/profile`) work when refreshed (server returns index.html).  
- ✅ 404 page is present and styled; redirects configured for invalid routes.  
- ✅ Browser back/forward navigation works consistently.  
- ✅ External links (support, privacy, terms) open in a new tab.  
- ✅ No broken links across footer, onboarding, or in-app menus.

---

## 3. Performance & Lighthouse
Run Lighthouse audits (mobile + desktop):
- **Performance**: ≥ 80  
  - First Contentful Paint < 3s on 3G.  
  - Largest Contentful Paint < 4s.  
  - Cumulative Layout Shift < 0.1.  
  - Total Blocking Time < 300ms.  
- **Accessibility**: ≥ 90  
  - Sufficient color contrast.  
  - Alt text on images.  
  - ARIA labels on interactive elements.  
- **Best Practices**: ≥ 90  
- **SEO**: ≥ 90  

---

## 4. Cross-Browser Compatibility
- ✅ **Safari** (latest stable on macOS/iOS).  
- ✅ **Chrome** (desktop + Android).  
- ✅ **Firefox** (desktop).  
- ✅ **Edge** (desktop, Chromium-based).  
- ✅ Check features relying on MediaRecorder (STT) on supported browsers.  
- ✅ Verify that fallbacks are shown where APIs are unsupported.  

---

## 5. Network & Offline UX
- ✅ Simulate **Fast 3G** in dev tools. Verify acceptable loading and no frozen states.  
- ✅ All requests show graceful spinners/skeletons.  
- ✅ App is usable offline:  
  - Cached lessons accessible.  
  - Offline banner visible.  
  - Queued actions sync when back online.  
- ✅ API errors show user-friendly messages (not raw JSON).  

---

## 6. Error Boundaries & Stability
- ✅ Trigger intentional runtime error (e.g. undefined variable in dev). Confirm ErrorBoundary UI shows recovery option.  
- ✅ Check that logs capture error details (without leaking PII).  
- ✅ Confirm app continues functioning after non-fatal error.  
- ✅ Validate graceful fallback for missing resources (e.g. missing image asset).  

---

## 7. Functional Testing
- ✅ Onboarding flow completes without errors.  
- ✅ AI Chat tab loads, suggestions chips clickable, translator works.  
- ✅ Lesson generation request succeeds; XP awarded and progress persisted.  
- ✅ Profile stats update after completing lesson.  
- ✅ Leaderboard loads with filters/sorting.  
- ✅ Premium upsell visible when free message quota reached.  

---

## 8. Accessibility (A11y)
- ✅ Screen reader (VoiceOver/NVDA) reads labels correctly.  
- ✅ Navigation possible with **keyboard only** (Tab/Shift+Tab, Enter/Space).  
- ✅ Skip links or focus outlines visible when tabbing.  
- ✅ Ensure headings follow logical hierarchy (h1, h2, h3).  
- ✅ ARIA roles for landmarks (`main`, `nav`, `footer`).  

---

## 9. Security & Privacy
- ✅ All requests via HTTPS; no mixed content warnings.  
- ✅ Inspect network requests: no sensitive tokens visible in URL.  
- ✅ Cookies set with `Secure`, `HttpOnly`, `SameSite=Lax/Strict`.  
- ✅ LocalStorage only holds non-sensitive, non-PII values.  
- ✅ Verify logout clears cached data.  
- ✅ CORS headers restricted in production.  

---

## 10. Deployment & Hosting Checks
- ✅ Verify build artifacts deployed under correct path (`/` not `/subdir` unless configured).  
- ✅ Environment variables resolved correctly (`EXPO_PUBLIC_BACKEND_URL`).  
- ✅ API base URL points to production server.  
- ✅ Gzip/Brotli compression enabled.  
- ✅ Caching headers set for static assets.  
- ✅ Service Worker (if used) does not cache stale API responses.  

---

## 11. Pre-Launch QA Checklist
- [ ] Responsive checks (mobile/tablet/desktop).  
- [ ] All routes functional (refresh + deep link).  
- [ ] Lighthouse scores met (Perf > 80, A11y > 90).  
- [ ] Works on Safari, Chrome, Firefox, Edge.  
- [ ] App usable on slow 3G network.  
- [ ] Offline banner + sync tested.  
- [ ] Error boundaries trigger recovery UI.  
- [ ] All main features tested end-to-end.  
- [ ] Privacy & security confirmed (no PII leaks).  
- [ ] Deployed build matches staging build.  

---

✅ Once all boxes are checked, the app is **safe to deploy to production.**