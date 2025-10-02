import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Upload, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

interface FilePickerProps {
  label?: string;
  value?: { uri: string; name: string; mimeType: string; size: number } | null;
  onChange: (file: { uri: string; name: string; mimeType: string; size: number } | null) => void;
  accept?: string[];
  maxSizeBytes?: number;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  containerStyle?: object;
  testID?: string;
}

export function FilePicker({
  label,
  value,
  onChange,
  accept = ['*/*'],
  maxSizeBytes = 10_000_000,
  error,
  helperText,
  required = false,
  disabled = false,
  containerStyle,
  testID,
}: FilePickerProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const hasError = Boolean(error);

  const handlePickFile = async () => {
    if (disabled) return;

    try {
      setIsLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: accept,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];

      if (!file) {
        setIsLoading(false);
        return;
      }

      if (file.size && file.size > maxSizeBytes) {
        Alert.alert(
          'File Too Large',
          `File size must be less than ${(maxSizeBytes / 1_000_000).toFixed(1)} MB`
        );
        setIsLoading(false);
        return;
      }

      onChange({
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType || 'application/octet-stream',
        size: file.size || 0,
      });

      setIsLoading(false);
    } catch (err) {
      console.error('File picker error:', err);
      Alert.alert('Error', 'Failed to pick file');
      setIsLoading(false);
    }
  };

  const handleRemoveFile = () => {
    onChange(null);
  };

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && (
        <Text style={styles.label} testID={`${testID}-label`}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {!value ? (
        <TouchableOpacity
          style={[
            styles.uploadButton,
            hasError && styles.uploadButtonError,
            disabled && styles.uploadButtonDisabled,
          ]}
          onPress={handlePickFile}
          disabled={disabled || isLoading}
          accessible
          accessibilityLabel={label || 'Pick a file'}
          accessibilityState={{ disabled: disabled || isLoading }}
          accessibilityHint={helperText || error}
          testID={`${testID}-button`}
        >
          <Upload size={24} color={disabled ? '#9CA3AF' : '#3B82F6'} />
          <Text
            style={[
              styles.uploadText,
              disabled && styles.uploadTextDisabled,
            ]}
          >
            {isLoading ? 'Loading...' : 'Choose File'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.filePreview}>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {value.name}
            </Text>
            <Text style={styles.fileSize}>
              {(value.size / 1024).toFixed(1)} KB
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleRemoveFile}
            disabled={disabled}
            accessible
            accessibilityLabel="Remove file"
            testID={`${testID}-remove`}
          >
            <X size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      {(error || helperText) && (
        <View style={styles.messageContainer}>
          {error && (
            <Text style={styles.errorText} testID={`${testID}-error`}>
              {error}
            </Text>
          )}
          {!error && helperText && (
            <Text style={styles.helperText} testID={`${testID}-helper`}>
              {helperText}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  uploadButtonError: {
    borderColor: '#EF4444',
  },
  uploadButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  uploadText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500' as const,
  },
  uploadTextDisabled: {
    color: '#9CA3AF',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  fileInfo: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageContainer: {
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
