import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Download } from 'lucide-react-native';
import { brand } from '@/config/brand';
import { landingContent } from '@/content/landing';

const { width } = Dimensions.get('window');

export default function CTA() {
  const { cta } = landingContent;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(251, 191, 36, 0.15)', 'rgba(234, 88, 12, 0.1)']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{cta.title}</Text>
          <Text style={styles.subtitle}>{cta.subtitle}</Text>

          <View style={styles.ctaButtons}>
            <Link href="/(tabs)/chat" asChild>
              <TouchableOpacity style={styles.primaryButton}>
                <LinearGradient
                  colors={['#fbbf24', '#ea580c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.primaryButtonText}>{cta.ctaPrimary}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity style={styles.secondaryButton}>
              <Download size={20} color={brand.palette.fg} />
              <Text style={styles.secondaryButtonText}>{cta.ctaSecondary}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrText}>📱 Scan to open on mobile</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: brand.palette.bgSecondary,
    paddingVertical: 80,
  },
  gradient: {
    paddingVertical: 80,
  },
  content: {
    maxWidth: 800,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 24,
    alignItems: 'center',
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
    marginBottom: 40,
  },
  ctaButtons: {
    flexDirection: width < 768 ? 'column' : 'row',
    gap: 16,
    marginBottom: 48,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600' as any,
    color: '#000',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600' as any,
    color: brand.palette.fg,
  },
  qrPlaceholder: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qrText: {
    fontSize: 14,
    color: brand.palette.fgSecondary,
    textAlign: 'center',
  },
});
