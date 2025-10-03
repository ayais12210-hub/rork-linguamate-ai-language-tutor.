import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';
import { brand } from '@/config/brand';
import { landingContent } from '@/content/landing';

const { width } = Dimensions.get('window');

export default function Hero() {
  const { hero } = landingContent;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(251, 191, 36, 0.1)', 'rgba(234, 88, 12, 0.05)', 'transparent']}
        style={styles.gradient}
      />
      
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.headline}>{hero.headline}</Text>
          <Text style={styles.subheadline}>{hero.subheadline}</Text>
          
          <View style={styles.ctaContainer}>
            <Link href="/(tabs)/chat" asChild>
              <TouchableOpacity style={styles.primaryButton}>
                <LinearGradient
                  colors={['#fbbf24', '#ea580c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.primaryButtonText}>{hero.ctaPrimary}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Link>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Play size={20} color={brand.palette.fg} />
              <Text style={styles.secondaryButtonText}>{hero.ctaSecondary}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.visualContainer}>
          <View style={styles.mockupCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.mockupGradient}
            >
              <Text style={styles.mockupEmoji}>🎯</Text>
              <Text style={styles.mockupText}>AI-Powered Learning</Text>
            </LinearGradient>
          </View>
          
          <View style={[styles.mockupCard, styles.mockupCard2]}>
            <LinearGradient
              colors={['rgba(34, 211, 238, 0.2)', 'rgba(14, 165, 233, 0.1)']}
              style={styles.mockupGradient}
            >
              <Text style={styles.mockupEmoji}>🗣️</Text>
              <Text style={styles.mockupText}>Real Conversations</Text>
            </LinearGradient>
          </View>
          
          <View style={[styles.mockupCard, styles.mockupCard3]}>
            <LinearGradient
              colors={['rgba(167, 139, 250, 0.2)', 'rgba(139, 92, 246, 0.1)']}
              style={styles.mockupGradient}
            >
              <Text style={styles.mockupEmoji}>📈</Text>
              <Text style={styles.mockupText}>Track Progress</Text>
            </LinearGradient>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: width < 768 ? 600 : 800,
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    flexDirection: width < 768 ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 80,
    maxWidth: 1280,
    marginHorizontal: 'auto' as any,
    width: '100%',
    gap: 48,
  },
  textContainer: {
    flex: 1,
    maxWidth: 600,
  },
  headline: {
    fontSize: width < 768 ? 36 : 56,
    fontWeight: '800' as any,
    color: brand.palette.fg,
    lineHeight: width < 768 ? 44 : 68,
    marginBottom: 24,
  },
  subheadline: {
    fontSize: width < 768 ? 16 : 20,
    color: brand.palette.fgSecondary,
    lineHeight: width < 768 ? 24 : 32,
    marginBottom: 40,
  },
  ctaContainer: {
    flexDirection: width < 768 ? 'column' : 'row',
    gap: 16,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: '#000',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: brand.palette.fg,
  },
  visualContainer: {
    flex: 1,
    position: 'relative',
    minHeight: 400,
    width: '100%',
  },
  mockupCard: {
    position: 'absolute',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mockupGradient: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  mockupEmoji: {
    fontSize: 48,
  },
  mockupText: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: brand.palette.fg,
  },
  mockupCard2: {
    top: 100,
    right: 20,
  },
  mockupCard3: {
    top: 200,
    left: 40,
  },
});
