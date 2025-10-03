import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Sparkles, Zap, Globe } from 'lucide-react-native';
import { brand } from '@/config/brand';
import { landingContent } from '@/content/landing';

const { width } = Dimensions.get('window');

export default function Hero() {
  const { hero } = landingContent;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim1, {
            toValue: -20,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim1, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim2, {
            toValue: -15,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim2, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim3, {
            toValue: -25,
            duration: 3500,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim3, {
            toValue: 0,
            duration: 3500,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(251, 191, 36, 0.1)', 'rgba(234, 88, 12, 0.05)', 'transparent']}
        style={styles.gradient}
      />
      
      <View style={styles.content}>
        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Sparkles size={14} color={brand.palette.primary.from} />
              <Text style={styles.badgeText}>AI-Powered Learning</Text>
            </View>
          </View>
          <Text style={styles.headline}>{hero.headline}</Text>
          <Text style={styles.subheadline}>{hero.subheadline}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>20+</Text>
              <Text style={styles.statLabel}>Languages</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>50K+</Text>
              <Text style={styles.statLabel}>Learners</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>4.9★</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
          
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
        </Animated.View>

        <View style={styles.visualContainer}>
          <Animated.View style={[styles.mockupCard, { transform: [{ translateY: floatAnim1 }] }]}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.mockupGradient}
            >
              <View style={styles.iconBadge}>
                <Zap size={24} color={brand.palette.primary.from} />
              </View>
              <Text style={styles.mockupTitle}>AI-Powered</Text>
              <Text style={styles.mockupText}>Adaptive lessons that evolve with you</Text>
            </LinearGradient>
          </Animated.View>
          
          <Animated.View style={[styles.mockupCard, styles.mockupCard2, { transform: [{ translateY: floatAnim2 }] }]}>
            <LinearGradient
              colors={['rgba(34, 211, 238, 0.2)', 'rgba(14, 165, 233, 0.1)']}
              style={styles.mockupGradient}
            >
              <View style={styles.iconBadge}>
                <Globe size={24} color="#22d3ee" />
              </View>
              <Text style={styles.mockupTitle}>Real Conversations</Text>
              <Text style={styles.mockupText}>Practice with native-like AI</Text>
            </LinearGradient>
          </Animated.View>
          
          <Animated.View style={[styles.mockupCard, styles.mockupCard3, { transform: [{ translateY: floatAnim3 }] }]}>
            <LinearGradient
              colors={['rgba(167, 139, 250, 0.2)', 'rgba(139, 92, 246, 0.1)']}
              style={styles.mockupGradient}
            >
              <View style={styles.iconBadge}>
                <Sparkles size={24} color="#a78bfa" />
              </View>
              <Text style={styles.mockupTitle}>Track Progress</Text>
              <Text style={styles.mockupText}>See your improvement daily</Text>
            </LinearGradient>
          </Animated.View>
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
  badgeContainer: {
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: brand.palette.primary.from,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 32,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800' as any,
    color: brand.palette.fg,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: brand.palette.fgSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mockupTitle: {
    fontSize: 18,
    fontWeight: '700' as any,
    color: brand.palette.fg,
    marginBottom: 8,
  },
  mockupText: {
    fontSize: 14,
    color: brand.palette.fgSecondary,
    textAlign: 'center',
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
