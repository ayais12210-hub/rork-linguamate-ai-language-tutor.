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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Globe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { trpc } from '@/lib/trpc';
import { useUser } from '@/hooks/user-store';
import { TokenManager, SessionManager, SecurityAudit } from '@/lib/security';
import { InputSanitizer } from '@/lib/security';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      console.log('[Login] Success:', data.user.email);
      
      // Store tokens securely
      await TokenManager.storeTokens(data.accessToken, data.refreshToken);
      
      // Create session
      await SessionManager.createSession(data.user.id, data.user);
      
      // Log security event
      await SecurityAudit.logSecurityEvent('user_login', {
        userId: data.user.id,
        email: data.user.email,
      }, 'low');
      
      // Update user context
      setUser(data.user);
      
      // Navigate to main app
      router.replace('/(tabs)/lessons');
    },
    onError: async (error) => {
      console.error('[Login] Error:', error);
      
      // Log failed attempt
      await SecurityAudit.logSecurityEvent('login_failed', {
        email: InputSanitizer.sanitizeEmail(email),
        error: error.message,
      }, 'medium');
      
      Alert.alert(
        'Login Failed',
        error.message || 'Invalid email or password. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
      await loginMutation.mutateAsync({
        email: sanitizedEmail,
        password,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
  };

  const handleGoogleLogin = async () => {
    // TODO: Implement Google OAuth
    Alert.alert('Coming Soon', 'Google login will be available soon!');
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Globe size={60} color="white" />
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Continue your language journey</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              <View style={styles.inputContainer}>
                <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={isLoading}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: 'white',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
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
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end' as const,
    marginBottom: 20,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  loginButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  divider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500' as const,
  },
  signupContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  signupText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});