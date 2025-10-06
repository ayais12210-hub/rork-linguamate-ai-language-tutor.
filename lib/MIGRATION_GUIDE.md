# Migration Guide: Hardcoded Keys to Secure Storage

This guide helps you migrate from the old hardcoded encryption keys to the new secure storage system.

## What Changed

### Before (Insecure)
```typescript
// OLD: Hardcoded keys in mmkv-storage.ts
export const storage = new MMKV({
  id: 'linguamate-default',
  encryptionKey: 'linguamate-encryption-key-v1', // ❌ INSECURE
});
```

### After (Secure)
```typescript
// NEW: Runtime-generated secure keys
await initializeAppStorage(); // Initialize at app startup
// Keys are automatically generated and stored securely
```

## Required Changes

### 1. App Initialization

**Add to your app entry point** (e.g., `app/_layout.tsx` or `App.tsx`):

```typescript
import { initializeAppStorage } from '@/lib/storage-init';

export default function App() {
  useEffect(() => {
    // Initialize secure storage at app startup
    initializeAppStorage().catch(console.error);
  }, []);

  // ... rest of your app
}
```

### 2. Update Storage Usage

**All storage operations are now async:**

```typescript
// OLD: Synchronous operations
const value = mmkvStorage.getString('key');
mmkvStorage.setString('key', 'value');

// NEW: Asynchronous operations
const value = await mmkvStorage.getString('key');
await mmkvStorage.setString('key', 'value');
```

### 3. Update All Storage Calls

**Search and replace in your codebase:**

```bash
# Find all storage usage
grep -r "mmkvStorage\." --include="*.ts" --include="*.tsx" .

# Find all cache usage  
grep -r "mmkvCache\." --include="*.ts" --include="*.tsx" .
```

**Common patterns to update:**

```typescript
// OLD: Direct property access
const value = storage.getString('key');

// NEW: Use mmkvStorage helper (async)
const value = await mmkvStorage.getString('key');
```

### 4. Update React Components

**Convert to async/await:**

```typescript
// OLD: Synchronous in component
function MyComponent() {
  const [data, setData] = useState(() => 
    mmkvStorage.getString('my_data')
  );
  
  const handleSave = () => {
    mmkvStorage.setString('my_data', 'new_value');
  };
}

// NEW: Async with useEffect
function MyComponent() {
  const [data, setData] = useState<string | undefined>();
  
  useEffect(() => {
    const loadData = async () => {
      const value = await mmkvStorage.getString('my_data');
      setData(value);
    };
    loadData();
  }, []);
  
  const handleSave = async () => {
    await mmkvStorage.setString('my_data', 'new_value');
  };
}
```

### 5. Update Custom Hooks

**Make hooks async:**

```typescript
// OLD: Synchronous hook
function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState(() => 
    mmkvStorage.getObject<T>(key) ?? defaultValue
  );
  
  const updateValue = (newValue: T) => {
    mmkvStorage.setObject(key, newValue);
    setValue(newValue);
  };
  
  return [value, updateValue] as const;
}

// NEW: Async hook
function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadValue = async () => {
      try {
        const stored = await mmkvStorage.getObject<T>(key);
        setValue(stored ?? defaultValue);
      } catch (error) {
        console.error('Failed to load storage value:', error);
        setValue(defaultValue);
      } finally {
        setLoading(false);
      }
    };
    loadValue();
  }, [key, defaultValue]);
  
  const updateValue = async (newValue: T) => {
    try {
      await mmkvStorage.setObject(key, newValue);
      setValue(newValue);
    } catch (error) {
      console.error('Failed to save storage value:', error);
    }
  };
  
  return [value, updateValue, loading] as const;
}
```

## Migration Checklist

### ✅ Code Changes
- [ ] Add `initializeAppStorage()` to app startup
- [ ] Update all `mmkvStorage.*` calls to async
- [ ] Update all `mmkvCache.*` calls to async
- [ ] Update React components to handle async storage
- [ ] Update custom hooks to be async
- [ ] Update tests to handle async operations

### ✅ Testing
- [ ] Test app startup and initialization
- [ ] Test all storage operations work correctly
- [ ] Test migration from old keys (if applicable)
- [ ] Test error handling and fallbacks
- [ ] Test on real devices (iOS/Android)

### ✅ Production Deployment
- [ ] Verify secure keys are generated (check logs)
- [ ] Confirm no hardcoded keys in production build
- [ ] Test key migration works correctly
- [ ] Monitor for any storage-related errors

## Common Issues and Solutions

### Issue: "Storage not initialized"
**Solution:** Ensure `initializeAppStorage()` is called at app startup

```typescript
// Add to your app entry point
useEffect(() => {
  initializeAppStorage().catch(console.error);
}, []);
```

### Issue: "Cannot read property of undefined"
**Solution:** All storage operations are now async - add await

```typescript
// OLD
const value = mmkvStorage.getString('key');

// NEW
const value = await mmkvStorage.getString('key');
```

### Issue: "React Hook useEffect has a missing dependency"
**Solution:** Wrap async operations in useEffect properly

```typescript
useEffect(() => {
  const loadData = async () => {
    const data = await mmkvStorage.getString('key');
    setData(data);
  };
  loadData();
}, []); // Empty dependency array is OK for one-time load
```

### Issue: "Development fallback keys in production"
**Solution:** Check that `expo-secure-store` is properly installed and configured

```bash
npm install expo-secure-store
```

## Performance Considerations

### Initialization
- One-time cost at app startup
- Keys are cached after first access
- No impact on storage operation performance

### Memory Usage
- Minimal overhead for key management
- Keys are stored in platform secure storage
- No additional memory usage for encryption

### Battery Impact
- Negligible impact on battery life
- Keys are accessed only when needed
- Platform secure storage is optimized for efficiency

## Security Benefits

### Before
- ❌ Keys embedded in source code
- ❌ Same keys across all installations
- ❌ Keys visible in app bundles
- ❌ No key rotation or migration

### After
- ✅ Keys generated at runtime
- ✅ Unique keys per installation
- ✅ Keys stored in platform secure storage
- ✅ Automatic migration from insecure keys
- ✅ Key validation and rotation support

## Rollback Plan

If you need to rollback to the old system:

1. **Revert code changes** to use hardcoded keys
2. **Remove** `initializeAppStorage()` calls
3. **Revert** async storage operations to sync
4. **Test** that app works with old keys

**Note:** This will reduce security and is not recommended for production.

## Support

For issues or questions:
1. Check the [Secure Storage README](./SECURE_STORAGE_README.md)
2. Review the [usage examples](./examples/secure-storage-usage.ts)
3. Check console logs for initialization errors
4. Verify platform secure storage is available