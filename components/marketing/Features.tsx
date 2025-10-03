import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'lucide-react-native';
import { brand } from '@/config/brand';
import { landingContent } from '@/content/landing';

const { width } = Dimensions.get('window');

export default function Features() {
  const { features } = landingContent;

  return (
    <View style={styles.container} id="features">
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Everything you need to master a language</Text>
          <Text style={styles.subtitle}>
            Powered by AI, designed for humans
          </Text>
        </View>

        <View style={styles.grid}>
          {features.map((feature) => {
            const IconComponent = (Icons as any)[feature.icon] || Icons.Star;
            
            return (
              <View key={feature.id} style={styles.card}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.iconContainer}>
                    <IconComponent size={32} color={brand.palette.primary.from} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </LinearGradient>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: brand.palette.bg,
    paddingVertical: 80,
  },
  content: {
    maxWidth: 1280,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 24,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 64,
  },
  title: {
    fontSize: width < 768 ? 32 : 48,
    fontWeight: '800' as any,
    color: brand.palette.fg,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: width < 768 ? 16 : 20,
    color: brand.palette.fgSecondary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  card: {
    width: width < 768 ? '100%' : width < 1024 ? '48%' : '31%',
    minWidth: 280,
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    padding: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700' as any,
    color: brand.palette.fg,
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 14,
    color: brand.palette.fgSecondary,
    lineHeight: 22,
  },
});
