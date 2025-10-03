import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, BookOpen, Award, Globe } from 'lucide-react-native';
import { brand } from '@/config/brand';

const { width } = Dimensions.get('window');

const stats = [
  {
    id: 'users',
    icon: Users,
    value: '50K+',
    label: 'Active Learners',
    color: brand.palette.primary.from,
  },
  {
    id: 'lessons',
    icon: BookOpen,
    value: '10M+',
    label: 'Lessons Completed',
    color: brand.palette.accent.from,
  },
  {
    id: 'languages',
    icon: Globe,
    value: '20+',
    label: 'Languages',
    color: '#a78bfa',
  },
  {
    id: 'rating',
    icon: Award,
    value: '4.9★',
    label: 'Average Rating',
    color: '#fbbf24',
  },
];

export default function StatsSection() {
  const fadeAnims = useRef(stats.map(() => new Animated.Value(0))).current;
  const scaleAnims = useRef(stats.map(() => new Animated.Value(0.8))).current;

  useEffect(() => {
    const animations = stats.map((_, index) =>
      Animated.parallel([
        Animated.timing(fadeAnims[index], {
          toValue: 1,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnims[index], {
          toValue: 1,
          delay: index * 100,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ])
    );

    Animated.stagger(100, animations).start();
  }, [fadeAnims, scaleAnims]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(251, 191, 36, 0.05)', 'transparent', 'rgba(34, 211, 238, 0.05)']}
        style={styles.gradient}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Trusted by learners worldwide</Text>
          <Text style={styles.subtitle}>
            Join thousands of people achieving their language learning goals
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Animated.View
                key={stat.id}
                style={[
                  styles.statCard,
                  {
                    opacity: fadeAnims[index],
                    transform: [{ scale: scaleAnims[index] }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                  style={styles.cardGradient}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
                    <IconComponent size={32} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </LinearGradient>
              </Animated.View>
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
    maxWidth: 600,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  statCard: {
    width: width < 768 ? '100%' : width < 1024 ? '48%' : '23%',
    minWidth: 240,
    maxWidth: 300,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 40,
    fontWeight: '800' as any,
    color: brand.palette.fg,
  },
  statLabel: {
    fontSize: 16,
    color: brand.palette.fgSecondary,
    textAlign: 'center',
  },
});
