# Secure Storage Implementation

This document describes the secure storage implementation that replaces hardcoded encryption keys with runtime-generated keys stored in platform secure storage.

## Overview

The secure storage system provides:
- **Runtime key generation**: Unique encryption keys generated per app installation
- **Platform secure storage**: Keys stored in iOS Keychain / Android Keystore
- **Migration support**: Automatic migration from insecure hardcoded keys
- **Development fallback**: Clear warnings and fallback keys for development
- **Key validation**: Startup validation to detect and handle insecure defaults

## Architecture

### Components

1. **SecureKeyManager** (`lib/secure-key-manager.ts`)
   - Manages encryption key lifecycle
   - Handles platform-specific secure storage
   - Provides key validation and migration

2. **MMKV Storage** (`lib/mmkv-storage.ts`)
   - Updated to use secure keys instead of hardcoded values
   - Automatic initialization before use
   - Development fallback with clear warnings

3. **Storage Initialization** (`lib/storage-init.ts`)
   - App startup initialization
   - Error handling and fallback logic
   - Status monitoring and debugging

## Security Features

### Key Generation
- 32-byte cryptographically secure random keys
- Unique per app installation
- Versioned key format: `secure-v2-{base64-key}`

### Platform Storage
- **iOS**: Keychain Services (encrypted at rest)
- **Android**: Android Keystore (hardware-backed when available)
- **Web**: localStorage fallback (development only)

### Key Validation
- Detects insecure hardcoded keys
- Validates key format and length
- Automatic migration from insecure defaults

## Usage

### Basic Usage

```typescript
import { initializeAppStorage } from './lib/storage-init';
import { mmkvStorage } from './lib/mmkv-storage';

// Initialize at app startup
await initializeAppStorage();

// Use storage (automatically initializes if needed)
await mmkvStorage.setString('key', 'value');
const value = await mmkvStorage.getString('key');
```

### Advanced Usage

```typescript
import { getSecureStorageStats, clearSecureKeys } from './lib/mmkv-storage';

// Get storage statistics
const stats = await getSecureStorageStats();
console.log('Key count:', stats.keyCount);
console.log('Platform:', stats.platform);

// Clear all keys (for testing)
await clearSecureKeys();
```

## Migration

The system automatically migrates from insecure hardcoded keys:

1. **Detection**: Identifies hardcoded keys like `linguamate-encryption-key-v1`
2. **Generation**: Creates new secure keys
3. **Storage**: Stores keys in platform secure storage
4. **Logging**: Records migration events for audit

## Development Mode

In development mode, the system provides fallback keys with clear warnings:

```typescript
// Development fallback keys (NOT SECURE)
'dev-fallback-default-key'
'dev-fallback-cache-key'
'dev-fallback-secure-key'
```

**Warning**: Development keys are logged and clearly marked as insecure.

## Error Handling

### Production
- Initialization failures throw errors
- App cannot continue without secure storage
- Clear error messages for debugging

### Development
- Fallback to development keys
- Clear warnings in console
- App continues with reduced security

## Testing

Run the test suite to verify implementation:

```bash
npm test lib/__tests__/secure-key-manager.test.ts
```

Tests cover:
- Key generation and validation
- Migration logic
- Development fallbacks
- Error handling

## Security Considerations

### Production Deployment
1. **Never use development keys in production**
2. **Verify key generation is working** (check logs)
3. **Monitor migration events** (audit logs)
4. **Test on real devices** (not simulators)

### Key Management
- Keys are unique per installation
- Keys cannot be recovered if device is wiped
- Keys are not transmitted or stored remotely
- Keys are rotated on migration

### Platform Differences
- **iOS**: Keys stored in Keychain, encrypted with device passcode
- **Android**: Keys stored in Keystore, hardware-backed when available
- **Web**: Keys stored in localStorage (development only)

## Troubleshooting

### Common Issues

1. **"Failed to initialize secure storage"**
   - Check platform secure storage availability
   - Verify expo-secure-store installation
   - Check device security settings

2. **"Using development fallback keys"**
   - Normal in development mode
   - Check NODE_ENV environment variable
   - Verify __DEV__ flag

3. **Migration warnings**
   - Normal when upgrading from hardcoded keys
   - Check migration logs for details
   - Verify new keys are generated

### Debug Information

```typescript
import { getSecureStorageStats } from './lib/mmkv-storage';

const stats = await getSecureStorageStats();
console.log('Storage stats:', stats);
```

## Implementation Notes

### Breaking Changes
- All storage operations are now async
- Must call `initializeAppStorage()` at startup
- Development keys are clearly marked as insecure

### Performance
- One-time initialization cost
- Keys cached after first access
- No performance impact on storage operations

### Compatibility
- Requires expo-secure-store
- iOS 10+ / Android API 23+
- Web fallback for development only

## Future Enhancements

1. **Key rotation**: Periodic key rotation for enhanced security
2. **Biometric protection**: Optional biometric authentication for key access
3. **Key escrow**: Secure key backup and recovery
4. **Audit logging**: Enhanced security event logging
5. **Key validation**: Additional key strength validation