// Reusable error view component with retry functionality

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AppError } from '@/lib/errors';

interface ErrorViewProps {
  error: AppError;
  onRetry?: () => void;
  fullScreen?: boolean;
  compact?: boolean;
  showDetails?: boolean;
  retrying?: boolean;
  customMessage?: string;
}

export default function ErrorView({
  error,
  onRetry,
  fullScreen = false,
  compact = false,
  showDetails = __DEV__,
  retrying = false,
  customMessage,
}: ErrorViewProps) {
  const [expanded, setExpanded] = React.useState(false);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactIcon}>⚠️</Text>
        <View style={styles.compactTextContainer}>
          <Text style={styles.compactMessage} numberOfLines={2}>
            {customMessage || error.getUserMessage()}
          </Text>
          {onRetry && (
            <TouchableOpacity
              onPress={onRetry}
              disabled={retrying}
              style={styles.compactRetryButton}
              testID="error-retry-compact"
            >
              {retrying ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <Text style={styles.compactRetryText}>Try again</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  return (
    <View style={containerStyle}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getErrorIcon(error.kind)}</Text>
        </View>

        <Text style={styles.title}>{getErrorTitle(error.kind)}</Text>
        
        <Text style={styles.message}>
          {customMessage || error.getUserMessage()}
        </Text>

        {showDetails && (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            style={styles.detailsToggle}
            testID="error-details-toggle"
          >
            <Text style={styles.detailsToggleText}>
              {expanded ? 'Hide details' : 'Show details'} {expanded ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
        )}

        {showDetails && expanded && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Technical Details</Text>
            
            <DetailRow label="Error ID" value={error.errorId} />
            <DetailRow label="Type" value={error.kind} />
            {error.code && <DetailRow label="Code" value={error.code} />}
            {error.requestId && <DetailRow label="Request ID" value={error.requestId} />}
            <DetailRow label="Time" value={new Date(error.timestamp).toLocaleString()} />
            
            {error.details && (
              <>
                <Text style={styles.detailsSubtitle}>Additional Info:</Text>
                <Text style={styles.detailsCode}>
                  {JSON.stringify(error.details, null, 2)}
                </Text>
              </>
            )}
            
            {error.stack && (
              <>
                <Text style={styles.detailsSubtitle}>Stack Trace:</Text>
                <ScrollView style={styles.stackContainer} horizontal>
                  <Text style={styles.detailsCode} numberOfLines={10}>
                    {error.stack}
                  </Text>
                </ScrollView>
              </>
            )}
          </View>
        )}

        <View style={styles.actionContainer}>
          {onRetry && (
            <TouchableOpacity
              onPress={onRetry}
              disabled={retrying}
              style={[styles.button, styles.primaryButton]}
              testID="error-retry"
            >
              {retrying ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Try Again</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
        {value}
      </Text>
    </View>
  );
}

function getErrorIcon(kind: string): string {
  switch (kind) {
    case 'Network':
      return '📡';
    case 'Auth':
      return '🔐';
    case 'Validation':
      return '📝';
    case 'Server':
      return '🖥️';
    default:
      return '⚠️';
  }
}

function getErrorTitle(kind: string): string {
  switch (kind) {
    case 'Network':
      return 'Connection Problem';
    case 'Auth':
      return 'Authentication Required';
    case 'Validation':
      return 'Invalid Input';
    case 'Server':
      return 'Server Error';
    default:
      return 'Something Went Wrong';
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
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
    paddingHorizontal: 16,
  },
  detailsToggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#3B82F6',
  },
  detailsContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  detailsSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 12,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
    fontFamily: 'monospace',
  },
  detailsCode: {
    fontSize: 10,
    color: '#374151',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  stackContainer: {
    maxHeight: 150,
    marginTop: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  button: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  compactIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  compactTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactMessage: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
    marginRight: 12,
  },
  compactRetryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    minWidth: 70,
    alignItems: 'center',
  },
  compactRetryText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
});