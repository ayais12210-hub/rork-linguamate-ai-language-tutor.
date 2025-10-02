import { z } from 'zod';
import { Email, BoundedString } from './common';

export const FeedbackCategory = z.enum(['bug', 'idea', 'question', 'other'], {
  message: 'INVALID_CATEGORY',
});

export const FeedbackSubmitSchema = z.object({
  category: FeedbackCategory,
  message: BoundedString(5, 2000, 'MESSAGE_LENGTH_INVALID'),
  email: Email.optional(),
  deviceInfo: z
    .object({
      platform: z.string(),
      version: z.string(),
      model: z.string().optional(),
    })
    .optional(),
});

export const ReportIssueSchema = z.object({
  type: z.enum(['content', 'technical', 'abuse', 'other'], { message: 'INVALID_TYPE' }),
  description: BoundedString(10, 1000, 'DESCRIPTION_LENGTH_INVALID'),
  lessonId: z.string().uuid('INVALID_LESSON_ID').optional(),
  screenshot: z.string().optional(),
});

export type FeedbackSubmitInput = z.infer<typeof FeedbackSubmitSchema>;
export type ReportIssueInput = z.infer<typeof ReportIssueSchema>;
