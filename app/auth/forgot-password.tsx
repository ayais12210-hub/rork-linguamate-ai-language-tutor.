import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { trpc } from '@/lib/trpc';
import { InputSanitizer } from '@/lib/security';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setStep('code');
      Alert.alert(
        'Check Your Email',
        'We have sent a verification code to your email address.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to send reset code');
    },
  });

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      Alert.alert(
        'Password Reset',
        'Your password has been successfully reset.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to reset password');
    },
  });

  const handleSendCode = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    try {
      const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
      await requestResetMutation.mutateAsync({ email: sanitizedEmail });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = () => {
    const newErrors: Record<string, string> = {};
    
    if (!code) {
      newErrors.code = 'Verification code is required';
    } else if (code.length !== 6) {
      newErrors.code = 'Code must be 6 digits';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setStep('password');
  };

  const handleResetPassword = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    try {
      const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
      await resetPasswordMutation.mutateAsync({
        email: sanitizedEmail,
        code,
        newPassword,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a verification code
            </Text>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>
          </>
        );

      case 'code':
        return (
          <>
            <Text style={styles.title}>Enter Code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to {email}
            </Text>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, errors.code && styles.inputError]}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#9CA3AF"
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  if (errors.code) setErrors({ ...errors, code: '' });
                }}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
              />
            </View>
            {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Verify Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendCode}
              disabled={isLoading}
            >
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
          </>
        );

      case 'password':
        return (
          <>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password
            </Text>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, errors.newPassword && styles.inputError]}
                placeholder="New Password"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                }}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
            {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}

            <View style={styles.inputContainer}>
              <Lock size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Confirm Password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <LinearGradient
      colors={['#10B981', '#059669']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (step === 'email') {
                  router.back();
                } else if (step === 'code') {
                  setStep('email');
                } else {
                  setStep('code');
                }
              }}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.formContainer}>
              {renderContent()}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  content: {
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center' as const,
  },
  resendText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500' as const,
  },
});