import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Bug, Activity, AlertTriangle, Settings, Download, Trash2 } from 'lucide-react-native';
import { DebugLogger, PerformanceMonitor, UserActionTracker, DebugUtils, LogLevel } from '@/lib/debugging';
import { ErrorHandler, ErrorUtils } from '@/lib/error-handling';
import { AnalyticsManager, PerformanceMonitor as MonitoringPerformanceMonitor } from '@/lib/monitoring';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface DebugStats {
  logs: number;
  errors: number;
  warnings: number;
  performance: number;
  userActions: number;
  memoryUsage?: number;
  storageUsage: number;
}

export default function DebugPanel({ visible, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'performance' | 'errors' | 'settings'>('overview');
  const [stats, setStats] = useState<DebugStats>({
    logs: 0,
    errors: 0,
    warnings: 0,
    performance: 0,
    userActions: 0,
    storageUsage: 0,
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [performanceEntries, setPerformanceEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logLevel, setLogLevel] = useState<LogLevel>(LogLevel.DEBUG);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      loadDebugData();
    }
  }, [visible]);

  const loadDebugData = async () => {
    setIsLoading(true);
    try {
      const [
        debugInfo,
        storedErrors,
        performanceData,
        storageInfo,
        memoryInfo,
      ] = await Promise.all([
        DebugUtils.getDebugInfo(),
        ErrorHandler.getStoredErrors(),
        PerformanceMonitor.getStoredPerformanceEntries(),
        DebugUtils.getStorageInfo(),
        Promise.resolve(DebugUtils.getMemoryInfo()),
      ]);

      const errorLogs = debugInfo.logs.filter(log => log.level === LogLevel.ERROR);
      const warningLogs = debugInfo.logs.filter(log => log.level === LogLevel.WARN);

      setStats({
        logs: debugInfo.logs.length,
        errors: errorLogs.length,
        warnings: warningLogs.length,
        performance: performanceData.length,
        userActions: debugInfo.userActions.length,
        memoryUsage: memoryInfo?.usedJSHeapSize,
        storageUsage: storageInfo.totalSize,
      });

      setLogs(debugInfo.logs);
      setErrors(storedErrors);
      setPerformanceEntries(performanceData);
    } catch (error) {
      if (__DEV__) {
        if (__DEV__) {

          console.error('[DebugPanel] Failed to load debug data:', error);

        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    Alert.alert(
      'Clear Debug Data',
      'Are you sure you want to clear all debug data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await DebugUtils.clearAllDebugData();
              await ErrorHandler.clearErrorData();
              await loadDebugData();
              Alert.alert('Success', 'Debug data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear debug data');
            }
          },
        },
      ]
    );
  };

  const handleExportLogs = async () => {
    try {
      const report = await DebugUtils.generateDebugReport();
      // In a real app, you would share this report or save it to a file
      Alert.alert(
        'Debug Report Generated',
        'Debug report has been generated. In a production app, this would be saved or shared.',
        [{ text: 'OK' }]
      );
      if (__DEV__) {
        if (__DEV__) {

          console.log('[DebugPanel] Debug Report:', report);

        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate debug report');
    }
  };

  const handleSetLogLevel = async (level: LogLevel) => {
    setLogLevel(level);
    DebugLogger.setLogLevel(level);
    await DebugLogger.info('DebugPanel', `Log level changed to ${LogLevel[level]}`);
  };

  const handleTestError = async () => {
    try {
      const testError = ErrorUtils.createNetworkError('Test error from debug panel', {
        screen: 'DebugPanel',
        action: 'test_error',
      });
      await ErrorHandler.handleError(testError);
      Alert.alert('Test Error', 'Test error has been logged');
    } catch (error) {
      Alert.alert('Error', 'Failed to create test error');
    }
  };

  const filteredLogs = logs.filter(log =>
    searchQuery === '' ||
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.logs}</Text>
          <Text style={styles.statLabel}>Total Logs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.errors}</Text>
          <Text style={styles.statLabel}>Errors</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.warnings}</Text>
          <Text style={styles.statLabel}>Warnings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.performance}</Text>
          <Text style={styles.statLabel}>Performance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.userActions}</Text>
          <Text style={styles.statLabel}>User Actions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {stats.memoryUsage ? `${Math.round(stats.memoryUsage / 1024 / 1024)}MB` : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Memory</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleTestError}>
            <AlertTriangle size={16} color="#EF4444" />
            <Text style={styles.actionButtonText}>Test Error</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportLogs}>
            <Download size={16} color="#10B981" />
            <Text style={styles.actionButtonText}>Export Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleClearLogs}>
            <Trash2 size={16} color="#EF4444" />
            <Text style={styles.actionButtonText}>Clear Data</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderLogs = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search logs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView style={styles.logsList}>
        {filteredLogs.map((log, index) => (
          <View key={index} style={styles.logEntry}>
            <View style={styles.logHeader}>
              <Text style={[styles.logLevel, { color: getLogLevelColor(log.level) }]}>
                {LogLevel[log.level]}
              </Text>
              <Text style={styles.logCategory}>{log.category}</Text>
              <Text style={styles.logTime}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.logMessage}>{log.message}</Text>
            {log.data && (
              <Text style={styles.logData}>
                {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderPerformance = () => (
    <ScrollView style={styles.tabContent}>
      {performanceEntries.map((entry, index) => (
        <View key={index} style={styles.performanceEntry}>
          <View style={styles.performanceHeader}>
            <Text style={styles.performanceOperation}>{entry.operation}</Text>
            <Text style={[
              styles.performanceDuration,
              { color: entry.duration > 1000 ? '#EF4444' : '#10B981' }
            ]}>
              {entry.duration}ms
            </Text>
          </View>
          <Text style={styles.performanceCategory}>{entry.category}</Text>
          <Text style={styles.performanceTime}>
            {new Date(entry.timestamp).toLocaleString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  const renderErrors = () => (
    <ScrollView style={styles.tabContent}>
      {errors.map((error, index) => (
        <View key={index} style={styles.errorEntry}>
          <View style={styles.errorHeader}>
            <Text style={styles.errorType}>{error.type}</Text>
            <Text style={[styles.errorSeverity, { color: getSeverityColor(error.severity) }]}>
              {error.severity}
            </Text>
          </View>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <Text style={styles.errorTime}>
            {new Date(error.timestamp).toLocaleString()}
          </Text>
          {error.stack && (
            <Text style={styles.errorStack} numberOfLines={3}>
              {error.stack}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.settingSection}>
        <Text style={styles.settingTitle}>Log Level</Text>
        <View style={styles.logLevelButtons}>
          {Object.entries(LogLevel)
            .filter(([key]) => isNaN(Number(key)))
            .map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.logLevelButton,
                  logLevel === value && styles.logLevelButtonActive
                ]}
                onPress={() => handleSetLogLevel(value as LogLevel)}
              >
                <Text style={[
                  styles.logLevelButtonText,
                  logLevel === value && styles.logLevelButtonTextActive
                ]}>
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      </View>

      <View style={styles.settingSection}>
        <Text style={styles.settingTitle}>Debug Features</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Console Logging</Text>
          <Switch value={true} disabled />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Performance Monitoring</Text>
          <Switch value={true} disabled />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>User Action Tracking</Text>
          <Switch value={true} disabled />
        </View>
      </View>
    </ScrollView>
  );

  const getLogLevelColor = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.ERROR: return '#EF4444';
      case LogLevel.WARN: return '#F59E0B';
      case LogLevel.INFO: return '#3B82F6';
      case LogLevel.DEBUG: return '#6B7280';
      case LogLevel.TRACE: return '#9CA3AF';
      default: return '#6B7280';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Bug size={24} color="#3B82F6" />
            <Text style={styles.headerTitle}>Debug Panel</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Activity size={16} color={activeTab === 'overview' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'logs' && styles.tabActive]}
            onPress={() => setActiveTab('logs')}
          >
            <Text style={[styles.tabText, activeTab === 'logs' && styles.tabTextActive]}>
              Logs ({stats.logs})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'performance' && styles.tabActive]}
            onPress={() => setActiveTab('performance')}
          >
            <Text style={[styles.tabText, activeTab === 'performance' && styles.tabTextActive]}>
              Performance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'errors' && styles.tabActive]}
            onPress={() => setActiveTab('errors')}
          >
            <AlertTriangle size={16} color={activeTab === 'errors' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'errors' && styles.tabTextActive]}>
              Errors ({stats.errors})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Settings size={16} color={activeTab === 'settings' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'performance' && renderPerformance()}
          {activeTab === 'errors' && renderErrors()}
          {activeTab === 'settings' && renderSettings()}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
  },
  logsList: {
    flex: 1,
  },
  logEntry: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  logLevel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  logCategory: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  logMessage: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  logData: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
  },
  performanceEntry: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  performanceOperation: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  performanceDuration: {
    fontSize: 14,
    fontWeight: '600',
  },
  performanceCategory: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  performanceTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  errorEntry: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  errorType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  errorSeverity: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  errorMessage: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  errorTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  errorStack: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'monospace',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
  },
  settingSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  logLevelButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  logLevelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logLevelButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  logLevelButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  logLevelButtonTextActive: {
    color: 'white',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: '#374151',
  },
});