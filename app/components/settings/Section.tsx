import React, { ReactNode, memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface SectionProps {
  title: string;
  children: ReactNode;
  footerText?: string;
  style?: ViewStyle;
  testID?: string;
}

function SectionBase({ title, children, footerText, style, testID }: SectionProps) {
  console.log('[Settings/Section] render', title);
  return (
    <View style={[styles.section, style]} testID={testID ?? 'settings-section'}>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.content}>{children}</View>
      {footerText ? (
        <Text style={styles.footer} numberOfLines={3}>
          {footerText}
        </Text>
      ) : null}
    </View>
  );
}

export default memo(SectionBase);

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  content: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
  },
  footer: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
});