import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTutorDataManager, useTutorDataForUrl } from '@/hooks/useTutorData';
import { TutorData } from '@/lib/services/tutor-data-fetcher';

interface TutorDataFetcherProps {
  initialUrl?: string;
  onDataFetched?: (data: TutorData) => void;
  onError?: (error: Error) => void;
}

export default function TutorDataFetcher({ 
  initialUrl = 'https://linguamate-ai-language-tutor-1yzk6my-76pccekj-lg0fppmq.rork.app',
  onDataFetched,
  onError 
}: TutorDataFetcherProps) {
  const [url, setUrl] = useState(initialUrl);
  const [multipleUrls, setMultipleUrls] = useState('');
  
  const {
    fetchTutorData,
    fetchMultipleTutorData,
    clearCache,
    cacheStats,
    isLoading,
    hasError,
    errors
  } = useTutorDataManager();

  const {
    data: currentData,
    isSuccess,
    timestamp,
    fetch: fetchCurrentUrl,
    isFresh
  } = useTutorDataForUrl(url);

  const handleSingleFetch = async () => {
    try {
      const result = await fetchTutorData({ url });
      if (result?.success && result.data) {
        onDataFetched?.(result.data);
        Alert.alert('Success', 'Tutor data fetched successfully!');
      } else {
        const error = new Error(result?.error?.message || 'Failed to fetch data');
        onError?.(error);
        Alert.alert('Error', error.message);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      Alert.alert('Error', err.message);
    }
  };

  const handleMultipleFetch = async () => {
    const urls = multipleUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);
    
    if (urls.length === 0) {
      Alert.alert('Error', 'Please enter at least one URL');
      return;
    }

    try {
      const result = await fetchMultipleTutorData({ urls });
      if (result?.success) {
        const successCount = result.summary?.successful || 0;
        const failCount = result.summary?.failed || 0;
        Alert.alert(
          'Batch Fetch Complete', 
          `Successfully fetched ${successCount} sources, ${failCount} failed`
        );
      } else {
        Alert.alert('Error', result?.error?.message || 'Failed to fetch data');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      Alert.alert('Error', err.message);
    }
  };

  const handleClearCache = () => {
    clearCache();
    Alert.alert('Cache Cleared', 'All cached data has been cleared');
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleString();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Tutor Data Fetcher</Text>
      
      {/* Single URL Fetch */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fetch Single Source</Text>
        
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="Enter tutor data URL"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSingleFetch}
          disabled={isLoading || !url.trim()}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Fetching...' : 'Fetch Data'}
          </Text>
        </TouchableOpacity>

        {/* Current URL Status */}
        {currentData && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Current Data Status:</Text>
            <Text style={styles.statusText}>
              Status: {isSuccess ? '✅ Success' : '❌ Failed'}
            </Text>
            <Text style={styles.statusText}>
              Fresh: {isFresh ? '✅ Yes' : '❌ No'}
            </Text>
            <Text style={styles.statusText}>
              Last Fetched: {formatTimestamp(timestamp)}
            </Text>
            <Text style={styles.statusText}>
              Title: {currentData.title || 'N/A'}
            </Text>
            <Text style={styles.statusText}>
              Language: {currentData.language || 'N/A'}
            </Text>
            <Text style={styles.statusText}>
              Level: {currentData.level || 'N/A'}
            </Text>
            <Text style={styles.statusText}>
              Content Type: {currentData.contentType || 'N/A'}
            </Text>
            {currentData.metadata?.contentLength && (
              <Text style={styles.statusText}>
                Size: {Math.round(currentData.metadata.contentLength / 1024)}KB
              </Text>
            )}
            {currentData.rawContent && (
              <Text style={styles.statusText}>
                Raw Content: {currentData.rawContent.length} characters
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Multiple URLs Fetch */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fetch Multiple Sources</Text>
        
        <TextInput
          style={[styles.input, styles.textArea]}
          value={multipleUrls}
          onChangeText={setMultipleUrls}
          placeholder="Enter URLs (one per line)"
          multiline
          numberOfLines={4}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]}
          onPress={handleMultipleFetch}
          disabled={isLoading || !multipleUrls.trim()}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Fetching...' : 'Fetch Multiple'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cache Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cache Management</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleClearCache}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Clear All Cache</Text>
        </TouchableOpacity>

        {/* Cache Stats */}
        {cacheStats?.success && cacheStats.stats && (
          <View style={styles.cacheStatsContainer}>
            <Text style={styles.cacheStatsTitle}>Cache Statistics:</Text>
            <Text style={styles.cacheStatsText}>
              Cached URLs: {cacheStats.stats.size}
            </Text>
            <Text style={styles.cacheStatsText}>
              URLs: {cacheStats.stats.urls.join(', ') || 'None'}
            </Text>
            {cacheStats.stats.oldestEntry && (
              <Text style={styles.cacheStatsText}>
                Oldest Entry: {formatTimestamp(new Date(cacheStats.stats.oldestEntry).toISOString())}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Error Display */}
      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Errors:</Text>
          {errors.fetch && (
            <Text style={styles.errorText}>Fetch: {errors.fetch.message}</Text>
          )}
          {errors.fetchMultiple && (
            <Text style={styles.errorText}>Multiple: {errors.fetchMultiple.message}</Text>
          )}
          {errors.clearCache && (
            <Text style={styles.errorText}>Clear Cache: {errors.clearCache.message}</Text>
          )}
          {errors.cacheStats && (
            <Text style={styles.errorText}>Cache Stats: {errors.cacheStats.message}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  cacheStatsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  cacheStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  cacheStatsText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#c62828',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#d32f2f',
  },
});