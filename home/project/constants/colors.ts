export const COLORS = {
  // Primary Colors
  primary: '#007AFF',
  primaryLight: '#4DA3FF',
  primaryDark: '#0056CC',
  
  // Secondary Colors
  secondary: '#5856D6',
  secondaryLight: '#8B8AE6',
  secondaryDark: '#3F3EA3',
  
  // Success Colors
  success: '#34C759',
  successLight: '#6BD87A',
  successDark: '#248A3D',
  
  // Warning Colors
  warning: '#FF9500',
  warningLight: '#FFB84D',
  warningDark: '#CC7700',
  
  // Error Colors
  error: '#FF3B30',
  errorLight: '#FF6B62',
  errorDark: '#CC2E25',
  
  // Info Colors
  info: '#5AC8FA',
  infoLight: '#85D7FB',
  infoDark: '#48A0C8',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray Scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#F1F3F4',
  
  // Surface Colors
  surface: '#FFFFFF',
  surfaceSecondary: '#F8F9FA',
  
  // Text Colors
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Border Colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  
  // Transparent
  transparent: 'transparent',
} as const;

export const DARK_COLORS = {
  // Primary Colors (same as light)
  primary: '#007AFF',
  primaryLight: '#4DA3FF',
  primaryDark: '#0056CC',
  
  // Secondary Colors (same as light)
  secondary: '#5856D6',
  secondaryLight: '#8B8AE6',
  secondaryDark: '#3F3EA3',
  
  // Success Colors (same as light)
  success: '#34C759',
  successLight: '#6BD87A',
  successDark: '#248A3D',
  
  // Warning Colors (same as light)
  warning: '#FF9500',
  warningLight: '#FFB84D',
  warningDark: '#CC7700',
  
  // Error Colors (same as light)
  error: '#FF3B30',
  errorLight: '#FF6B62',
  errorDark: '#CC2E25',
  
  // Info Colors (same as light)
  info: '#5AC8FA',
  infoLight: '#85D7FB',
  infoDark: '#48A0C8',
  
  // Neutral Colors
  white: '#000000',
  black: '#FFFFFF',
  
  // Gray Scale (inverted)
  gray50: '#111827',
  gray100: '#1F2937',
  gray200: '#374151',
  gray300: '#4B5563',
  gray400: '#6B7280',
  gray500: '#9CA3AF',
  gray600: '#D1D5DB',
  gray700: '#E5E7EB',
  gray800: '#F3F4F6',
  gray900: '#F9FAFB',
  
  // Background Colors
  background: '#000000',
  backgroundSecondary: '#111827',
  backgroundTertiary: '#1F2937',
  
  // Surface Colors
  surface: '#111827',
  surfaceSecondary: '#1F2937',
  
  // Text Colors
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textInverse: '#1F2937',
  
  // Border Colors
  border: '#374151',
  borderLight: '#1F2937',
  borderDark: '#4B5563',
  
  // Overlay Colors
  overlay: 'rgba(255, 255, 255, 0.1)',
  overlayLight: 'rgba(255, 255, 255, 0.05)',
  overlayDark: 'rgba(255, 255, 255, 0.2)',
  
  // Transparent
  transparent: 'transparent',
} as const;

export type ColorName = keyof typeof COLORS;

export const GRADIENT_COLORS = {
  primary: ['#007AFF', '#4DA3FF'],
  secondary: ['#5856D6', '#8B8AE6'],
  success: ['#34C759', '#6BD87A'],
  warning: ['#FF9500', '#FFB84D'],
  error: ['#FF3B30', '#FF6B62'],
  info: ['#5AC8FA', '#85D7FB'],
  sunset: ['#FF6B6B', '#FFE66D'],
  ocean: ['#667eea', '#764ba2'],
  forest: ['#11998e', '#38ef7d'],
  purple: ['#667eea', '#764ba2'],
  pink: ['#f093fb', '#f5576c'],
  blue: ['#4facfe', '#00f2fe'],
} as const;