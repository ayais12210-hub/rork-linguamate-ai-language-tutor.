import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Search,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  BookOpen,
  Crown,
  Settings,
  Smartphone,
  Globe,
  Target,
  Clock,
  Volume2,
  Bell,
  Shield,
  Star,
  Mail,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Users,
  Zap,
  Download,
} from 'lucide-react-native';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: React.ComponentType<any>;
  tags: string[];
}

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}

const categories: Category[] = [
  { id: 'all', name: 'All Topics', icon: HelpCircle, color: '#6B7280' },
  { id: 'getting-started', name: 'Getting Started', icon: BookOpen, color: '#10B981' },
  { id: 'learning', name: 'Learning Features', icon: Lightbulb, color: '#F59E0B' },
  { id: 'premium', name: 'Premium Features', icon: Crown, color: '#8B5CF6' },
  { id: 'settings', name: 'Settings & Account', icon: Settings, color: '#3B82F6' },
  { id: 'technical', name: 'Technical Support', icon: Smartphone, color: '#EF4444' },
];

const faqData: FAQItem[] = [
  // Getting Started
  {
    id: '1',
    question: 'How do I get started with LinguaMate?',
    answer: 'Welcome to LinguaMate! Here\'s how to get started:\n\n1. Complete the onboarding process to set your learning language and goals\n2. Choose your proficiency level (beginner, intermediate, or advanced)\n3. Set your daily learning goal (5-60 minutes)\n4. Start with the Chat tab to practice conversations\n5. Explore Lessons for structured learning modules\n6. Use the Translator for quick translations\n\nTip: Start with 10-15 minutes daily to build a consistent habit!',
    category: 'getting-started',
    icon: BookOpen,
    tags: ['onboarding', 'setup', 'beginner', 'start'],
  },
  {
    id: '2',
    question: 'Which languages does LinguaMate support?',
    answer: 'LinguaMate supports over 50 languages including:\n\n• Popular languages: Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese (Mandarin), Arabic, Russian\n• European languages: Dutch, Swedish, Norwegian, Polish, Czech, Hungarian, Greek\n• Asian languages: Hindi, Thai, Vietnamese, Indonesian, Tagalog\n• And many more!\n\nYou can change your learning language anytime in Settings > Learning Language.',
    category: 'getting-started',
    icon: Globe,
    tags: ['languages', 'supported', 'change language'],
  },
  {
    id: '3',
    question: 'How do I set my learning goals?',
    answer: 'Setting effective learning goals helps you stay motivated:\n\n1. Go to Settings > Daily Goal\n2. Choose from 5, 10, 15, 30, or 60 minutes\n3. Start small - consistency beats intensity\n4. Track your progress in the Profile tab\n\nYou can also set specific goals like:\n• Learning 10 new words per week\n• Completing 3 lessons per week\n• Maintaining a 7-day streak\n\nAdjust your goals as you progress!',
    category: 'getting-started',
    icon: Target,
    tags: ['goals', 'daily goal', 'motivation', 'progress'],
  },

  // Learning Features
  {
    id: '4',
    question: 'How does the AI chat feature work?',
    answer: 'Our AI chat is designed to simulate real conversations:\n\n• Type messages in your target language\n• Get instant corrections and suggestions\n• Receive translations in your native language\n• Practice different conversation scenarios\n• Build confidence through natural dialogue\n\nFree users get 5 messages per day, Premium users get unlimited messages. The AI adapts to your proficiency level and provides personalized feedback.',
    category: 'learning',
    icon: MessageCircle,
    tags: ['chat', 'ai', 'conversation', 'corrections', 'practice'],
  },
  {
    id: '5',
    question: 'What learning modules are available?',
    answer: 'LinguaMate offers comprehensive learning modules:\n\n**Basic Modules:**\n• Alphabet - Learn letter sounds and writing\n• Numbers - Count and use numbers in context\n• Vowels & Consonants - Master pronunciation\n• Syllables - Build word construction skills\n\n**Advanced Modules:**\n• Grammar - Sentence structure and rules\n• Dialogue - Conversational practice\n• Pronunciation - Perfect your accent\n• Culture - Learn cultural context\n\nEach module includes interactive exercises, audio pronunciation, and progress tracking.',
    category: 'learning',
    icon: BookOpen,
    tags: ['modules', 'lessons', 'grammar', 'pronunciation', 'culture'],
  },
  {
    id: '6',
    question: 'How does the translator work?',
    answer: 'The built-in translator helps you learn in context:\n\n• Translate text between your native and target language\n• Get pronunciation guides for translated text\n• Save translations for later review\n• See example sentences and usage\n• Learn grammar patterns through translations\n\nTip: Try translating phrases you want to use in conversations, then practice them in the Chat feature!',
    category: 'learning',
    icon: Globe,
    tags: ['translator', 'translation', 'pronunciation', 'examples'],
  },
  {
    id: '7',
    question: 'How do I track my learning progress?',
    answer: 'LinguaMate provides detailed progress tracking:\n\n**Profile Tab Shows:**\n• Current streak (consecutive days)\n• Total XP points earned\n• Words learned count\n• Badges and achievements\n• Weekly/monthly statistics\n\n**Progress Indicators:**\n• Module completion percentages\n• Daily goal achievement\n• Skill level improvements\n• Time spent learning\n\nYour progress syncs across devices when logged in.',
    category: 'learning',
    icon: Target,
    tags: ['progress', 'tracking', 'streak', 'xp', 'badges', 'statistics'],
  },

  // Premium Features
  {
    id: '8',
    question: 'What does Premium include?',
    answer: 'Premium unlocks powerful features:\n\n**Unlimited Access:**\n• Unlimited AI chat messages\n• All learning modules unlocked\n• Advanced pronunciation tools\n• Cultural context lessons\n\n**Premium Features:**\n• Offline lesson downloads\n• Family sharing (up to 5 members)\n• Custom app icons\n• Priority customer support\n• Advanced progress analytics\n• Personalized learning paths\n\nUpgrade anytime in Settings > Premium Features.',
    category: 'premium',
    icon: Crown,
    tags: ['premium', 'unlimited', 'offline', 'family sharing', 'upgrade'],
  },
  {
    id: '9',
    question: 'How does family sharing work?',
    answer: 'Premium family sharing lets you share benefits:\n\n• Share with up to 5 family members\n• Each member gets their own progress tracking\n• Individual language preferences\n• Separate daily goals and achievements\n• Shared premium features access\n\n**To set up family sharing:**\n1. Upgrade to Premium\n2. Go to Settings > Family Sharing\n3. Send invites to family members\n4. They accept and create their profiles\n\nNote: Family sharing is available in the next update!',
    category: 'premium',
    icon: Users,
    tags: ['family sharing', 'premium', 'multiple users', 'sharing'],
  },
  {
    id: '10',
    question: 'Can I download lessons for offline use?',
    answer: 'Yes! Premium users can download lessons:\n\n• Download entire modules for offline access\n• Practice without internet connection\n• Audio files included for pronunciation\n• Progress syncs when back online\n• Choose which lessons to download\n\n**To download lessons:**\n1. Upgrade to Premium\n2. Go to Settings > Offline Lessons\n3. Select modules to download\n4. Wait for download to complete\n\nOffline lessons are perfect for travel or areas with poor connectivity!',
    category: 'premium',
    icon: Download,
    tags: ['offline', 'download', 'premium', 'no internet', 'travel'],
  },

  // Settings & Account
  {
    id: '11',
    question: 'How do I change my learning language?',
    answer: 'You can change your learning language anytime:\n\n1. Go to Settings > Learning Language\n2. Select your new target language\n3. Choose your proficiency level\n4. Confirm the change\n\n**Important Notes:**\n• Your progress in the previous language is saved\n• You can switch back anytime\n• Each language has separate progress tracking\n• Premium features apply to all languages\n\nTip: You can learn multiple languages simultaneously!',
    category: 'settings',
    icon: Globe,
    tags: ['change language', 'settings', 'multiple languages', 'switch'],
  },
  {
    id: '12',
    question: 'How do I customize notifications and reminders?',
    answer: 'Personalize your learning reminders:\n\n**Notification Settings:**\n1. Go to Settings > Notifications\n2. Toggle push notifications on/off\n3. Set study reminder times\n4. Choose notification frequency\n\n**Available Reminders:**\n• Daily practice reminders\n• Streak maintenance alerts\n• Weekly progress summaries\n• Achievement notifications\n\n**Reminder Times:**\n• 9:00 AM, 12:00 PM, 6:00 PM, 7:00 PM, 8:00 PM\n• Or disable completely\n\nYou can also manage notifications in your device settings.',
    category: 'settings',
    icon: Bell,
    tags: ['notifications', 'reminders', 'settings', 'daily', 'alerts'],
  },
  {
    id: '13',
    question: 'How do I backup and sync my progress?',
    answer: 'Keep your progress safe across devices:\n\n**Automatic Sync:**\n• Progress syncs when connected to internet\n• Works across iOS, Android, and web\n• Real-time updates when online\n\n**Manual Backup:**\n1. Go to Settings > Data & Storage\n2. Tap "Sync Data" to force backup\n3. Use "Export Progress" to download data\n\n**What\'s Synced:**\n• Learning progress and statistics\n• Completed lessons and modules\n• Streak data and achievements\n• Settings and preferences\n\nYour data is encrypted and secure!',
    category: 'settings',
    icon: Shield,
    tags: ['backup', 'sync', 'data', 'progress', 'devices', 'export'],
  },

  // Technical Support
  {
    id: '14',
    question: 'The app is running slowly or crashing. What should I do?',
    answer: 'Try these troubleshooting steps:\n\n**Quick Fixes:**\n1. Close and restart the app\n2. Restart your device\n3. Check for app updates in your app store\n4. Ensure you have stable internet connection\n\n**If problems persist:**\n1. Clear app cache (Android: Settings > Apps > LinguaMate > Storage)\n2. Free up device storage space\n3. Update your device OS\n4. Reinstall the app (progress is saved in cloud)\n\n**Still having issues?**\nContact support@linguamate.app with:\n• Device model and OS version\n• Description of the problem\n• Steps that led to the issue',
    category: 'technical',
    icon: Smartphone,
    tags: ['crash', 'slow', 'performance', 'troubleshooting', 'bugs'],
  },
  {
    id: '15',
    question: 'Audio is not working or pronunciation sounds unclear',
    answer: 'Audio issues can usually be resolved:\n\n**Check Audio Settings:**\n1. Go to Settings > Audio & Feedback\n2. Ensure "Sound Effects" is enabled\n3. Check "Auto-play Audio" setting\n4. Test device volume and media settings\n\n**Device-Specific Fixes:**\n• iOS: Check Silent/Ring switch position\n• Android: Verify media volume is up\n• Bluetooth: Disconnect/reconnect headphones\n• Web: Check browser audio permissions\n\n**If audio is unclear:**\n• Use headphones for better quality\n• Check internet connection speed\n• Try different audio exercises\n• Report specific pronunciation issues to support',
    category: 'technical',
    icon: Volume2,
    tags: ['audio', 'sound', 'pronunciation', 'volume', 'headphones'],
  },
  {
    id: '16',
    question: 'How do I contact customer support?',
    answer: 'We\'re here to help! Contact us through:\n\n**Email Support:**\n• support@linguamate.app\n• Response within 24 hours\n• Include your user ID for faster help\n\n**In-App Support:**\n1. Go to Settings > Contact Support\n2. Tap to open email with pre-filled info\n3. Describe your issue in detail\n\n**What to Include:**\n• Device model and OS version\n• App version (found in Settings)\n• Screenshots if relevant\n• Steps to reproduce the issue\n• Your user ID\n\n**Premium Support:**\nPremium users get priority support with faster response times!',
    category: 'technical',
    icon: Mail,
    tags: ['support', 'contact', 'help', 'email', 'customer service'],
  },

  // Additional helpful topics
  {
    id: '17',
    question: 'How can I learn more effectively with LinguaMate?',
    answer: 'Maximize your learning with these tips:\n\n**Daily Habits:**\n• Set a consistent study time\n• Start with 10-15 minutes daily\n• Use the chat feature regularly\n• Review previous lessons\n\n**Learning Strategies:**\n• Practice speaking out loud\n• Use the translator for context\n• Focus on practical phrases first\n• Don\'t be afraid to make mistakes\n\n**Advanced Techniques:**\n• Combine multiple modules\n• Set weekly vocabulary goals\n• Practice with cultural context\n• Use spaced repetition for review\n\n**Stay Motivated:**\n• Track your streak\n• Celebrate small wins\n• Join language communities\n• Set realistic goals',
    category: 'learning',
    icon: Lightbulb,
    tags: ['tips', 'effective learning', 'strategies', 'motivation', 'habits'],
  },
  {
    id: '18',
    question: 'Is my personal data and learning progress secure?',
    answer: 'Your privacy and data security are our top priorities:\n\n**Data Protection:**\n• All data encrypted in transit and at rest\n• Secure cloud storage with regular backups\n• No personal data sold to third parties\n• GDPR and privacy law compliant\n\n**What We Collect:**\n• Learning progress and statistics\n• App usage for improvement\n• Crash reports for bug fixes\n• Optional feedback and ratings\n\n**What We Don\'t Collect:**\n• Personal conversations outside the app\n• Device contacts or photos\n• Location data\n• Financial information (handled by app stores)\n\n**Your Rights:**\n• Export your data anytime\n• Delete your account and data\n• Control data sharing preferences\n\nRead our full Privacy Policy in Settings > Privacy Policy.',
    category: 'settings',
    icon: Shield,
    tags: ['privacy', 'security', 'data protection', 'gdpr', 'encryption'],
  },
];

export default function HelpScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleContactSupport = () => {
    const email = 'support@linguamate.app';
    const subject = 'LinguaMate Help Request';
    const body = `Hi LinguaMate Team,\n\nI need help with:\n\n[Please describe your question or issue here]\n\nI've checked the FAQ but couldn't find the answer.\n\nApp Version: 1.2.0\nPlatform: ${Platform.OS}`;
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mailtoUrl);
        } else {
          Alert.alert(
            'Contact Support',
            `Email us at: ${email}\n\nWe typically respond within 24 hours.`,
            [{ text: 'OK' }]
          );
        }
      })
      .catch(() => {
        Alert.alert(
          'Contact Support',
          `Email us at: ${email}\n\nWe typically respond within 24 hours.`,
          [{ text: 'OK' }]
        );
      });
  };

  const handleVisitWebsite = () => {
    const websiteUrl = 'https://linguamate.app';
    
    Linking.canOpenURL(websiteUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(websiteUrl);
        } else {
          Alert.alert('Website', 'Visit linguamate.app for more information.');
        }
      })
      .catch(() => {
        Alert.alert('Website', 'Visit linguamate.app for more information.');
      });
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Help & FAQ',
          headerStyle: {
            backgroundColor: 'white',
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1F2937',
          },
        }} 
      />
      <SafeAreaView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search help topics..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  isSelected && { backgroundColor: category.color },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <IconComponent 
                  size={16} 
                  color={isSelected ? 'white' : category.color} 
                />
                <Text style={[
                  styles.categoryText,
                  isSelected && styles.selectedCategoryText,
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FAQ List */}
        <ScrollView 
          style={styles.faqContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredFAQs.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <HelpCircle size={48} color="#D1D5DB" />
              <Text style={styles.noResultsTitle}>No results found</Text>
              <Text style={styles.noResultsText}>
                Try adjusting your search or browse different categories
              </Text>
            </View>
          ) : (
            filteredFAQs.map((item) => {
              const IconComponent = item.icon;
              const isExpanded = expandedItems.has(item.id);
              
              return (
                <View key={item.id} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => toggleExpanded(item.id)}
                  >
                    <View style={styles.faqHeaderLeft}>
                      <View style={styles.faqIcon}>
                        <IconComponent size={18} color="#6B7280" />
                      </View>
                      <Text style={styles.faqQuestion}>{item.question}</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color="#9CA3AF" />
                    ) : (
                      <ChevronDown size={20} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{item.answer}</Text>
                      
                      {/* Tags */}
                      <View style={styles.tagsContainer}>
                        {item.tags.slice(0, 3).map((tag) => (
                          <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* Contact Support Section */}
          <View style={styles.supportSection}>
            <Text style={styles.supportTitle}>Still need help?</Text>
            <Text style={styles.supportDescription}>
              Can&apos;t find what you&apos;re looking for? Our support team is here to help!
            </Text>
            
            <TouchableOpacity 
              style={styles.supportButton}
              onPress={handleContactSupport}
            >
              <Mail size={20} color="white" />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.websiteButton}
              onPress={handleVisitWebsite}
            >
              <ExternalLink size={18} color="#8B5CF6" />
              <Text style={styles.websiteButtonText}>Visit Website</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>LinguaMate Help Center</Text>
            <Text style={styles.footerSubtext}>
              Updated regularly with new topics and solutions
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  categoryContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedCategoryText: {
    color: 'white',
  },
  faqContainer: {
    flex: 1,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  faqItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    lineHeight: 22,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswerText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '500',
  },
  supportSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  supportDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  supportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  websiteButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});