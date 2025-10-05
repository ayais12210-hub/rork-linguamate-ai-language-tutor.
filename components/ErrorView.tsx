// Pretty error component with retry functionality
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { AppError } from '@/lib/errors';
import { log } from '@/lib/log';
import { isEnabled } from '@/lib/flags';

interface ErrorViewProps {
  error: AppError;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
  compact?: boolean;
  style?: any;
}

const { width } = Dimensions.get('window');

export default function ErrorView({
  error,
  onRetry,
  onDismiss,
  showTechnicalDetails = false,
  compact = false,
  style,
}: ErrorViewProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const logger = log.scope('ErrorView');

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    logger.info('User initiated retry', { errorId: error.requestId });

    try {
      await onRetry();
    } catch (retryError) {
      logger.error('Retry failed', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorIcon = () => {
    switch (error.kind) {
      case 'Network':
        return '📡';
      case 'Auth':
        return '🔐';
      case 'Validation':
        return '⚠️';
      case 'Server':
        return '🔧';
      case 'Unexpected':
      default:
        return '❌';
    }
  };

  const getErrorColor = () => {
    switch (error.kind) {
      case 'Network':
        return '#F59E0B'; // Amber
      case 'Auth':
        return '#EF4444'; // Red
      case 'Validation':
        return '#F59E0B'; // Amber
      case 'Server':
        return '#EF4444'; // Red
      case 'Unexpected':
      default:
        return '#6B7280'; // Gray
    }
  };

  const shouldShowRetry = () => {
    return onRetry && (error.kind === 'Network' || error.kind === 'Server');
  };

  if (compact) {
    return (
      <Animated.View style={[styles.compactContainer, { opacity: fadeAnim }, style]}>
        <View style={styles.compactContent}>
          <Text style={styles.compactIcon}>{getErrorIcon()}</Text>
          <Text style={styles.compactMessage} numberOfLines={1}>
            {error.getUserMessage()}
          </Text>
          {shouldShowRetry() && (
            <TouchableOpacity
              onPress={handleRetry}
              disabled={isRetrying}
              style={styles.compactRetryButton}
            >
              <Text style={styles.compactRetryText}>
                {isRetrying ? '⟳' : 'Retry'}
              </Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.compactDismissButton}>
              <Text style={styles.compactDismissText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }, style]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Error Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${getErrorColor()}20` }]}>
          <Text style={styles.icon}>{getErrorIcon()}</Text>
        </View>

        {/* Error Message */}
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{error.getUserMessage()}</Text>

        {/* Technical Details Toggle */}
        {(showTechnicalDetails || __DEV__) && (
          <TouchableOpacity
            onPress={() => setShowDetails(!showDetails)}
            style={styles.detailsToggle}
          >
            <Text style={styles.detailsToggleText}>
              {showDetails ? '▼' : '▶'} Technical Details
            </Text>
          </TouchableOpacity>
        )}

        {/* Technical Details */}
        {showDetails && (
          <View style={styles.technicalDetails}>
            <Text style={styles.technicalHint}>{error.getTechnicalHint()}</Text>
            
            {isEnabled('debug_error_overlay') && (
              <>
                <Text style={styles.debugLabel}>Error ID:</Text>
                <Text style={styles.debugValue}>{error.requestId || 'N/A'}</Text>
                
                <Text style={styles.debugLabel}>Type:</Text>
                <Text style={styles.debugValue}>{error.kind}</Text>
                
                <Text style={styles.debugLabel}>Code:</Text>
                <Text style={styles.debugValue}>{error.code || 'N/A'}</Text>
                
                <Text style={styles.debugLabel}>Timestamp:</Text>
                <Text style={styles.debugValue}>
                  {new Date(error.timestamp).toLocaleString()}
                </Text>
                
                {error.details && (
                  <>
                    <Text style={styles.debugLabel}>Details:</Text>
                    <Text style={styles.debugValue} numberOfLines={5}>
                      {JSON.stringify(error.details, null, 2)}
                    </Text>
                  </>
                )}
              </>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {shouldShowRetry() && (
            <TouchableOpacity
              onPress={handleRetry}
              disabled={isRetrying}
              style={[
                styles.button,
                styles.retryButton,
                isRetrying && styles.buttonDisabled,
              ]}
            >
              <Text style={[styles.buttonText, isRetrying && styles.buttonTextDisabled]}>
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          )}

          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={[styles.button, styles.dismissButton]}>
              <Text style={styles.buttonText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          If this problem persists, please contact support with the error ID above.
        </Text>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 400,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  detailsToggle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  technicalDetails: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: width * 0.9,
  },
  technicalHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 2,
  },
  debugValue: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 300,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  retryButton: {
    backgroundColor: '#10B981',
  },
  dismissButton: {
    backgroundColor: '#6B7280',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: '#9CA3AF',
  },
  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: width * 0.8,
  },
  
  // Compact styles
  compactContainer: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 6,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  compactMessage: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
  },
  compactRetryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#10B981',
    borderRadius: 4,
    marginRight: 8,
  },
  compactRetryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  compactDismissButton: {
    padding: 4,
  },
  compactDismissText: {
    fontSize: 16,
    color: '#6B7280',
  },
});