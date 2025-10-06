import React, { useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  // FlatList, // Replaced with FlashList for better performance
  Pressable,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

interface SelectProps<T = string> {
  label?: string;
  value?: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  containerStyle?: object;
  testID?: string;
}

export function Select<T = string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  error,
  helperText,
  required = false,
  disabled = false,
  containerStyle,
  testID,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const hasError = Boolean(error);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && (
        <Text style={styles.label} testID={`${testID}-label`}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.selectButton,
          hasError && styles.selectButtonError,
          disabled && styles.selectButtonDisabled,
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        accessible
        accessibilityLabel={label || placeholder}
        accessibilityState={{ disabled }}
        accessibilityHint={helperText || error}
        testID={`${testID}-button`}
      >
        <Text
          style={[
            styles.selectText,
            !selectedOption && styles.selectPlaceholder,
            disabled && styles.selectTextDisabled,
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={20} color={disabled ? '#9CA3AF' : '#6B7280'} />
      </TouchableOpacity>

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

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <View style={styles.modalContent}>
            <FlashList
              data={options}
              estimatedItemSize={50}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(item.value)}
                  testID={`${testID}-option-${item.value}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
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
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  selectButtonError: {
    borderColor: '#EF4444',
  },
  selectButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  selectText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectPlaceholder: {
    color: '#9CA3AF',
  },
  selectTextDisabled: {
    color: '#9CA3AF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionSelected: {
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  optionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600' as const,
  },
});
