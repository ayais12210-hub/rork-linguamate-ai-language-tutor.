import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  hintStyle?: TextStyle;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  hintStyle,
  variant = 'default',
  size = 'medium',
  disabled = false,
  isPassword = false,
  secureTextEntry,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const isSecure = isPassword && !showPassword;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          styles[variant],
          styles[`${size}Container`],
          isFocused && styles.focused,
          error && styles.errorContainer,
          disabled && styles.disabled,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            styles[`${size}Input`],
            inputStyle,
          ]}
          placeholderTextColor="#8E8E93"
          editable={!disabled}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={handleTogglePassword}
            style={styles.rightIcon}
          >
            {showPassword ? (
              <EyeOff size={20} color="#8E8E93" />
            ) : (
              <Eye size={20} color="#8E8E93" />
            )}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>
      {error && (
        <Text style={[styles.error, errorStyle]}>{error}</Text>
      )}
      {hint && !error && (
        <Text style={[styles.hint, hintStyle]}>{hint}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  default: {
    backgroundColor: '#F2F2F7',
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C7C7CC',
  },
  filled: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  smallContainer: {
    height: 36,
    paddingHorizontal: 12,
  },
  mediumContainer: {
    height: 44,
    paddingHorizontal: 16,
  },
  largeContainer: {
    height: 52,
    paddingHorizontal: 20,
  },
  focused: {
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  errorContainer: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    color: '#000000',
  },
  smallInput: {
    fontSize: 14,
  },
  mediumInput: {
    fontSize: 16,
  },
  largeInput: {
    fontSize: 18,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
});