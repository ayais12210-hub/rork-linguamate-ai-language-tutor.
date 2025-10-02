import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  AccessibilityProps,
} from 'react-native';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  containerStyle?: object;
  inputStyle?: object;
  testID?: string;
}

export function TextField({
  label,
  error,
  helperText,
  required = false,
  maxLength,
  showCharCount = false,
  containerStyle,
  inputStyle,
  testID,
  value = '',
  ...props
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const hasError = Boolean(error);
  const charCount = typeof value === 'string' ? value.length : 0;

  const accessibilityProps: AccessibilityProps = {
    accessible: true,
    accessibilityLabel: label || props.placeholder,
    accessibilityState: { disabled: props.editable === false },
    accessibilityHint: helperText || error,
  };

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && (
        <Text style={styles.label} testID={`${testID}-label`}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <TextInput
        {...props}
        {...accessibilityProps}
        value={value}
        maxLength={maxLength}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          inputStyle,
        ]}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        testID={`${testID}-input`}
      />

      {(error || helperText || (showCharCount && maxLength)) && (
        <View style={styles.footer}>
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

          {showCharCount && maxLength && (
            <Text
              style={[
                styles.charCount,
                charCount > maxLength * 0.9 && styles.charCountWarning,
              ]}
              testID={`${testID}-char-count`}
            >
              {charCount}/{maxLength}
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
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputFocused: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  messageContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  charCountWarning: {
    color: '#F59E0B',
  },
});
