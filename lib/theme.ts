import { Platform } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from './constants';
import { useUser } from '@/hooks/user-store';

// Theme configuration for the language learning app

// Theme types
export interface Theme {
  colors: typeof COLORS;
  fonts: FontConfig;
  spacing: typeof SPACING;
  borderRadius: typeof BORDER_RADIUS;
  shadows: typeof SHADOWS;
  layout: LayoutConfig;
  components: ComponentStyles;
}

export interface FontConfig {
  sizes: typeof FONT_SIZES;
  weights: {
    light: '300';
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
  };
  families: {
    regular: string;
    medium: string;
    bold: string;
    mono: string;
  };
}

export interface LayoutConfig {
  headerHeight: number;
  tabBarHeight: number;
  statusBarHeight: number;
  screenPadding: number;
  cardPadding: number;
  buttonHeight: number;
  inputHeight: number;
}

export interface ComponentStyles {
  button: ButtonStyles;
  input: InputStyles;
  card: CardStyles;
  modal: ModalStyles;
  toast: ToastStyles;
}

export interface ButtonStyles {
  primary: object;
  secondary: object;
  outline: object;
  ghost: object;
  danger: object;
}

export interface InputStyles {
  default: object;
  focused: object;
  error: object;
  disabled: object;
}

export interface CardStyles {
  default: object;
  elevated: object;
  outlined: object;
}

export interface ModalStyles {
  overlay: object;
  container: object;
  content: object;
}

export interface ToastStyles {
  success: object;
  error: object;
  warning: object;
  info: object;
}

// Font configuration
const fontConfig: FontConfig = {
  sizes: FONT_SIZES,
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  families: Platform.select({
    ios: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      mono: 'Menlo',
    },
    android: {
      regular: 'Roboto',
      medium: 'Roboto-Medium',
      bold: 'Roboto-Bold',
      mono: 'monospace',
    },
    web: {
      regular: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      medium: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bold: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    },
    default: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      mono: 'monospace',
    },
  }),
};

// Layout configuration
const layoutConfig: LayoutConfig = {
  headerHeight: Platform.select({ ios: 44, android: 56, web: 64, default: 56 }),
  tabBarHeight: Platform.select({ ios: 83, android: 56, web: 60, default: 56 }),
  statusBarHeight: Platform.select({ ios: 44, android: 24, web: 0, default: 24 }),
  screenPadding: SPACING.md,
  cardPadding: SPACING.md,
  buttonHeight: 48,
  inputHeight: 48,
};

// Component styles
const componentStyles: ComponentStyles = {
  button: {
    primary: {
      backgroundColor: COLORS.primary,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      minHeight: layoutConfig.buttonHeight,
      justifyContent: 'center',
      alignItems: 'center',
      ...SHADOWS.sm,
    },
    secondary: {
      backgroundColor: COLORS.gray[100],
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      minHeight: layoutConfig.buttonHeight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: COLORS.primary,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      minHeight: layoutConfig.buttonHeight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      minHeight: layoutConfig.buttonHeight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    danger: {
      backgroundColor: COLORS.error,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      minHeight: layoutConfig.buttonHeight,
      justifyContent: 'center',
      alignItems: 'center',
      ...SHADOWS.sm,
    },
  },
  input: {
    default: {
      borderWidth: 1,
      borderColor: COLORS.border.light,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      minHeight: layoutConfig.inputHeight,
      fontSize: FONT_SIZES.base,
      backgroundColor: COLORS.background.primary,
    },
    focused: {
      borderColor: COLORS.primary,
      ...SHADOWS.sm,
    },
    error: {
      borderColor: COLORS.error,
    },
    disabled: {
      backgroundColor: COLORS.gray[50],
      borderColor: COLORS.border.light,
      opacity: 0.6,
    },
  },
  card: {
    default: {
      backgroundColor: COLORS.background.primary,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginVertical: SPACING.xs,
    },
    elevated: {
      backgroundColor: COLORS.background.primary,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginVertical: SPACING.xs,
      ...SHADOWS.md,
    },
    outlined: {
      backgroundColor: COLORS.background.primary,
      borderWidth: 1,
      borderColor: COLORS.border.light,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginVertical: SPACING.xs,
    },
  },
  modal: {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.md,
    },
    container: {
      backgroundColor: COLORS.background.primary,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.lg,
      maxWidth: '90%',
      maxHeight: '80%',
      ...SHADOWS.xl,
    },
    content: {
      flex: 1,
    },
  },
  toast: {
    success: {
      backgroundColor: COLORS.success,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      margin: SPACING.md,
      ...SHADOWS.md,
    },
    error: {
      backgroundColor: COLORS.error,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      margin: SPACING.md,
      ...SHADOWS.md,
    },
    warning: {
      backgroundColor: COLORS.warning,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      margin: SPACING.md,
      ...SHADOWS.md,
    },
    info: {
      backgroundColor: COLORS.info,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      margin: SPACING.md,
      ...SHADOWS.md,
    },
  },
};

// Main theme object
export const theme: Theme = {
  colors: COLORS,
  fonts: fontConfig,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  layout: layoutConfig,
  components: componentStyles,
};

// Dark theme variant
export const darkTheme: Theme = {
  ...theme,
  colors: {
    ...COLORS,
    primary: '#8B5CF6',
    background: {
      primary: '#111827',
      secondary: '#1F2937',
      tertiary: '#374151',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF',
      inverse: '#111827',
    },
    border: {
      light: '#374151',
      medium: '#4B5563',
      dark: '#6B7280',
    },
  } as any,
};

// Theme utilities
export const themeUtils = {
  // Get color with opacity
  getColorWithOpacity: (color: string, opacity: number): string => {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // Handle rgba colors
    if (color.startsWith('rgba')) {
      return color.replace(/[\d\.]+\)$/g, `${opacity})`);
    }
    
    // Handle rgb colors
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }
    
    return color;
  },

  // Get responsive font size
  getResponsiveFontSize: (size: keyof typeof FONT_SIZES): number => {
    const baseSize = FONT_SIZES[size];
    return Platform.select({
      web: baseSize * 1.1,
      default: baseSize,
    });
  },

  // Get platform-specific spacing
  getPlatformSpacing: (size: keyof typeof SPACING): number => {
    const baseSpacing = SPACING[size];
    return Platform.select({
      web: baseSpacing * 1.2,
      default: baseSpacing,
    });
  },

  // Create gradient background
  createGradient: (colors: string[], direction = 'vertical') => {
    if (Platform.OS === 'web') {
      const gradientDirection = direction === 'vertical' ? 'to bottom' : 'to right';
      return {
        background: `linear-gradient(${gradientDirection}, ${colors.join(', ')})`,
      };
    }
    
    // For React Native, you would need react-native-linear-gradient
    return {
      backgroundColor: colors[0], // Fallback to first color
    };
  },

  // Get elevation style for Android
  getElevation: (level: number) => {
    if (Platform.OS === 'android') {
      return { elevation: level };
    }
    return {};
  },

  // Combine styles safely
  combineStyles: (...styles: any[]) => {
    return styles.filter(Boolean).reduce((acc, style) => ({ ...acc, ...style }), {});
  },
};

// Typography presets
export const typography = {
  h1: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: fontConfig.weights.bold,
    lineHeight: FONT_SIZES['4xl'] * 1.2,
    color: COLORS.text.primary,
  },
  h2: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: fontConfig.weights.bold,
    lineHeight: FONT_SIZES['3xl'] * 1.2,
    color: COLORS.text.primary,
  },
  h3: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: fontConfig.weights.semibold,
    lineHeight: FONT_SIZES['2xl'] * 1.3,
    color: COLORS.text.primary,
  },
  h4: {
    fontSize: FONT_SIZES.xl,
    fontWeight: fontConfig.weights.semibold,
    lineHeight: FONT_SIZES.xl * 1.3,
    color: COLORS.text.primary,
  },
  body1: {
    fontSize: FONT_SIZES.base,
    fontWeight: fontConfig.weights.normal,
    lineHeight: FONT_SIZES.base * 1.5,
    color: COLORS.text.primary,
  },
  body2: {
    fontSize: FONT_SIZES.sm,
    fontWeight: fontConfig.weights.normal,
    lineHeight: FONT_SIZES.sm * 1.5,
    color: COLORS.text.secondary,
  },
  caption: {
    fontSize: FONT_SIZES.xs,
    fontWeight: fontConfig.weights.normal,
    lineHeight: FONT_SIZES.xs * 1.4,
    color: COLORS.text.tertiary,
  },
  button: {
    fontSize: FONT_SIZES.base,
    fontWeight: fontConfig.weights.medium,
    lineHeight: FONT_SIZES.base * 1.2,
    textAlign: 'center' as const,
  },
} as const;

// Theme hook for accessing current theme
export function useTheme(): Theme {
  const { user } = useUser();
  const isDarkMode = user?.settings?.darkMode ?? false;
  return isDarkMode ? darkTheme : theme;
}

// Export default theme
export default theme;