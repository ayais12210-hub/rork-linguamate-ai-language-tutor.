import { z } from 'zod';
import { BoundedString, BoundedFloat, ImageFileRef, BCP47 } from './common';

export const UpdateProfileSchema = z.object({
  displayName: BoundedString(2, 40, 'DISPLAY_NAME_INVALID').optional(),
  bio: BoundedString(0, 280, 'BIO_TOO_LONG').optional(),
  avatar: ImageFileRef.optional(),
});

export const UpdatePreferencesSchema = z.object({
  language: BCP47.optional(),
  speakRate: BoundedFloat(0.5, 1.5, 'SPEAK_RATE_OUT_OF_RANGE').optional(),
  theme: z.enum(['light', 'dark', 'system'], { message: 'INVALID_THEME' }).optional(),
  notificationsEnabled: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  hapticEnabled: z.boolean().optional(),
});

export const UpdateNotificationSettingsSchema = z.object({
  dailyReminder: z.boolean().optional(),
  streakReminder: z.boolean().optional(),
  achievementAlerts: z.boolean().optional(),
  lessonUpdates: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
});

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, 'PASSWORD_REQUIRED'),
  confirmation: z
    .string()
    .refine((v) => v === 'DELETE', 'CONFIRMATION_INVALID'),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
export type UpdateNotificationSettingsInput = z.infer<typeof UpdateNotificationSettingsSchema>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
