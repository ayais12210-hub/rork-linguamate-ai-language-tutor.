import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Terms & Conditions</Text>
          <Text style={styles.lastUpdated}>Last updated: January 2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.sectionText}>
              By accessing and using LinguaMate AI Language Tutor, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Use License</Text>
            <Text style={styles.sectionText}>
              Permission is granted to temporarily download one copy of LinguaMate for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </Text>
            <Text style={styles.bulletPoint}>• Modify or copy the materials</Text>
            <Text style={styles.bulletPoint}>• Use the materials for any commercial purpose or for any public display</Text>
            <Text style={styles.bulletPoint}>• Attempt to reverse engineer any software contained in LinguaMate</Text>
            <Text style={styles.bulletPoint}>• Remove any copyright or other proprietary notations from the materials</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Account</Text>
            <Text style={styles.sectionText}>
              To access certain features of the app, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Premium Subscription</Text>
            <Text style={styles.sectionText}>
              Some features of LinguaMate require a premium subscription. By purchasing a subscription, you agree to pay the applicable fees and to the automatic renewal of your subscription unless cancelled.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Content and Conduct</Text>
            <Text style={styles.sectionText}>
              You agree not to use LinguaMate to:
            </Text>
            <Text style={styles.bulletPoint}>• Upload or transmit any content that is unlawful, harmful, threatening, abusive, or otherwise objectionable</Text>
            <Text style={styles.bulletPoint}>• Impersonate any person or entity</Text>
            <Text style={styles.bulletPoint}>• Violate any local, state, national, or international law</Text>
            <Text style={styles.bulletPoint}>• Interfere with or disrupt the service</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. AI-Generated Content</Text>
            <Text style={styles.sectionText}>
              LinguaMate uses artificial intelligence to generate language learning content and conversations. While we strive for accuracy, AI-generated content may contain errors or inaccuracies. Users should verify important information and not rely solely on AI-generated content for critical decisions.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Privacy</Text>
            <Text style={styles.sectionText}>
              Your use of LinguaMate is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the Site and informs users of our data collection practices.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Disclaimer</Text>
            <Text style={styles.sectionText}>
              The materials on LinguaMate are provided on an 'as is' basis. LinguaMate makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Limitations</Text>
            <Text style={styles.sectionText}>
              In no event shall LinguaMate or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use LinguaMate, even if LinguaMate or a LinguaMate authorized representative has been notified orally or in writing of the possibility of such damage.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Termination</Text>
            <Text style={styles.sectionText}>
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Governing Law</Text>
            <Text style={styles.sectionText}>
              These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
            <Text style={styles.sectionText}>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>13. Contact Information</Text>
            <Text style={styles.sectionText}>
              If you have any questions about these Terms, please contact us at:
            </Text>
            <Text style={styles.contactInfo}>Email: support@linguamate.ai</Text>
            <Text style={styles.contactInfo}>Website: www.linguamate.ai</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#1F2937',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginLeft: 16,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 15,
    color: '#10B981',
    marginTop: 4,
  },
});