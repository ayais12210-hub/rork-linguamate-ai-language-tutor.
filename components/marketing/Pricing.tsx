import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { brand } from '@/config/brand';
import { landingContent } from '@/content/landing';

const { width } = Dimensions.get('window');

export default function Pricing() {
  const { pricing } = landingContent;
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <View style={styles.container} id="pricing">
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{pricing.title}</Text>
          <Text style={styles.subtitle}>{pricing.subtitle}</Text>
        </View>

        <View style={styles.plansGrid}>
          {pricing.plans.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.highlighted && styles.planCardHighlighted
              ]}
            >
              {'badge' in plan && plan.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{plan.badge}</Text>
                </View>
              )}
              
              <LinearGradient
                colors={
                  plan.highlighted
                    ? ['rgba(251, 191, 36, 0.1)', 'rgba(234, 88, 12, 0.05)']
                    : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']
                }
                style={styles.planGradient}
              >
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{plan.price}</Text>
                  <Text style={styles.period}>{plan.period}</Text>
                </View>

                <View style={styles.features}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.feature}>
                      <Check size={20} color={brand.palette.primary.from} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.ctaButton,
                    plan.highlighted && styles.ctaButtonHighlighted
                  ]}
                >
                  <Text
                    style={[
                      styles.ctaButtonText,
                      plan.highlighted && styles.ctaButtonTextHighlighted
                    ]}
                  >
                    {plan.cta}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ))}
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently asked questions</Text>
          <View style={styles.faqList}>
            {pricing.faq.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.faqItem}
                onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                {expandedFaq === index && (
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: brand.palette.bgSecondary,
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
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
    marginBottom: 80,
  },
  planCard: {
    width: width < 768 ? '100%' : width < 1024 ? '48%' : '23%',
    minWidth: 260,
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  planCardHighlighted: {
    borderColor: brand.palette.primary.from,
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: brand.palette.primary.from,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as any,
    color: '#000',
  },
  planGradient: {
    padding: 32,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700' as any,
    color: brand.palette.fg,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 32,
  },
  price: {
    fontSize: 40,
    fontWeight: '800' as any,
    color: brand.palette.fg,
  },
  period: {
    fontSize: 16,
    color: brand.palette.fgSecondary,
  },
  features: {
    gap: 16,
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: brand.palette.fg,
    flex: 1,
  },
  ctaButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  ctaButtonHighlighted: {
    backgroundColor: brand.palette.primary.from,
    borderColor: brand.palette.primary.from,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: brand.palette.fg,
  },
  ctaButtonTextHighlighted: {
    color: '#000',
  },
  faqSection: {
    maxWidth: 800,
    marginHorizontal: 'auto' as any,
  },
  faqTitle: {
    fontSize: width < 768 ? 24 : 32,
    fontWeight: '700' as any,
    color: brand.palette.fg,
    textAlign: 'center',
    marginBottom: 40,
  },
  faqList: {
    gap: 16,
  },
  faqItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: brand.palette.fg,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: brand.palette.fgSecondary,
    lineHeight: 22,
    marginTop: 8,
  },
});
