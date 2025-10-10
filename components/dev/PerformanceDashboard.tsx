/**
 * Performance Dashboard Component
 * A developer tool for monitoring app performance in real-time
 * Only available in development mode
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { usePerformanceMetrics, usePerformanceReport, useMemoryMonitoring } from '@/hooks/usePerformanceMonitor';
import { PerformanceMetric } from '@/lib/performance/monitor';

interface PerformanceDashboardProps {
  visible?: boolean;
  onClose?: () => void;
}

export function PerformanceDashboard({ visible = false, onClose }: PerformanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'memory' | 'report'>('metrics');
  const { metrics, refreshMetrics } = usePerformanceMetrics();
  const { report, generateReport, exportReport, clearMetrics } = usePerformanceReport();
  const memoryInfo = useMemoryMonitoring(2000);

  // Don't render in production
  if (!__DEV__ || !visible) {
    return null;
  }

  const groupedMetrics = groupMetricsByType(metrics);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Dashboard</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'metrics' && styles.activeTab]}
          onPress={() => setActiveTab('metrics')}
        >
          <Text style={[styles.tabText, activeTab === 'metrics' && styles.activeTabText]}>
            Metrics ({metrics.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'memory' && styles.activeTab]}
          onPress={() => setActiveTab('memory')}
        >
          <Text style={[styles.tabText, activeTab === 'memory' && styles.activeTabText]}>
            Memory
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'report' && styles.activeTab]}
          onPress={() => setActiveTab('report')}
        >
          <Text style={[styles.tabText, activeTab === 'report' && styles.activeTabText]}>
            Report
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'metrics' && (
          <MetricsTab groupedMetrics={groupedMetrics} onRefresh={refreshMetrics} />
        )}
        {activeTab === 'memory' && (
          <MemoryTab memoryInfo={memoryInfo} />
        )}
        {activeTab === 'report' && (
          <ReportTab
            report={report}
            onGenerateReport={generateReport}
            onExportReport={exportReport}
            onClearMetrics={clearMetrics}
          />
        )}
      </ScrollView>
    </View>
  );
}

function MetricsTab({ 
  groupedMetrics, 
  onRefresh 
}: { 
  groupedMetrics: Record<string, PerformanceMetric[]>;
  onRefresh: () => void;
}) {
  return (
    <View>
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={onRefresh} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {Object.entries(groupedMetrics).map(([type, metrics]) => (
        <View key={type} style={styles.metricGroup}>
          <Text style={styles.metricGroupTitle}>{type.toUpperCase()}</Text>
          {metrics.slice(-5).map((metric, index) => (
            <View key={index} style={styles.metricItem}>
              <Text style={styles.metricName}>{metric.name}</Text>
              <Text style={styles.metricValue}>
                {formatMetricValue(metric.value, type)}
              </Text>
              <Text style={styles.metricTime}>
                {new Date(metric.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function MemoryTab({ memoryInfo }: { memoryInfo: any }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Memory Usage</Text>
      {memoryInfo.usedJSHeapSize ? (
        <View style={styles.memoryInfo}>
          <View style={styles.memoryItem}>
            <Text style={styles.memoryLabel}>Used Heap:</Text>
            <Text style={styles.memoryValue}>
              {formatBytes(memoryInfo.usedJSHeapSize)}
            </Text>
          </View>
          <View style={styles.memoryItem}>
            <Text style={styles.memoryLabel}>Total Heap:</Text>
            <Text style={styles.memoryValue}>
              {formatBytes(memoryInfo.totalJSHeapSize)}
            </Text>
          </View>
          <View style={styles.memoryItem}>
            <Text style={styles.memoryLabel}>Heap Limit:</Text>
            <Text style={styles.memoryValue}>
              {formatBytes(memoryInfo.jsHeapSizeLimit)}
            </Text>
          </View>
          <View style={styles.memoryUsageBar}>
            <View
              style={[
                styles.memoryUsageFill,
                {
                  width: `${(memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : (
        <Text style={styles.noDataText}>Memory information not available on this platform</Text>
      )}
    </View>
  );
}

function ReportTab({
  report,
  onGenerateReport,
  onExportReport,
  onClearMetrics,
}: {
  report: any;
  onGenerateReport: () => void;
  onExportReport: () => string;
  onClearMetrics: () => void;
}) {
  const [exportedData, setExportedData] = useState<string>('');

  const handleExport = () => {
    const data = onExportReport();
    setExportedData(data);
  };

  return (
    <View>
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={onGenerateReport} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Generate Report</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExport} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Export JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClearMetrics} style={[styles.actionButton, styles.dangerButton]}>
          <Text style={styles.actionButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {report && (
        <View style={styles.reportInfo}>
          <Text style={styles.sectionTitle}>Performance Report</Text>
          <Text style={styles.reportItem}>Platform: {report.platform}</Text>
          <Text style={styles.reportItem}>Metrics Count: {report.metrics.length}</Text>
          <Text style={styles.reportItem}>
            Generated: {new Date(report.timestamp).toLocaleString()}
          </Text>
        </View>
      )}

      {exportedData && (
        <View style={styles.exportedData}>
          <Text style={styles.sectionTitle}>Exported Data</Text>
          <ScrollView style={styles.jsonContainer} horizontal>
            <Text style={styles.jsonText}>{exportedData}</Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function groupMetricsByType(metrics: PerformanceMetric[]): Record<string, PerformanceMetric[]> {
  return metrics.reduce((groups, metric) => {
    const type = metric.metadata?.type || 'general';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(metric);
    return groups;
  }, {} as Record<string, PerformanceMetric[]>);
}

function formatMetricValue(value: number, type: string): string {
  if (type === 'memory') {
    return formatBytes(value);
  }
  return `${value.toFixed(2)}ms`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    bottom: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 8,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#ccc',
    fontSize: 14,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  actionBar: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  dangerButton: {
    backgroundColor: '#ff4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricGroup: {
    marginBottom: 16,
  },
  metricGroupTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  metricName: {
    color: '#ccc',
    fontSize: 12,
    flex: 2,
  },
  metricValue: {
    color: '#4CAF50',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  metricTime: {
    color: '#666',
    fontSize: 10,
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  memoryInfo: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 4,
  },
  memoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  memoryLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  memoryValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  memoryUsageBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginTop: 8,
  },
  memoryUsageFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  noDataText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  reportInfo: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  reportItem: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  exportedData: {
    marginTop: 16,
  },
  jsonContainer: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 4,
    maxHeight: 200,
  },
  jsonText: {
    color: '#4CAF50',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default PerformanceDashboard;
