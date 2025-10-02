import { ERROR_CODES, type ErrorCode } from '@/schemas/errors';

type ErrorMessages = {
  [K in ErrorCode]: string;
};

export const ERROR_MESSAGES_EN: ErrorMessages = {
  [ERROR_CODES.INVALID_EMAIL]: 'Please enter a valid email address',
  [ERROR_CODES.EMAIL_TOO_LONG]: 'Email address is too long',
  [ERROR_CODES.INVALID_UUID]: 'Invalid identifier',
  [ERROR_CODES.INVALID_LOCALE]: 'Invalid language code',
  [ERROR_CODES.INVALID_CURRENCY]: 'Invalid currency code',
  [ERROR_CODES.STRING_TOO_LONG]: 'Text is too long',
  [ERROR_CODES.STRING_LENGTH_INVALID]: 'Text length is invalid',
  [ERROR_CODES.NUMBER_OUT_OF_RANGE]: 'Number is out of range',
  [ERROR_CODES.INVALID_INTEGER]: 'Must be a whole number',
  [ERROR_CODES.MUST_BE_POSITIVE]: 'Must be a positive number',
  [ERROR_CODES.MUST_BE_NON_NEGATIVE]: 'Must be zero or greater',
  [ERROR_CODES.HTML_TOO_LONG]: 'Content is too long',
  [ERROR_CODES.UNSAFE_HTML_DETECTED]: 'Unsafe content detected',
  [ERROR_CODES.SCRIPT_TAG_DETECTED]: 'Script tags are not allowed',
  [ERROR_CODES.MIME_NOT_ALLOWED]: 'File type is not allowed',
  [ERROR_CODES.INVALID_URI]: 'Invalid URL',
  [ERROR_CODES.FILENAME_INVALID]: 'Invalid filename',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File is too large',
  [ERROR_CODES.AUDIO_DURATION_INVALID]: 'Audio duration is invalid',
  [ERROR_CODES.INVALID_SORT_ORDER]: 'Invalid sort order',
  [ERROR_CODES.PASSWORD_TOO_SHORT]: 'Password must be at least 8 characters',
  [ERROR_CODES.PASSWORD_TOO_LONG]: 'Password is too long',
  [ERROR_CODES.PASSWORD_NEEDS_UPPERCASE]: 'Password must contain an uppercase letter',
  [ERROR_CODES.PASSWORD_NEEDS_LOWERCASE]: 'Password must contain a lowercase letter',
  [ERROR_CODES.PASSWORD_NEEDS_NUMBER]: 'Password must contain a number',
  [ERROR_CODES.PASSWORD_REQUIRED]: 'Password is required',
  [ERROR_CODES.DISPLAY_NAME_INVALID]: 'Display name is invalid',
  [ERROR_CODES.DISPLAY_NAME_TOO_SHORT]: 'Display name is too short',
  [ERROR_CODES.MUST_ACCEPT_TERMS]: 'You must accept the terms and conditions',
  [ERROR_CODES.OTP_INVALID_LENGTH]: 'Code must be 6 digits',
  [ERROR_CODES.OTP_MUST_BE_NUMERIC]: 'Code must contain only numbers',
  [ERROR_CODES.TOKEN_REQUIRED]: 'Token is required',
  [ERROR_CODES.PASSWORDS_DO_NOT_MATCH]: 'Passwords do not match',
  [ERROR_CODES.CURRENT_PASSWORD_REQUIRED]: 'Current password is required',
  [ERROR_CODES.REFRESH_TOKEN_REQUIRED]: 'Refresh token is required',
  [ERROR_CODES.BIO_TOO_LONG]: 'Bio is too long (max 280 characters)',
  [ERROR_CODES.SPEAK_RATE_OUT_OF_RANGE]: 'Speech rate must be between 0.5 and 1.5',
  [ERROR_CODES.INVALID_THEME]: 'Invalid theme selection',
  [ERROR_CODES.CONFIRMATION_INVALID]: 'Please type DELETE to confirm',
  [ERROR_CODES.LEVEL_OUT_OF_RANGE]: 'Level must be between 1 and 10',
  [ERROR_CODES.QUALITY_OUT_OF_RANGE]: 'Quality must be between 0 and 5',
  [ERROR_CODES.TIME_TAKEN_INVALID]: 'Time taken is invalid',
  [ERROR_CODES.SCORE_OUT_OF_RANGE]: 'Score must be between 0 and 100',
  [ERROR_CODES.TIME_SPENT_INVALID]: 'Time spent is invalid',
  [ERROR_CODES.MISTAKES_INVALID]: 'Number of mistakes is invalid',
  [ERROR_CODES.ANSWER_TOO_LONG]: 'Answer is too long',
  [ERROR_CODES.NO_ANSWERS_PROVIDED]: 'Please provide at least one answer',
  [ERROR_CODES.WORD_REQUIRED]: 'Word is required',
  [ERROR_CODES.WORD_TOO_LONG]: 'Word is too long',
  [ERROR_CODES.TRANSLATION_REQUIRED]: 'Translation is required',
  [ERROR_CODES.TRANSLATION_TOO_LONG]: 'Translation is too long',
  [ERROR_CODES.NOTES_TOO_LONG]: 'Notes are too long',
  [ERROR_CODES.PAGE_INVALID]: 'Invalid page number',
  [ERROR_CODES.LIMIT_OUT_OF_RANGE]: 'Limit must be between 1 and 100',
  [ERROR_CODES.INVALID_CATEGORY]: 'Invalid category',
  [ERROR_CODES.MESSAGE_LENGTH_INVALID]: 'Message must be between 5 and 2000 characters',
  [ERROR_CODES.INVALID_TYPE]: 'Invalid type',
  [ERROR_CODES.DESCRIPTION_LENGTH_INVALID]: 'Description must be between 10 and 1000 characters',
  [ERROR_CODES.INVALID_LESSON_ID]: 'Invalid lesson ID',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation error',
  [ERROR_CODES.SEC_INPUT_VALIDATION_FAIL]: 'Security validation failed',
};

export function getErrorMessage(code: ErrorCode, locale: string = 'en'): string {
  if (locale === 'en') {
    return ERROR_MESSAGES_EN[code] || 'An error occurred';
  }
  return ERROR_MESSAGES_EN[code] || 'An error occurred';
}

export function formatZodError(error: { issues: { path: (string | number)[]; message: string }[] }): string {
  if (error.issues.length === 0) return 'Validation error';
  
  const firstIssue = error.issues[0];
  const field = firstIssue.path.join('.');
  const message = firstIssue.message;
  
  if (field) {
    return `${field}: ${message}`;
  }
  
  return message;
}
