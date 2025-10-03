# Performance Guide

## Overview

This guide covers performance optimization strategies for Linguamate AI, including bundle size management, runtime performance, and Lighthouse optimization.

## Performance Budgets

### Lighthouse Targets

| Metric | Target | Threshold |
|--------|--------|-----------|
| Performance Score | 90+ | 85 |
| First Contentful Paint | <1.8s | <2.5s |
| Largest Contentful Paint | <2.5s | <4.0s |
| Time to Interactive | <3.8s | <5.5s |
| Total Blocking Time | <200ms | <600ms |
| Cumulative Layout Shift | <0.1 | <0.25 |

### Bundle Size Budgets

| Asset Type | Budget | Current |
|------------|--------|---------|
| Main JS Bundle | <500KB | TBD |
| Vendor JS | <300KB | TBD |
| CSS | <50KB | TBD |
| Images (per page) | <500KB | TBD |
| Total Page Weight | <2MB | TBD |

## Optimization Strategies

### 1. Code Splitting

#### Route-Based Splitting

Expo Router automatically code-splits by route. Ensure heavy screens are lazy-loaded:

```tsx
// app/(tabs)/modules.tsx
import { lazy, Suspense } from 'react';

const AlphabetModule = lazy(() => import('@/modules/alphabet/AlphabetModule'));

export default function ModulesScreen() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AlphabetModule />
    </Suspense>
  );
}
```

#### Component-Based Splitting

Split large components:

```tsx
import { lazy, Suspense } from 'react';

const AICoachInsights = lazy(() => import('./AICoachInsights'));

function TranslatorScreen() {
  return (
    <View>
      {/* ... */}
      <Suspense fallback={<Skeleton />}>
        <AICoachInsights translation={translation} />
      </Suspense>
    </View>
  );
}
```

### 2. React Optimization

#### Memoization

Use `React.memo()` for expensive components:

```tsx
import React, { memo } from 'react';

const TranslationCard = memo(({ translation }: Props) => {
  return (
    <View>
      <Text>{translation.text}</Text>
    </View>
  );
});
```

#### useMemo for Expensive Calculations

```tsx
const filteredLessons = useMemo(() => {
  return lessons.filter(lesson => 
    lesson.language === selectedLanguage &&
    lesson.difficulty === selectedDifficulty
  );
}, [lessons, selectedLanguage, selectedDifficulty]);
```

#### useCallback for Event Handlers

```tsx
const handleTranslate = useCallback(async () => {
  setLoading(true);
  try {
    const result = await translateText(inputText);
    setTranslation(result);
  } finally {
    setLoading(false);
  }
}, [inputText]);
```

### 3. List Virtualization

Use `FlatList` with proper optimization:

```tsx
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  // Performance props
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={5}
  // Memoized render function
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 4. Image Optimization

#### Use Expo Image

```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
  placeholder={blurhash}
/>
```

#### Responsive Images

```tsx
const imageSource = Platform.select({
  web: {
    uri: imageUrl,
    width: 800,
    height: 600,
  },
  default: { uri: imageUrl },
});
```

#### Lazy Load Images

```tsx
import { useState, useEffect } from 'react';

function LazyImage({ source, ...props }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return <View style={props.style} />;
  return <Image source={source} {...props} />;
}
```

### 5. Network Optimization

#### Request Batching

tRPC automatically batches requests:

```tsx
// These will be batched into a single HTTP request
const user = trpc.user.profile.useQuery();
const lessons = trpc.lessons.list.useQuery();
const progress = trpc.user.progress.useQuery();
```

#### Caching Strategy

```tsx
const lessonsQuery = trpc.lessons.list.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
});
```

#### Prefetching

```tsx
const queryClient = useQueryClient();

const prefetchLesson = useCallback((lessonId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => trpcClient.lessons.get.query({ id: lessonId }),
  });
}, [queryClient]);
```

### 6. Animation Performance

#### Use Native Driver

```tsx
import { Animated } from 'react-native';

const fadeAnim = useRef(new Animated.Value(0)).current;

Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ✅ Runs on native thread
}).start();
```

#### Avoid Layout Animations on Web

```tsx
import { Platform } from 'react-native';

{Platform.OS !== 'web' ? (
  <Animated.View layout={LinearTransition}>
    {/* Content */}
  </Animated.View>
) : (
  <View>
    {/* Non-animated fallback */}
  </View>
)}
```

### 7. Bundle Analysis

#### Analyze Bundle Size

```bash
# Web
npx expo export:web
npx source-map-explorer 'dist/**/*.js'

# Native
npx react-native-bundle-visualizer
```

#### Reduce Bundle Size

1. **Remove unused dependencies**
   ```bash
   npx depcheck
   ```

2. **Use smaller alternatives**
   - `date-fns` instead of `moment`
   - `zustand` instead of `redux`
   - `lucide-react-native` instead of `react-native-vector-icons`

3. **Tree-shake properly**
   ```tsx
   // ❌ Imports entire library
   import _ from 'lodash';
   
   // ✅ Imports only what's needed
   import debounce from 'lodash/debounce';
   ```

### 8. Startup Performance

#### Reduce Initial Bundle

Move non-critical code to lazy-loaded chunks:

```tsx
// app/_layout.tsx
import { lazy } from 'react';

const DebugPanel = lazy(() => import('@/components/DebugPanel'));

export default function RootLayout() {
  return (
    <>
      <Stack />
      {__DEV__ && (
        <Suspense fallback={null}>
          <DebugPanel />
        </Suspense>
      )}
    </>
  );
}
```

#### Defer Non-Critical Work

```tsx
import { useEffect } from 'react';
import { InteractionManager } from 'react-native';

useEffect(() => {
  InteractionManager.runAfterInteractions(() => {
    // Non-critical work (analytics, prefetching, etc.)
    trackPageView();
    prefetchData();
  });
}, []);
```

### 9. Memory Management

#### Clean Up Subscriptions

```tsx
useEffect(() => {
  const subscription = eventEmitter.on('event', handler);
  
  return () => {
    subscription.remove();
  };
}, []);
```

#### Avoid Memory Leaks

```tsx
useEffect(() => {
  let isMounted = true;
  
  fetchData().then(data => {
    if (isMounted) {
      setData(data);
    }
  });
  
  return () => {
    isMounted = false;
  };
}, []);
```

### 10. Web-Specific Optimizations

#### Service Worker for Caching

```tsx
// public/service-worker.js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

#### Preload Critical Resources

```html
<!-- public/index.html -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://api.linguamate.com">
```

## Performance Monitoring

### Lighthouse CI

Run Lighthouse in CI:

```bash
bun run perf
```

Review reports in `reports/lighthouse/`

### React DevTools Profiler

```tsx
import { Profiler } from 'react';

<Profiler id="TranslatorScreen" onRender={onRenderCallback}>
  <TranslatorScreen />
</Profiler>
```

### Custom Performance Marks

```tsx
import { performance } from 'react-native-performance';

performance.mark('translation-start');
await translateText(input);
performance.mark('translation-end');
performance.measure('translation', 'translation-start', 'translation-end');
```

## Performance Checklist

### Before Each Release

- [ ] Run Lighthouse CI (`bun run perf`)
- [ ] Check bundle size (`bun run analyze`)
- [ ] Profile with React DevTools
- [ ] Test on low-end devices
- [ ] Verify images are optimized
- [ ] Check for memory leaks
- [ ] Validate network waterfall
- [ ] Test offline performance

### Code Review Checklist

- [ ] Are lists virtualized?
- [ ] Are expensive components memoized?
- [ ] Are images lazy-loaded?
- [ ] Are animations using native driver?
- [ ] Are network requests cached?
- [ ] Are subscriptions cleaned up?
- [ ] Is code split appropriately?

## Common Performance Issues

### Issue: Slow List Rendering

**Problem:** FlatList lags when scrolling

**Fix:**
```tsx
<FlatList
  data={items}
  renderItem={renderItem}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  getItemLayout={getItemLayout} // If items have fixed height
/>
```

### Issue: Large Bundle Size

**Problem:** Initial load is slow

**Fix:**
1. Analyze bundle: `bun run analyze`
2. Remove unused dependencies
3. Use dynamic imports for heavy features
4. Tree-shake properly

### Issue: Janky Animations

**Problem:** Animations drop frames

**Fix:**
```tsx
// Use native driver
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ✅
}).start();

// Avoid layout animations on web
{Platform.OS !== 'web' && (
  <Animated.View layout={...} />
)}
```

### Issue: Memory Leaks

**Problem:** App crashes after extended use

**Fix:**
```tsx
useEffect(() => {
  let isMounted = true;
  
  fetchData().then(data => {
    if (isMounted) setData(data);
  });
  
  return () => {
    isMounted = false;
  };
}, []);
```

## Resources

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Expo Performance](https://docs.expo.dev/guides/performance/)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [React DevTools Profiler](https://react.dev/reference/react/Profiler)

---

*Last updated: 2025-01-03*
