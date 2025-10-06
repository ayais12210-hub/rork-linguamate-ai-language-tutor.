import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AppErrorBoundary } from '@/components/boundaries/AppErrorBoundary';
import { InlineError, FormError, ToastInfo } from '@/components/feedback';
import { useFormValidation } from '@/lib/validation/zodResolver';
import { UserRegistrationSchema } from '@/schemas/user';
import { getJson, withRetry } from '@/lib/net/http';
import { getSTT, getTTS } from '@/lib/stt';
import { safeSetItem } from '@/lib/state/safeStorage';
import { trackError, trackAction } from '@/observability/telemetry';
import { Result } from '@/lib/errors/result';
import { AppError } from '@/lib/errors/AppError';

// Example component demonstrating comprehensive error handling
export function ErrorHandlingExample() {
  const [networkError, setNetworkError] = useState<AppError | null>(null);
  const [speechError, setSpeechError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form validation with error handling
  const {
    values,
    errors,
    isValidating,
    validate,
    setValue,
    clearErrors,
  } = useFormValidation(UserRegistrationSchema, {
    email: '',
    password: '',
    displayName: '',
    acceptTerms: false,
  });

  // Network request with error handling
  const handleNetworkRequest = async () => {
    setIsLoading(true);
    setNetworkError(null);

    const result = await withRetry(async () => {
      return getJson('/api/user/profile', UserRegistrationSchema);
    });

    if (result.ok) {
      console.log('Network request successful:', result.value);
      await trackAction('network_request_success', {
        actionType: 'api_call',
        success: true,
      });
    } else {
      setNetworkError(result.error);
      await trackError('network_request_failed', {
        error: result.error,
        context: { endpoint: '/api/user/profile' },
      });
    }

    setIsLoading(false);
  };

  // Speech recognition with error handling
  const handleSpeechRecognition = async () => {
    setSpeechError(null);
    const stt = getSTT();

    const result = await stt.start(
      (partialResult) => {
        console.log('Partial result:', partialResult.text);
      },
      (error) => {
        setSpeechError(error);
        trackError('speech_recognition_error', { error });
      }
    );

    if (!result.ok) {
      setSpeechError(result.error);
      await trackError('speech_start_failed', { error: result.error });
    }
  };

  // Form submission with error handling
  const handleFormSubmit = async () => {
    const isValid = await validate();
    if (!isValid) {
      await trackError('form_validation_failed', {
        context: { errors },
      });
      return;
    }

    setIsLoading(true);
    clearErrors();

    // Save form data to storage
    const saveResult = await safeSetItem('user_registration', values);
    if (!saveResult.ok) {
      await trackError('storage_save_failed', { error: saveResult.error });
      return;
    }

    // Simulate API call
    const apiResult = await withRetry(async () => {
      return getJson('/api/register', UserRegistrationSchema);
    });

    if (apiResult.ok) {
      await trackAction('user_registration_success', {
        actionType: 'form_submission',
        success: true,
      });
      console.log('Registration successful');
    } else {
      await trackError('user_registration_failed', {
        error: apiResult.error,
        context: { formData: values },
      });
    }

    setIsLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Error Handling Example</Text>

      {/* Network Error Display */}
      {networkError && (
        <InlineError error={networkError} style={styles.errorContainer} />
      )}

      {/* Speech Error Display */}
      {speechError && (
        <ToastInfo error={speechError} onDismiss={() => setSpeechError(null)} />
      )}

      {/* Form with validation */}
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>User Registration</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={values.email}
            onChangeText={(text) => setValue('email', text)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <FormError error={null} field="email" />}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={[styles.input, errors.displayName && styles.inputError]}
            value={values.displayName}
            onChangeText={(text) => setValue('displayName', text)}
            placeholder="Enter your display name"
          />
          {errors.displayName && <FormError error={null} field="displayName" />}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            value={values.password}
            onChangeText={(text) => setValue('password', text)}
            placeholder="Enter your password"
            secureTextEntry
          />
          {errors.password && <FormError error={null} field="password" />}
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleFormSubmit}
          disabled={isLoading || isValidating}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Submitting...' : 'Submit Registration'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleNetworkRequest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Network Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSpeechRecognition}
        >
          <Text style={styles.buttonText}>Start Speech Recognition</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Wrapped with error boundary
export function ErrorHandlingExampleWithBoundary() {
  return (
    <AppErrorBoundary>
      <ErrorHandlingExample />
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  form: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    gap: 12,
  },
  errorContainer: {
    marginBottom: 16,
  },
});