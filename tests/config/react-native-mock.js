// Mock React Native for Jest tests
module.exports = {
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  ActivityIndicator: 'ActivityIndicator',
  Platform: { OS: 'web', select: (obj) => obj.default || obj.web },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => {
      if (!style) return {};
      if (Array.isArray(style)) {
        return style.reduce((acc, s) => ({ ...acc, ...s }), {});
      }
      return style;
    },
  },
  Dimensions: {
    get: () => ({ width: 375, height: 667 }),
    addEventListener: () => {},
    removeEventListener: () => {},
  },
  AccessibilityInfo: {
    isScreenReaderEnabled: () => Promise.resolve(false),
    addEventListener: () => {},
    removeEventListener: () => {},
  },
};
