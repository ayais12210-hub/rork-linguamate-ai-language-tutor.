import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { brand } from '@/config/brand';
import { landingContent } from '@/content/landing';

const { width } = Dimensions.get('window');

export default function SocialProof() {
  const { testimonials } = landingContent;

  return (
    <View style={styles.container} id="testimonials">
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Loved by learners worldwide</Text>
          <Text style={styles.subtitle}>
            Join thousands of people mastering new languages
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.testimonialsList}
          snapToInterval={width < 768 ? 320 : 380}
          decelerationRate="fast"
        >
          {testimonials.map((testimonial) => (
            <View key={testimonial.id} style={styles.testimonialCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                style={styles.cardGradient}
              >
                <View style={styles.rating}>
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      color={brand.palette.primary.from}
                      fill={brand.palette.primary.from}
                    />
                  ))}
                </View>

                <Text style={styles.testimonialText}>{testimonial.text}</Text>

                <View style={styles.author}>
                  <Image
                    source={{ uri: testimonial.avatar }}
                    style={styles.avatar}
                  />
                  <View style={styles.authorInfo}>
                    <View style={styles.authorName}>
                      <Text style={styles.name}>{testimonial.name}</Text>
                      <Text style={styles.flag}>{testimonial.flag}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
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
  testimonialsList: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 24,
  },
  testimonialCard: {
    width: width < 768 ? 300 : 360,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    padding: 32,
  },
  rating: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
  },
  testimonialText: {
    fontSize: 16,
    color: brand.palette.fg,
    lineHeight: 26,
    marginBottom: 24,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: brand.palette.fg,
  },
  flag: {
    fontSize: 20,
  },
});
