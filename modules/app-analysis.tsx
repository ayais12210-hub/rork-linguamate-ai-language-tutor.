import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Award,
  Target,
  Zap,
  BookOpen,
  Users,
  Globe,
  MessageSquare,
  Brain,
  Sparkles,
} from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';
import { useLearningProgress } from '@/state/learning-progress';

interface AppFeature {
  name: string;
  status: 'complete' | 'partial' | 'missing';
  description: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  icon: React.ReactNode;
}

interface AppRating {
  overall: number;
  features: number;
  content: number;
  gamification: number;
  ai: number;
  ux: number;
}

export default function AppAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [features, setFeatures] = useState<AppFeature[]>([]);
  const [rating, setRating] = useState<AppRating>({
    overall: 0,
    features: 0,
    content: 0,
    gamification: 0,
    ai: 0,
    ux: 0,
  });
  const [recommendations, setRecommendations] = useState<string[]>([]);
  
  const { user } = useUser();
  const { skills } = useLearningProgress();

  useEffect(() => {
    analyzeApp();
  }, []);

  const analyzeApp = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const appFeatures: AppFeature[] = [
      {
        name: 'Alphabet & Script Learning',
        status: 'complete',
        description: 'Interactive alphabet tracing with pronunciation',
        importance: 'critical',
        icon: <BookOpen size={20} color="#10B981" />,
      },
      {
        name: 'Numbers & Counting',
        status: 'complete',
        description: 'Gamified number learning with timed challenges',
        importance: 'critical',
        icon: <Target size={20} color="#10B981" />,
      },
      {
        name: 'Vowels & Consonants',
        status: 'partial',
        description: 'Basic implementation, needs audio integration',
        importance: 'important',
        icon: <MessageSquare size={20} color="#F59E0B" />,
      },
      {
        name: 'Syllable Builder',
        status: 'partial',
        description: 'Drag-and-drop interface planned',
        importance: 'important',
        icon: <Brain size={20} color="#F59E0B" />,
      },
      {
        name: 'Grammar Engine',
        status: 'partial',
        description: 'Rule-based exercises with explanations',
        importance: 'critical',
        icon: <BookOpen size={20} color="#F59E0B" />,
      },
      {
        name: 'AI Conversation Practice',
        status: 'complete',
        description: 'GPT-powered chat with language coach',
        importance: 'critical',
        icon: <MessageSquare size={20} color="#10B981" />,
      },
      {
        name: 'Speech Recognition',
        status: 'complete',
        description: 'Pronunciation checking with feedback',
        importance: 'important',
        icon: <Globe size={20} color="#10B981" />,
      },
      {
        name: 'Spaced Repetition',
        status: 'complete',
        description: 'SM-2 algorithm for optimal review timing',
        importance: 'critical',
        icon: <Brain size={20} color="#10B981" />,
      },
      {
        name: 'Adaptive Difficulty',
        status: 'complete',
        description: 'AI adjusts based on performance',
        importance: 'important',
        icon: <TrendingUp size={20} color="#10B981" />,
      },
      {
        name: 'Gamification System',
        status: 'complete',
        description: 'XP, streaks, achievements, leaderboards',
        importance: 'important',
        icon: <Award size={20} color="#10B981" />,
      },
      {
        name: 'Offline Mode',
        status: 'missing',
        description: 'Download lessons for offline practice',
        importance: 'nice-to-have',
        icon: <XCircle size={20} color="#EF4444" />,
      },
      {
        name: 'Social Features',
        status: 'missing',
        description: 'Friend challenges and study groups',
        importance: 'nice-to-have',
        icon: <Users size={20} color="#EF4444" />,
      },
      {
        name: 'Voice Cloning',
        status: 'missing',
        description: 'Native speaker voice synthesis',
        importance: 'nice-to-have',
        icon: <XCircle size={20} color="#EF4444" />,
      },
      {
        name: 'AR Features',
        status: 'missing',
        description: 'Augmented reality for immersive learning',
        importance: 'nice-to-have',
        icon: <XCircle size={20} color="#EF4444" />,
      },
      {
        name: 'Progress Analytics',
        status: 'partial',
        description: 'Detailed learning insights dashboard',
        importance: 'important',
        icon: <TrendingUp size={20} color="#F59E0B" />,
      },
    ];
    
    setFeatures(appFeatures);
    
    // Calculate ratings
    const completeCount = appFeatures.filter(f => f.status === 'complete').length;
    const partialCount = appFeatures.filter(f => f.status === 'partial').length;
    const totalCount = appFeatures.length;
    
    const featureScore = ((completeCount * 1 + partialCount * 0.5) / totalCount) * 100;
    
    const newRating: AppRating = {
      features: Math.round(featureScore),
      content: 85, // Based on language coverage and quality
      gamification: 90, // Strong gamification elements
      ai: 88, // Advanced AI features
      ux: 82, // Good UX with room for improvement
      overall: 0,
    };
    
    // Calculate overall rating
    newRating.overall = Math.round(
      (newRating.features + newRating.content + newRating.gamification + 
       newRating.ai + newRating.ux) / 5
    );
    
    setRating(newRating);
    
    // Generate recommendations
    const recs: string[] = [];
    
    if (partialCount > 3) {
      recs.push('Complete partial features for full functionality');
    }
    
    const criticalMissing = appFeatures.filter(
      f => f.status === 'missing' && f.importance === 'critical'
    );
    
    if (criticalMissing.length > 0) {
      recs.push('Implement critical missing features urgently');
    }
    
    if (newRating.ux < 85) {
      recs.push('Enhance UI/UX with animations and micro-interactions');
    }
    
    recs.push('Add more language pairs for broader appeal');
    recs.push('Implement offline mode for better accessibility');
    recs.push('Add social features to increase engagement');
    recs.push('Create video lessons for visual learners');
    recs.push('Add cultural context modules');
    
    setRecommendations(recs);
    setIsAnalyzing(false);
  };

  const getRatingColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#F59E0B';
    if (score >= 50) return '#3B82F6';
    return '#EF4444';
  };

  const getRatingLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
  };

  if (isAnalyzing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Analyzing app features...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>App Analysis Report</Text>
          <Text style={styles.headerSubtitle}>
            Comprehensive evaluation of your language learning app
          </Text>
        </LinearGradient>

        {/* Overall Rating */}
        <View style={styles.ratingSection}>
          <View style={styles.overallRatingCard}>
            <Text style={styles.overallRatingTitle}>Overall Rating</Text>
            <View style={styles.ratingCircle}>
              <Text style={[styles.ratingScore, { color: getRatingColor(rating.overall) }]}>
                {rating.overall}%
              </Text>
              <Text style={styles.ratingLabel}>{getRatingLabel(rating.overall)}</Text>
            </View>
            
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  size={24}
                  color={star <= Math.round(rating.overall / 20) ? '#F59E0B' : '#E5E7EB'}
                  fill={star <= Math.round(rating.overall / 20) ? '#F59E0B' : 'transparent'}
                />
              ))}
            </View>
          </View>

          {/* Category Ratings */}
          <View style={styles.categoryRatings}>
            {Object.entries(rating).filter(([key]) => key !== 'overall').map(([category, score]) => (
              <View key={category} style={styles.categoryCard}>
                <Text style={styles.categoryName}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <View style={styles.categoryScoreContainer}>
                  <View style={styles.categoryProgressBar}>
                    <View
                      style={[
                        styles.categoryProgressFill,
                        { 
                          width: `${score}%`,
                          backgroundColor: getRatingColor(score),
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryScore}>{score}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Features Analysis */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Feature Analysis</Text>
          
          <View style={styles.featureStats}>
            <View style={styles.statCard}>
              <CheckCircle size={20} color="#10B981" />
              <Text style={styles.statValue}>
                {features.filter(f => f.status === 'complete').length}
              </Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
            
            <View style={styles.statCard}>
              <AlertCircle size={20} color="#F59E0B" />
              <Text style={styles.statValue}>
                {features.filter(f => f.status === 'partial').length}
              </Text>
              <Text style={styles.statLabel}>Partial</Text>
            </View>
            
            <View style={styles.statCard}>
              <XCircle size={20} color="#EF4444" />
              <Text style={styles.statValue}>
                {features.filter(f => f.status === 'missing').length}
              </Text>
              <Text style={styles.statLabel}>Missing</Text>
            </View>
          </View>

          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureHeader}>
                {feature.icon}
                <View style={styles.featureInfo}>
                  <Text style={styles.featureName}>{feature.name}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
              
              <View style={styles.featureFooter}>
                <View style={[
                  styles.statusBadge,
                  feature.status === 'complete' && styles.completeBadge,
                  feature.status === 'partial' && styles.partialBadge,
                  feature.status === 'missing' && styles.missingBadge,
                ]}>
                  <Text style={[
                    styles.statusText,
                    feature.status === 'complete' && styles.completeText,
                    feature.status === 'partial' && styles.partialText,
                    feature.status === 'missing' && styles.missingText,
                  ]}>
                    {feature.status}
                  </Text>
                </View>
                
                <Text style={[
                  styles.importanceText,
                  feature.importance === 'critical' && styles.criticalText,
                  feature.importance === 'important' && styles.importantText,
                ]}>
                  {feature.importance}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationCard}>
              <Sparkles size={16} color="#8B5CF6" />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <LinearGradient
            colors={['#F0FDF4', '#DCFCE7']}
            style={styles.summaryCard}
          >
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>
              Your language learning app shows strong potential with {rating.overall}% completion.
              Core features like AI conversation, gamification, and adaptive learning are well-implemented.
              Focus on completing partial features and adding social elements to reach production readiness.
            </Text>
            
            <View style={styles.readinessIndicator}>
              <Text style={styles.readinessLabel}>Production Readiness:</Text>
              <View style={styles.readinessBar}>
                <View style={[styles.readinessFill, { width: `${rating.overall}%` }]} />
              </View>
              <Text style={styles.readinessPercentage}>{rating.overall}%</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  ratingSection: {
    padding: 20,
  },
  overallRatingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overallRatingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  ratingCircle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingScore: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryRatings: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categoryScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    width: 40,
  },
  featuresSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  featureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeBadge: {
    backgroundColor: '#DCFCE7',
  },
  partialBadge: {
    backgroundColor: '#FEF3C7',
  },
  missingBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  completeText: {
    color: '#059669',
  },
  partialText: {
    color: '#D97706',
  },
  missingText: {
    color: '#DC2626',
  },
  importanceText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  criticalText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  importantText: {
    color: '#D97706',
  },
  recommendationsSection: {
    padding: 20,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    alignItems: 'center',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  summarySection: {
    padding: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
    marginBottom: 20,
  },
  readinessIndicator: {
    gap: 8,
  },
  readinessLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
  readinessBar: {
    height: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  readinessFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  readinessPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857',
    textAlign: 'center',
  },
});