# Offline Mode Documentation

## Overview

Linguamate includes a comprehensive offline mode system that allows users to continue learning even without an internet connection. The app automatically caches lessons, progress, and vocabulary data, and intelligently syncs changes when connectivity is restored.

## Features

### 🔌 Automatic Network Detection
- Real-time monitoring of network connectivity using `@react-native-community/netinfo`
- Seamless transition between online and offline modes
- Visual feedback through an animated banner when offline

### 💾 Smart Caching
- **Lessons**: Cached for 7 days with automatic expiration
- **Progress**: Cached for 30 days to ensure data persistence
- **Vocabulary**: Cached for 14 days with mastery tracking
- Version-controlled cache to handle app updates gracefully

### 🔄 Intelligent Sync Queue
- Automatic queueing of user actions when offline
- Exponential backoff retry strategy (1s → 2s → 4s → 8s → 16s, max 5 minutes)
- Jitter (±20%) to prevent thundering herd on reconnection
- Priority-based queue (high, normal, low)
- Maximum 5 retry attempts before dropping failed actions

### 🎨 User Interface
- **Offline Banner**: Animated slide-down notification when offline
- **Settings Integration**: Real-time network status and sync information
- **Unsynced Counter**: Shows pending items waiting to sync

## Architecture

### Core Components

#### 1. Offline Manager (`modules/offline/index.ts`)
Central state manager for offline functionality:
```typescript
interface OfflineStatus {
  isOffline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  lastSync: Date | null;
  unsyncedCount: number;
}
```

#### 2. Offline Queue (`modules/offline/offlineQueue.ts`)
Manages queued actions with retry logic:
```typescript
interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  attempts: number;
  nextAttemptAt: number;
  priority: 'low' | 'normal' | 'high';
}
```

#### 3. Cache Layer (`modules/offline/cache.ts`)
Handles data caching with TTL:
```typescript
interface CachedItem<T> {
  data: T;
  timestamp: number;
  version: string;
  expiresAt: number;
}
```

#### 4. Sync Functions (`modules/offline/sync.ts`)
High-level sync operations:
- `syncProgress(userId, progressData)`
- `syncLesson(userId, lessonId, completionData)`
- `syncVocabulary(userId, vocabularyData)`
- `syncChatMessage(userId, chatId, message)`
- `forceSyncAll()`

## Usage

### Initialization

The offline system is automatically initialized in the root layout:

```typescript
import { OfflineProvider } from '@/modules/offline/OfflineProvider';
import { offlineQueue } from '@/modules/offline/offlineQueue';

// In your app root
<OfflineProvider>
  {/* Your app */}
</OfflineProvider>

// Initialize queue
useEffect(() => {
  offlineQueue.initialize();
}, []);
```

### Using Offline Status

```typescript
import { useOfflineStatus } from '@/modules/offline/index';

function MyComponent() {
  const { isOffline, isConnected, unsyncedCount, lastSync } = useOfflineStatus();
  
  return (
    <View>
      <Text>Status: {isConnected ? 'Online' : 'Offline'}</Text>
      <Text>Pending: {unsyncedCount} items</Text>
    </View>
  );
}
```

### Queueing Actions

```typescript
import { syncProgress } from '@/modules/offline/sync';

async function saveProgress(userId: string, data: unknown) {
  try {
    await syncProgress(userId, data);
    // If online: syncs immediately
    // If offline: queues for later
  } catch (error) {
    console.error('Failed to sync:', error);
  }
}
```

### Manual Cache Management

```typescript
import { offlineCache } from '@/modules/offline/cache';

// Cache lessons
await offlineCache.cacheLessons(lessons);

// Retrieve cached lessons
const cachedLessons = await offlineCache.getCachedLessons();

// Clear expired cache
await offlineCache.clearExpiredCache();

// Get cache statistics
const stats = await offlineCache.getCacheSize();
// { lessons: 10, progress: true, vocabulary: 50 }
```

## Data Flow

### Online Mode
```
User Action → API Call → Success → Update UI
```

### Offline Mode
```
User Action → Queue Action → Store Locally → Update UI
                ↓
         (When online)
                ↓
         Retry Queue → API Call → Success → Remove from Queue
```

## Storage Keys

All offline data is stored using these keys:
- `offline_lessons`: Cached lesson content
- `offline_queue`: Pending sync actions
- `learning_progress`: User progress data
- `vocabulary`: Vocabulary and mastery data

## Privacy & GDPR Compliance

### Data Minimization
- Only essential data is cached locally
- Sensitive information (passwords, tokens) is never cached
- Cache expires automatically based on TTL

### User Control
- Users can view offline status in Settings
- Manual sync option available
- Export progress feature for data portability
- Clear cache option for data deletion

### Data Retention
- Lessons: 7 days
- Progress: 30 days
- Vocabulary: 14 days
- Queue: Until synced or max attempts reached

## Performance Considerations

### Cache Size Management
- Lessons are stored as compressed JSON
- Vocabulary limited to active learning words
- Progress data is incremental, not full snapshots

### Battery & Network Optimization
- Sync only when online
- Batch operations to reduce API calls
- Exponential backoff prevents excessive retries
- Jitter prevents network congestion

## Error Handling

### Network Errors
- Automatically queued for retry
- User sees optimistic UI updates
- Sync happens transparently in background

### Storage Errors
- Graceful degradation to online-only mode
- Console logging for debugging
- User notification for critical failures

### Sync Failures
- Maximum 5 retry attempts
- Exponential backoff between retries
- Failed actions logged for debugging

## Testing

### Simulating Offline Mode

**iOS Simulator:**
```bash
# Disable network
xcrun simctl status_bar booted override --networkType none

# Re-enable network
xcrun simctl status_bar booted clear
```

**Android Emulator:**
- Settings → Network & Internet → Turn off Wi-Fi and Mobile data

**Web:**
- Chrome DevTools → Network tab → Offline checkbox

### Manual Testing Checklist
- [ ] Banner appears when going offline
- [ ] Banner disappears 2s after reconnecting
- [ ] Actions queue when offline
- [ ] Queue flushes automatically when online
- [ ] Settings show correct network status
- [ ] Unsynced count updates correctly
- [ ] Cached data loads when offline
- [ ] Expired cache is cleared automatically

## Troubleshooting

### Queue Not Flushing
1. Check network connectivity
2. Verify `offlineQueue.initialize()` was called
3. Check console for error messages
4. Try manual sync: `forceSyncAll()`

### Cache Not Loading
1. Check cache expiration dates
2. Verify storage permissions
3. Clear cache and re-download: `clearAllCache()`

### Banner Not Showing
1. Verify `OfflineProvider` is in component tree
2. Check `OfflineBanner` is rendered
3. Ensure NetInfo is properly initialized

## Future Enhancements

### Planned Features
- [ ] Selective lesson downloads for offline use
- [ ] Background sync using background tasks
- [ ] Conflict resolution for concurrent edits
- [ ] Offline-first architecture with CRDTs
- [ ] Progressive Web App (PWA) support
- [ ] Service Worker for web caching

### API Improvements
- [ ] GraphQL subscriptions for real-time sync
- [ ] Delta sync to reduce bandwidth
- [ ] Compression for cached data
- [ ] Encrypted local storage

## Support

For issues or questions about offline mode:
- Check console logs for detailed error messages
- Review this documentation
- Contact support at support@linguamate.app

## Version History

### v1.0.0 (Current)
- Initial offline mode implementation
- Network detection with NetInfo
- Smart caching with TTL
- Sync queue with exponential backoff
- Offline banner UI
- Settings integration

---

**Last Updated:** 2025-01-02  
**Maintained By:** Linguamate Development Team
