import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Globe2, TrendingUp, Users } from 'lucide-react-native';
import { brand } from '@/config/brand';
import { landingContent } from '@/content/landing';

const { width } = Dimensions.get('window');

type Language = typeof landingContent.languages[number];

export default function LanguageShowcase() {
  const { languages } = landingContent;
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [scaleAnim, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Learn any language, anywhere</Text>
          <Text style={styles.subtitle}>
            From Spanish to Japanese, we&apos;ve got you covered with 20+ languages
          </Text>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.languageGrid}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.languageScroll}
            >
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageCard,
                    selectedLanguage.code === lang.code && styles.languageCardActive,
                  ]}
                  onPress={() => setSelectedLanguage(lang as Language)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  <Text style={styles.languageNative}>{lang.nativeName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.showcase}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
              style={styles.showcaseGradient}
            >
              <Animated.View
                style={[
                  styles.globeContainer,
                  {
                    transform: [{ scale: scaleAnim }, { rotate }],
                  },
                ]}
              >
                <Globe2 size={80} color={brand.palette.primary.from} />
              </Animated.View>

              <Text style={styles.showcaseTitle}>
                Now learning: {selectedLanguage.name}
              </Text>
              <Text style={styles.showcaseNative}>{selectedLanguage.nativeName}</Text>

              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <View style={styles.statIcon}>
                    <Users size={20} color={brand.palette.accent.from} />
                  </View>
                  <Text style={styles.statValue}>12K+</Text>
                  <Text style={styles.statLabel}>Active learners</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <View style={styles.statIcon}>
                    <TrendingUp size={20} color={brand.palette.primary.from} />
                  </View>
                  <Text style={styles.statValue}>95%</Text>
                  <Text style={styles.statLabel}>Success rate</Text>
                </View>
              </View>

              <View style={styles.features}>
                <View style={styles.featureItem}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>Native pronunciation</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>Cultural context</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureDot} />
                  <Text style={styles.featureText}>Real-world scenarios</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
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
    maxWidth: 600,
  },
  mainContent: {
    gap: 48,
  },
  languageGrid: {
    marginBottom: 32,
  },
  languageScroll: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
  },
  languageCard: {
    width: 140,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    gap: 8,
  },
  languageCardActive: {
    borderColor: brand.palette.primary.from,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  languageFlag: {
    fontSize: 40,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: brand.palette.fg,
  },
  languageNative: {
    fontSize: 12,
    color: brand.palette.fgSecondary,
  },
  showcase: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  showcaseGradient: {
    padding: width < 768 ? 32 : 48,
    alignItems: 'center',
  },
  globeContainer: {
    marginBottom: 32,
  },
  showcaseTitle: {
    fontSize: 24,
    fontWeight: '700' as any,
    color: brand.palette.fg,
    marginBottom: 8,
  },
  showcaseNative: {
    fontSize: 32,
    fontWeight: '800' as any,
    color: brand.palette.primary.from,
    marginBottom: 40,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as any,
    color: brand.palette.fg,
  },
  statLabel: {
    fontSize: 12,
    color: brand.palette.fgSecondary,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  features: {
    gap: 16,
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.palette.primary.from,
  },
  featureText: {
    fontSize: 16,
    color: brand.palette.fg,
  },
});
