import React from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacyPolicy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to LinguaMate. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our language learning application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          
          <Text style={styles.subTitle}>Personal Information</Text>
          <Text style={styles.paragraph}>
            • Name and profile information you provide during account setup{'\n'}
            • Email address (if provided for account recovery){'\n'}
            • Language preferences and learning goals{'\n'}
            • Profile picture (if you choose to upload one)
          </Text>

          <Text style={styles.subTitle}>Learning Data</Text>
          <Text style={styles.paragraph}>
            • Your progress through lessons and modules{'\n'}
            • Quiz scores and performance metrics{'\n'}
            • Time spent on different learning activities{'\n'}
            • Vocabulary and phrases you{"'"}ve learned{'\n'}
            • Chat conversations with AI tutors{'\n'}
            • Voice recordings for pronunciation practice
          </Text>

          <Text style={styles.subTitle}>Usage Information</Text>
          <Text style={styles.paragraph}>
            • App usage patterns and frequency{'\n'}
            • Features and modules you interact with{'\n'}
            • Device information (type, operating system){'\n'}
            • App performance and crash reports
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use your information to:{'\n\n'}
            • Personalize your learning experience{'\n'}
            • Track and display your learning progress{'\n'}
            • Provide AI-powered tutoring and feedback{'\n'}
            • Generate customized lessons based on your level{'\n'}
            • Send learning reminders and notifications{'\n'}
            • Improve our app and develop new features{'\n'}
            • Provide customer support when needed
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI and Machine Learning</Text>
          <Text style={styles.paragraph}>
            Our app uses artificial intelligence to enhance your learning experience. This includes:{'\n\n'}
            • Analyzing your learning patterns to adapt difficulty{'\n'}
            • Processing voice recordings for pronunciation feedback{'\n'}
            • Generating personalized practice exercises{'\n'}
            • Powering conversational AI tutors{'\n\n'}
            Your conversations and voice recordings are processed securely and are not shared with third parties for their commercial purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Storage and Security</Text>
          <Text style={styles.paragraph}>
            • Your data is stored locally on your device and optionally backed up to secure cloud servers{'\n'}
            • We use encryption to protect sensitive information{'\n'}
            • Voice recordings are temporarily stored for processing and deleted after analysis{'\n'}
            • We implement industry-standard security measures to prevent unauthorized access{'\n'}
            • Regular security audits are conducted to ensure data protection
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sharing</Text>
          <Text style={styles.paragraph}>
            We do not sell, trade, or rent your personal information to third parties. We may share data only in the following circumstances:{'\n\n'}
            • With your explicit consent{'\n'}
            • To comply with legal obligations{'\n'}
            • To protect our rights and prevent fraud{'\n'}
            • With service providers who help us operate the app (under strict confidentiality agreements)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children{"'"}s Privacy</Text>
          <Text style={styles.paragraph}>
            Our app is suitable for users of all ages. For users under 13, we recommend parental supervision. We do not knowingly collect personal information from children under 13 without parental consent. If you believe we have collected such information, please contact us immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights and Choices</Text>
          <Text style={styles.paragraph}>
            You have the right to:{'\n\n'}
            • Access your personal data{'\n'}
            • Correct inaccurate information{'\n'}
            • Delete your account and associated data{'\n'}
            • Export your learning progress{'\n'}
            • Opt-out of notifications{'\n'}
            • Disable voice recording features{'\n'}
            • Control data synchronization settings
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your data for as long as you maintain an active account. If you delete your account, we will remove your personal information within 30 days, except where we are required to retain it for legal purposes. Anonymous usage statistics may be retained for app improvement purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Updates to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any significant changes through the app or via email if you{"'"}ve provided one. Your continued use of the app after changes indicates acceptance of the updated policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:{'\n\n'}
            Email: privacy@linguamate.app{'\n'}
            Support: support@linguamate.app{'\n'}
            In-app: Help Center
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consent</Text>
          <Text style={styles.paragraph}>
            By using LinguaMate, you consent to the collection and use of your information as described in this Privacy Policy.
          </Text>
        </View>

        <View style={[styles.bottomPadding, { paddingBottom: insets.bottom }]} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 40,
  },
});