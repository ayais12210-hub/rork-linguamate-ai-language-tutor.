export const TYPOGRAPHY = {
  // Font Families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    light: 'System',
    thin: 'System',
  },
  
  // Font Weights
  fontWeight: {
    thin: '100' as const,
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
    black: '900' as const,
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
    '8xl': 96,
    '9xl': 128,
  },
  
  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
} as const;

// Predefined Text Styles
export const TEXT_STYLES = {
  // Headings
  h1: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: TYPOGRAPHY.lineHeight.tight,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  h2: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: TYPOGRAPHY.lineHeight.tight,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  h3: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    lineHeight: TYPOGRAPHY.lineHeight.snug,
  },
  h4: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    lineHeight: TYPOGRAPHY.lineHeight.snug,
  },
  h5: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
  },
  h6: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
  },
  
  // Body Text
  body: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
  },
  bodyLarge: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
  },
  bodySmall: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
  },
  
  // Captions
  caption: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  captionBold: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  
  // Labels
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
  },
  labelLarge: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
  },
  
  // Buttons
  button: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    lineHeight: TYPOGRAPHY.lineHeight.none,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  buttonSmall: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    lineHeight: TYPOGRAPHY.lineHeight.none,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  buttonLarge: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    lineHeight: TYPOGRAPHY.lineHeight.none,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
} as const;

export type TextStyleName = keyof typeof TEXT_STYLES;