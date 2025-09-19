import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Shield, Eye, Lock, AlertTriangle, Activity, Settings } from 'lucide-react-native';
import { useSecurity } from '@/hooks/use-security';
import { SecurityAudit, SECURITY_CONFIG } from '@/lib/security';

interface SecurityDashboardProps {
  onClose?: () => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ onClose }) => {
  const security = useSecurity();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securitySettings, setSecuritySettings] = useState({
    biometricEnabled: false,
    anomalyDetectionEnabled: SECURITY_CONFIG.ANOMALY_DETECTION_ENABLED,
    deviceFingerprintEnabled: SECURITY_CONFIG.DEVICE_FINGERPRINT_ENABLED,
    securityHeadersEnabled: SECURITY_CONFIG.SECURITY_HEADERS_ENABLED,
  });

  useEffect(() => {
    loadAuditLogs();
    checkBiometricStatus();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const logs = await SecurityAudit.getAuditLogs();
      setAuditLogs(logs.slice(0, 20)); // Show last 20 logs
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const checkBiometricStatus = async () => {
    const available = security.biometricAvailable;
    setSecuritySettings(prev => ({ ...prev, biometricEnabled: available }));
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled && security.biometricAvailable) {
      const success = await security.authenticateWithBiometrics();
      if (success) {
        setSecuritySettings(prev => ({ ...prev, biometricEnabled: true }));
        await security.logSecurityEvent('biometric_enabled');
      }
    } else {
      setSecuritySettings(prev => ({ ...prev, biometricEnabled: false }));
      await security.logSecurityEvent('biometric_disabled');
    }
  };

  const handleClearAuditLogs = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to clear all audit logs?');
      if (confirmed) {
        await SecurityAudit.clearAuditLogs();
        setAuditLogs([]);
        await security.logSecurityEvent('audit_logs_cleared', {}, 'medium');
      }
    } else {
      Alert.alert(
        'Clear Audit Logs',
        'Are you sure you want to clear all audit logs?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              await SecurityAudit.clearAuditLogs();
              setAuditLogs([]);
              await security.logSecurityEvent('audit_logs_cleared', {}, 'medium');
            },
          },
        ]
      );
    }
  };

  const handleExportLogs = async () => {
    try {
      const exportData = await SecurityAudit.exportAuditLogs();
      console.log('Audit logs exported:', exportData);
      
      if (Platform.OS === 'web') {
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      await security.logSecurityEvent('audit_logs_exported');
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'low': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Shield size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Security Dashboard</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Security Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Status</Text>
        
        <View style={styles.statusGrid}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Shield size={20} color={getSecurityLevelColor(security.securityLevel)} />
              <Text style={styles.statusLabel}>Security Level</Text>
            </View>
            <Text style={[styles.statusValue, { color: getSecurityLevelColor(security.securityLevel) }]}>
              {security.securityLevel.toUpperCase()}
            </Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Lock size={20} color={security.isAuthenticated ? '#10B981' : '#EF4444'} />
              <Text style={styles.statusLabel}>Authentication</Text>
            </View>
            <Text style={[styles.statusValue, { color: security.isAuthenticated ? '#10B981' : '#EF4444' }]}>
              {security.isAuthenticated ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <AlertTriangle size={20} color={security.threatDetected ? '#EF4444' : '#10B981'} />
              <Text style={styles.statusLabel}>Threats</Text>
            </View>
            <Text style={[styles.statusValue, { color: security.threatDetected ? '#EF4444' : '#10B981' }]}>
              {security.threatDetected ? 'DETECTED' : 'NONE'}
            </Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Activity size={20} color={security.sessionValid ? '#10B981' : '#EF4444'} />
              <Text style={styles.statusLabel}>Session</Text>
            </View>
            <Text style={[styles.statusValue, { color: security.sessionValid ? '#10B981' : '#EF4444' }]}>
              {security.sessionValid ? 'VALID' : 'INVALID'}
            </Text>
          </View>
        </View>
      </View>

      {/* Security Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Settings</Text>
        
        <View style={styles.settingsList}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Biometric Authentication</Text>
              <Text style={styles.settingDescription}>
                {security.biometricAvailable ? 'Use fingerprint or face recognition' : 'Not available on this device'}
              </Text>
            </View>
            <Switch
              value={securitySettings.biometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!security.biometricAvailable}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Anomaly Detection</Text>
              <Text style={styles.settingDescription}>Monitor for unusual activity patterns</Text>
            </View>
            <Switch
              value={securitySettings.anomalyDetectionEnabled}
              onValueChange={(enabled) => {
                setSecuritySettings(prev => ({ ...prev, anomalyDetectionEnabled: enabled }));
                security.logSecurityEvent(enabled ? 'anomaly_detection_enabled' : 'anomaly_detection_disabled');
              }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Device Fingerprinting</Text>
              <Text style={styles.settingDescription}>Track device characteristics for security</Text>
            </View>
            <Switch
              value={securitySettings.deviceFingerprintEnabled}
              onValueChange={(enabled) => {
                setSecuritySettings(prev => ({ ...prev, deviceFingerprintEnabled: enabled }));
                security.logSecurityEvent(enabled ? 'device_fingerprinting_enabled' : 'device_fingerprinting_disabled');
              }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Security Headers</Text>
              <Text style={styles.settingDescription}>Enable additional security headers</Text>
            </View>
            <Switch
              value={securitySettings.securityHeadersEnabled}
              onValueChange={(enabled) => {
                setSecuritySettings(prev => ({ ...prev, securityHeadersEnabled: enabled }));
                security.logSecurityEvent(enabled ? 'security_headers_enabled' : 'security_headers_disabled');
              }}
            />
          </View>
        </View>
      </View>

      {/* Device Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        
        <View style={styles.deviceInfo}>
          <View style={styles.deviceInfoItem}>
            <Text style={styles.deviceInfoLabel}>Platform:</Text>
            <Text style={styles.deviceInfoValue}>{Platform.OS}</Text>
          </View>
          
          <View style={styles.deviceInfoItem}>
            <Text style={styles.deviceInfoLabel}>Device Fingerprint:</Text>
            <Text style={styles.deviceInfoValue} numberOfLines={1}>
              {security.deviceFingerprint || 'Not generated'}
            </Text>
          </View>
          
          <View style={styles.deviceInfoItem}>
            <Text style={styles.deviceInfoLabel}>Biometric Available:</Text>
            <Text style={styles.deviceInfoValue}>
              {security.biometricAvailable ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
      </View>

      {/* Security Audit Logs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Security Audit Logs</Text>
          <View style={styles.logActions}>
            <TouchableOpacity onPress={handleExportLogs} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearAuditLogs} style={[styles.actionButton, styles.dangerButton]}>
              <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.logsList}>
          {auditLogs.length === 0 ? (
            <Text style={styles.noLogsText}>No audit logs available</Text>
          ) : (
            auditLogs.map((log, index) => (
              <View key={index} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(log.severity) }]}>
                    <Text style={styles.severityText}>{log.severity.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.logTimestamp}>{formatTimestamp(log.timestamp)}</Text>
                </View>
                
                <Text style={styles.logEvent}>{log.event}</Text>
                
                {log.details && Object.keys(log.details).length > 0 && (
                  <Text style={styles.logDetails} numberOfLines={2}>
                    {JSON.stringify(log.details)}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </View>

      {/* Security Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Actions</Text>
        
        <View style={styles.actionsList}>
          <TouchableOpacity
            style={styles.securityAction}
            onPress={() => security.generateDeviceFingerprint()}
          >
            <Settings size={20} color="#3B82F6" />
            <Text style={styles.securityActionText}>Regenerate Device Fingerprint</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.securityAction}
            onPress={() => security.checkDeviceSecurity()}
          >
            <Shield size={20} color="#3B82F6" />
            <Text style={styles.securityActionText}>Check Device Security</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.securityAction}
            onPress={() => security.refreshSession()}
          >
            <Activity size={20} color="#3B82F6" />
            <Text style={styles.securityActionText}>Refresh Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsList: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  deviceInfo: {
    gap: 12,
  },
  deviceInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  deviceInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  deviceInfoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  logActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
  logsList: {
    gap: 12,
  },
  noLogsText: {
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  logItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  logEvent: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  logDetails: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionsList: {
    gap: 12,
  },
  securityAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  securityActionText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default SecurityDashboard;