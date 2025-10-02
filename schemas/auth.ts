import { z } from 'zod';
import { Email, BoundedString, BCP47 } from './common';

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const DISPLAY_NAME_MIN = 2;
const DISPLAY_NAME_MAX = 40;
const OTP_LENGTH = 6;

export const Password = z
  .string()
  .min(PASSWORD_MIN, 'PASSWORD_TOO_SHORT')
  .max(PASSWORD_MAX, 'PASSWORD_TOO_LONG')
  .refine((v) => /[A-Z]/.test(v), 'PASSWORD_NEEDS_UPPERCASE')
  .refine((v) => /[a-z]/.test(v), 'PASSWORD_NEEDS_LOWERCASE')
  .refine((v) => /[0-9]/.test(v), 'PASSWORD_NEEDS_NUMBER');

export const DisplayName = BoundedString(
  DISPLAY_NAME_MIN,
  DISPLAY_NAME_MAX,
  'DISPLAY_NAME_INVALID'
).refine((v) => v.trim().length >= DISPLAY_NAME_MIN, 'DISPLAY_NAME_TOO_SHORT');

export const SignInSchema = z.object({
  email: Email,
  password: z.string().min(1, 'PASSWORD_REQUIRED'),
  rememberMe: z.boolean().optional().default(false),
});

export const SignUpSchema = z.object({
  email: Email,
  password: Password,
  displayName: DisplayName,
  locale: BCP47.optional(),
  acceptedTerms: z.boolean().refine((v) => v === true, 'MUST_ACCEPT_TERMS'),
});

export const VerifyOtpSchema = z.object({
  email: Email,
  otp: z
    .string()
    .length(OTP_LENGTH, 'OTP_INVALID_LENGTH')
    .regex(/^\d{6}$/, 'OTP_MUST_BE_NUMERIC'),
});

export const ForgotPasswordSchema = z.object({
  email: Email,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'TOKEN_REQUIRED'),
  password: Password,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'PASSWORDS_DO_NOT_MATCH',
  path: ['confirmPassword'],
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'CURRENT_PASSWORD_REQUIRED'),
  newPassword: Password,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'PASSWORDS_DO_NOT_MATCH',
  path: ['confirmPassword'],
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'REFRESH_TOKEN_REQUIRED'),
});

export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
