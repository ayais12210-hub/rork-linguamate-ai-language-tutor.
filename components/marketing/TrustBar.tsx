import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { brand } from '@/config/brand';
import { landingContent } from '@/content/landing';

const { width } = Dimensions.get('window');

export default function TrustBar() {
  const { trustBar } = landingContent;
  const items = [...trustBar.items, ...trustBar.items];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={false}
      >
        {items.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: brand.palette.bgSecondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 48,
    paddingHorizontal: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 24,
  },
  text: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: brand.palette.fg,
  },
});
