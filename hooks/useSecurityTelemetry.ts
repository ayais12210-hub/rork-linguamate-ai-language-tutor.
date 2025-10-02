import { useLogger } from './useLogger';

export function useSecurityTelemetry() {
  const log = useLogger();

  return {
    logAuthFailure: (evt: string, data?: Record<string, unknown>) => {
      log.security(evt, 'Authentication failure detected', data);
    },

    logAuthSuccess: (evt: string, data?: Record<string, unknown>) => {
      log.security(evt, 'Authentication successful', data);
    },

    logBruteForce: (data?: Record<string, unknown>) => {
      log.security('SEC_AUTH_BRUTEFORCE', 'Brute force attack detected', data);
    },

    logInvalidToken: (data?: Record<string, unknown>) => {
      log.security('SEC_AUTH_TOKEN_INVALID', 'Invalid token presented', data);
    },

    logRateLimitTripped: (data?: Record<string, unknown>) => {
      log.security('SEC_RATE_LIMIT_TRIPPED', 'Rate limit exceeded', data);
    },

    logInputValidationFail: (data?: Record<string, unknown>) => {
      log.security('SEC_INPUT_VALIDATION_FAIL', 'Input validation failed', data);
    },

    logPermissionDenied: (data?: Record<string, unknown>) => {
      log.security('SEC_AUTHZ_DENIED', 'Permission denied', data);
    },

    logPaymentAnomaly: (data?: Record<string, unknown>) => {
      log.security('SEC_PAYMENT_ANOMALY', 'Payment anomaly detected', data);
    },

    logDataAccessDenied: (data?: Record<string, unknown>) => {
      log.security('SEC_DATA_ACCESS_DENIED', 'Data access denied', data);
    },

    logAIOutputBlocked: (data?: Record<string, unknown>) => {
      log.security('SEC_AI_OUTPUT_POLICY_BLOCKED', 'AI output blocked by policy', data);
    },
  };
}
