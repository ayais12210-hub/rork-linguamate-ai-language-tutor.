import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { brand } from '@/config/brand';
import { landingContent } from '@/content/landing';

const { width } = Dimensions.get('window');

export default function Curriculum() {
  const { curriculum } = landingContent;

  return (
    <View style={styles.container} id="curriculum">
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Your learning journey</Text>
          <Text style={styles.subtitle}>
            From alphabet to fluency, we&apos;ve got you covered
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeline}
          snapToInterval={width < 768 ? 280 : 320}
          decelerationRate="fast"
        >
          {curriculum.map((stage, index) => (
            <View key={stage.id} style={styles.stageContainer}>
              <View style={styles.connector}>
                {index < curriculum.length - 1 && <View style={styles.connectorLine} />}
              </View>
              
              <View style={styles.stageCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.stageNumber}>
                    <Text style={styles.stageNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stageIcon}>{stage.icon}</Text>
                  <Text style={styles.stageTitle}>{stage.title}</Text>
                  <Text style={styles.stageDescription}>{stage.description}</Text>
                </LinearGradient>
              </View>
            </View>
          ))}
        </ScrollView>
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
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 64,
    paddingHorizontal: 24,
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
  timeline: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 24,
  },
  stageContainer: {
    width: width < 768 ? 260 : 300,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 40,
    left: '100%',
    width: 24,
    height: 2,
    zIndex: -1,
  },
  connectorLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stageCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  stageNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: brand.palette.primary.from,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumberText: {
    fontSize: 14,
    fontWeight: '700' as any,
    color: '#000',
  },
  stageIcon: {
    fontSize: 48,
  },
  stageTitle: {
    fontSize: 20,
    fontWeight: '700' as any,
    color: brand.palette.fg,
    textAlign: 'center',
  },
  stageDescription: {
    fontSize: 14,
    color: brand.palette.fgSecondary,
    textAlign: 'center',
  },
});
