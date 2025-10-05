import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { 
  MessageCircle, 
  Flame, 
  BookOpen, 
  Zap, 
  Crown,
  Trophy,
  Star,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  Users,
  Shield,
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  Globe,
  Facebook,
  Chrome,
  Apple,
  Search,
  Filter,
  ChevronDown,
  X,
  Medal,
} from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';
import { useLearningProgress } from '@/state/learning-progress';
import { LANGUAGES } from '@/constants/languages';
import UpgradeModal from '@/components/UpgradeModal';
import { storageHelpers, STORAGE_KEYS } from '@/lib/storage';
import { Lightbulb, Quote, History, Save, Trash2 } from 'lucide-react-native';

interface JournalEntry {
  id: string;
  text: string;
  createdAt: string;
  languageCode?: string;
}

interface LeaderboardUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  totalXP: number;
  streak: number;
  languagesLearned: string[];
  badges: any[];
  level: number;
  rank: number;
  weeklyXP: number;
  monthlyXP: number;
  completedLessons: number;
  achievements: string[];
  joinedAt: string;
  lastActive: string;
}

type LeaderboardFilter = 'all' | 'weekly' | 'monthly' | 'friends';
type SortBy = 'xp' | 'streak' | 'lessons' | 'languages';


type AuthMode = 'signin' | 'signup' | 'profile';

export default function ProfileScreen() {
  const { user, updateUser, upgradeToPremium } = useUser();
  const [authMode, setAuthMode] = useState<AuthMode>(user.email ? 'profile' : 'signin');
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'stats' | 'achievements' | 'friends' | 'leaderboard'>('stats');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const { skills } = useLearningProgress();

  const [journalDraft, setJournalDraft] = useState<string>('');
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [journalSaving, setJournalSaving] = useState<boolean>(false);
  
  // Leaderboard states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<LeaderboardFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('xp');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);

  const userStats = (user.stats ?? {
    totalChats: 0,
    streakDays: 0,
    wordsLearned: 0,
    xpPoints: 0,
    lastActiveDate: '',
    messagesUsedToday: 0,
    lastMessageDate: '',
    badges: [],
  });
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const selectedLanguage = LANGUAGES.find(lang => lang.code === (user.selectedLanguage ?? undefined));

  useEffect(() => {
    const loadJournal = async () => {
      try {
        console.log('[Profile] Loading journal from storage');
        const data = await storageHelpers.getObject<JournalEntry[]>(STORAGE_KEYS.JOURNAL);
        if (data) {
          setJournal(data);
        }
      } catch (e) {
        console.error('[Profile] Failed to load journal', e);
      }
    };
    loadJournal();
  }, []);

  const saveJournalEntry = useCallback(async () => {
    const trimmed = journalDraft.trim();
    if (!trimmed) {
      Alert.alert('Empty entry', 'Write something you learned today.');
      return;
    }
    setJournalSaving(true);
    try {
      const entry: JournalEntry = {
        id: `jr_${Date.now()}`,
        text: trimmed,
        createdAt: new Date().toISOString(),
        languageCode: user.selectedLanguage ?? undefined,
      };
      const updated = [entry, ...journal].slice(0, 100);
      setJournal(updated);
      setJournalDraft('');
      await storageHelpers.setObject(STORAGE_KEYS.JOURNAL, updated);
      console.log('[Profile] Journal saved. total:', updated.length);
    } catch (e) {
      console.error('[Profile] Failed to save journal', e);
      Alert.alert('Save failed', 'Could not save your journal. Please try again.');
    } finally {
      setJournalSaving(false);
    }
  }, [journalDraft, journal, user.selectedLanguage]);

  const removeEntry = useCallback(async (id: string) => {
    try {
      const updated = journal.filter(j => j.id !== id);
      setJournal(updated);
      await storageHelpers.setObject(STORAGE_KEYS.JOURNAL, updated);
    } catch (e) {
      console.error('[Profile] Failed to delete journal entry', e);
      Alert.alert('Delete failed', 'Could not delete the entry.');
    }
  }, [journal]);

  const suggestionChips = useMemo(() => {
    const today = new Date();
    const lang = selectedLanguage?.name ?? 'My language';
    const items: string[] = [];
    items.push(`I practiced ${userStats.wordsLearned} words in ${lang}.`);
    items.push(`I kept a streak of ${userStats.streakDays} days!`);
    items.push(`I had ${userStats.totalChats} total chats and gained ${userStats.xpPoints} XP.`);
    items.push('A new concept clicked for me today: …');
    items.push('I want to improve on: pronunciation and listening.');
    items.push('Favorite phrase I learned: "…"');
    items.push(`Date ${today.toLocaleDateString()}: My study mood was …`);
    return items;
  }, [selectedLanguage?.name, userStats.wordsLearned, userStats.streakDays, userStats.totalChats, userStats.xpPoints]);

  const appendSuggestion = useCallback((s: string) => {
    setJournalDraft(prev => (prev ? `${prev} ${s}` : s));
  }, []);

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    upgradeToPremium();
    Alert.alert('Success!', 'You now have Premium access!');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (authMode === 'signup' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (authMode === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user with auth data
      updateUser({
        name: formData.name || formData.email.split('@')[0],
        email: formData.email,
        id: `user_${Date.now()}`,
      });
      
      setAuthMode('profile');
      Alert.alert(
        'Success!', 
        authMode === 'signin' ? 'Welcome back!' : 'Account created successfully!'
      );
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    setIsLoading(true);
    
    try {
      // Simulate social auth
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateUser({
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        email: `user@${provider}.com`,
        id: `${provider}_${Date.now()}`,
      });
      
      setAuthMode('profile');
      Alert.alert('Success!', `Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
    } catch (error) {
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            updateUser({ name: undefined, email: undefined, id: 'guest' });
            setAuthMode('signin');
            setFormData({ name: '', email: '', password: '', confirmPassword: '' });
          },
        },
      ]
    );
  };

  const stats = [
    {
      icon: MessageCircle,
      label: 'Total Chats',
      value: userStats.totalChats.toString(),
      color: '#3B82F6',
      change: '+12%',
      isPositive: true,
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: `${userStats.streakDays} days`,
      color: '#EF4444',
      change: userStats.streakDays > 0 ? 'Active' : 'Broken',
      isPositive: userStats.streakDays > 0,
    },
    {
      icon: BookOpen,
      label: 'Words Learned',
      value: userStats.wordsLearned.toString(),
      color: '#10B981',
      change: '+8 this week',
      isPositive: true,
    },
    {
      icon: Zap,
      label: 'XP Points',
      value: userStats.xpPoints.toString(),
      color: '#F59E0B',
      change: '+150 today',
      isPositive: true,
    },
  ];
  
  const weeklyGoals = [
    {
      id: 'daily_lesson',
      title: 'Complete Daily Lesson',
      description: 'Finish at least one lesson every day',
      progress: 5,
      target: 7,
      icon: Target,
      color: '#10B981',
    },
    {
      id: 'weekly_xp',
      title: 'Earn 500 XP',
      description: 'Accumulate XP through lessons and practice',
      progress: 320,
      target: 500,
      icon: Zap,
      color: '#F59E0B',
    },
    {
      id: 'perfect_lessons',
      title: 'Perfect Lessons',
      description: 'Complete 3 lessons with 100% accuracy',
      progress: 1,
      target: 3,
      icon: Star,
      color: '#8B5CF6',
    },
  ];
  
  const friendsActivity = [
    {
      id: '1',
      name: 'Sarah Chen',
      avatar: '👩‍💼',
      action: 'completed a lesson',
      time: '2 hours ago',
      xp: 25,
    },
    {
      id: '2',
      name: 'Miguel Rodriguez',
      avatar: '👨‍🎓',
      action: 'reached a 30-day streak',
      time: '4 hours ago',
      xp: 100,
    },
    {
      id: '3',
      name: 'Emma Johnson',
      avatar: '👩‍🎨',
      action: 'earned a new badge',
      time: '1 day ago',
      xp: 50,
    },
  ];
  
  // Mock leaderboard data
  const leaderboardData: LeaderboardUser[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      totalXP: 15420,
      streak: 47,
      languagesLearned: ['Spanish', 'French', 'Italian'],
      badges: [],
      level: 12,
      rank: 1,
      weeklyXP: 2340,
      monthlyXP: 8920,
      completedLessons: 156,
      achievements: ['Speed Learner', 'Polyglot', 'Streak Master'],
      joinedAt: '2024-01-15',
      lastActive: '2024-12-21',
    },
    {
      id: '2',
      name: 'Miguel Rodriguez',
      email: 'miguel@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      totalXP: 14890,
      streak: 32,
      languagesLearned: ['English', 'Portuguese'],
      badges: [],
      level: 11,
      rank: 2,
      weeklyXP: 1980,
      monthlyXP: 7650,
      completedLessons: 142,
      achievements: ['Consistent Learner', 'Grammar Master'],
      joinedAt: '2024-02-03',
      lastActive: '2024-12-21',
    },
    {
      id: '3',
      name: 'Emma Johnson',
      email: 'emma@example.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      totalXP: 13560,
      streak: 28,
      languagesLearned: ['Japanese', 'Korean'],
      badges: [],
      level: 10,
      rank: 3,
      weeklyXP: 1750,
      monthlyXP: 6890,
      completedLessons: 128,
      achievements: ['Cultural Explorer', 'Pronunciation Pro'],
      joinedAt: '2024-01-28',
      lastActive: '2024-12-20',
    },
    {
      id: user.id,
      name: user.name || 'You',
      email: user.email,
      avatar: undefined,
      totalXP: user.totalXP || user.stats?.xpPoints || 0,
      streak: user.streak || user.stats?.streakDays || 0,
      languagesLearned: user.selectedLanguage ? [user.selectedLanguage] : [],
      badges: user.stats?.badges || [],
      level: Math.floor((user.totalXP || user.stats?.xpPoints || 0) / 1000) + 1,
      rank: 4,
      weeklyXP: 890,
      monthlyXP: 3420,
      completedLessons: user.completedLessons?.length || 0,
      achievements: user.achievements || [],
      joinedAt: '2024-03-01',
      lastActive: '2024-12-21',
    },
  ];
  
  const filteredData = leaderboardData
    .filter(userData => {
      if (searchQuery) {
        return userData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               userData.email?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'xp':
          return filter === 'weekly' ? b.weeklyXP - a.weeklyXP :
                 filter === 'monthly' ? b.monthlyXP - a.monthlyXP :
                 b.totalXP - a.totalXP;
        case 'streak':
          return b.streak - a.streak;
        case 'lessons':
          return b.completedLessons - a.completedLessons;
        case 'languages':
          return b.languagesLearned.length - a.languagesLearned.length;
        default:
          return b.totalXP - a.totalXP;
      }
    });
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={24} color="#FFD700" />;
      case 2:
        return <Medal size={24} color="#C0C0C0" />;
      case 3:
        return <Medal size={24} color="#CD7F32" />;
      default:
        return <Text style={styles.rankNumber}>#{rank}</Text>;
    }
  };
  
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return '#6B7280';
    }
  };
  
  const showUserDetails = (userData: LeaderboardUser) => {
    if (!userData?.name?.trim()) return;
    setSelectedUser(userData);
    setShowUserModal(true);
  };
  
  const FilterButton = ({ title, value, isActive }: { title: string; value: LeaderboardFilter; isActive: boolean }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
  
  const SortButton = ({ title, value, isActive }: { title: string; value: SortBy; isActive: boolean }) => (
    <TouchableOpacity
      style={[styles.sortButton, isActive && styles.sortButtonActive]}
      onPress={() => setSortBy(value)}
    >
      <Text style={[styles.sortButtonText, isActive && styles.sortButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Render authentication screens
  if (authMode === 'signin' || authMode === 'signup') {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.authScrollContainer}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.authHeader}
          >
            <View style={styles.authHeaderContent}>
              <View style={styles.logoContainer}>
                <Globe size={40} color="white" />
                <Text style={styles.logoText}>LinguaMate</Text>
              </View>
              <Text style={styles.authHeaderTitle}>
                {authMode === 'signin' ? 'Welcome Back!' : 'Join LinguaMate'}
              </Text>
              <Text style={styles.authHeaderSubtitle}>
                {authMode === 'signin' 
                  ? 'Sign in to continue your language journey'
                  : 'Start your personalized language learning adventure'
                }
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.authFormContainer}>
            <View style={styles.authForm}>
              <Text style={styles.formTitle}>
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>

              {/* Social Auth Buttons */}
              <View style={styles.socialAuthContainer}>
                <TouchableOpacity 
                  style={[styles.socialButton, styles.googleButton]}
                  onPress={() => handleSocialAuth('google')}
                  disabled={isLoading}
                >
                  <Chrome size={20} color="#4285F4" />
                  <Text style={[styles.socialButtonText, { color: '#4285F4' }]}>Google</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.socialButton, styles.facebookButton]}
                  onPress={() => handleSocialAuth('facebook')}
                  disabled={isLoading}
                >
                  <Facebook size={20} color="#1877F2" />
                  <Text style={[styles.socialButtonText, { color: '#1877F2' }]}>Facebook</Text>
                </TouchableOpacity>
                
                {Platform.OS === 'ios' && (
                  <TouchableOpacity 
                    style={[styles.socialButton, styles.appleButton]}
                    onPress={() => handleSocialAuth('apple')}
                    disabled={isLoading}
                  >
                    <Apple size={20} color="black" />
                    <Text style={[styles.socialButtonText, { color: 'black' }]}>Apple</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Form Fields */}
              {authMode === 'signup' && (
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <UserIcon size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, errors.name && styles.inputError]}
                      placeholder="Full Name"
                      value={formData.name}
                      onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, name: text }));
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                      }}
                      autoCapitalize="words"
                      editable={!isLoading}
                    />
                  </View>
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>
              )}

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, errors.email && styles.inputError]}
                    placeholder="Email Address"
                    value={formData.email}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, email: text }));
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, errors.password && styles.inputError]}
                    placeholder="Password"
                    value={formData.password}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, password: text }));
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#6B7280" />
                    ) : (
                      <Eye size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {authMode === 'signup' && (
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, errors.confirmPassword && styles.inputError]}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, confirmPassword: text }));
                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                    <TouchableOpacity 
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#6B7280" />
                      ) : (
                        <Eye size={20} color="#6B7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>
              )}

              {/* Forgot Password */}
              {authMode === 'signin' && (
                <TouchableOpacity style={styles.forgotPasswordButton}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <TouchableOpacity 
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                    </Text>
                    <ArrowRight size={20} color="white" style={styles.submitButtonIcon} />
                  </>
                )}
              </TouchableOpacity>

              {/* Switch Auth Mode */}
              <View style={styles.switchAuthContainer}>
                <Text style={styles.switchAuthText}>
                  {authMode === 'signin' 
                    ? "Don't have an account? " 
                    : "Already have an account? "
                  }
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                    setErrors({});
                    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.switchAuthLink}>
                    {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Features Preview */}
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Why join LinguaMate?</Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={styles.featureText}>AI-powered personalized lessons</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={styles.featureText}>Track your progress & streaks</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={styles.featureText}>Interactive conversations</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={styles.featureText}>Multiple language support</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Render profile screen for authenticated users
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={user.isPremium ? ['#8B5CF6', '#A855F7'] : ['#10B981', '#059669']}
          style={styles.header}
        >
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </Text>
            </View>
            <Text style={styles.userName}>
              {user.name || 'Language Learner'}
            </Text>
            
            {user.email && (
              <Text style={styles.userEmail}>{user.email}</Text>
            )}
            
            <View style={styles.languageInfo}>
              <Text style={styles.languageFlag}>{selectedLanguage?.flag}</Text>
              <Text style={styles.languageName}>Learning {selectedLanguage?.name}</Text>
            </View>
            
            <View style={styles.levelInfo}>
              <Shield size={16} color="white" />
              <Text style={styles.levelText}>Level {Math.floor(userStats.xpPoints / 100) + 1}</Text>
            </View>
            
            <View style={styles.profileActions}>
              <View style={styles.premiumBadge}>
                {user.isPremium ? (
                  <View style={styles.premiumContainer}>
                    <Crown size={16} color="#FFD700" />
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.upgradeButton}
                    onPress={() => setShowUpgradeModal(true)}
                  >
                    <Star size={16} color="white" />
                    <Text style={styles.upgradeText}>Upgrade</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {(['stats', 'achievements', 'friends', 'leaderboard'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                selectedTab === tab && styles.activeTabButton,
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[
                styles.tabButtonText,
                selectedTab === tab && styles.activeTabButtonText,
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Stats Tab */}
        {selectedTab === 'stats' && (
          <>
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Your Progress</Text>
              <View style={styles.statsGrid}>
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <View key={index} style={styles.statCard}>
                      <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                        <IconComponent size={24} color="white" />
                      </View>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                      <View style={styles.statChange}>
                        <TrendingUp 
                          size={12} 
                          color={stat.isPositive ? '#10B981' : '#EF4444'} 
                        />
                        <Text style={[
                          styles.statChangeText,
                          { color: stat.isPositive ? '#10B981' : '#EF4444' }
                        ]}>
                          {stat.change}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            
            {/* Weekly Goals */}
            <View style={styles.goalsContainer}>
              <Text style={styles.sectionTitle}>Weekly Goals</Text>
              {weeklyGoals.map((goal) => {
                const IconComponent = goal.icon;
                const progressPercentage = (goal.progress / goal.target) * 100;
                
                return (
                  <View key={goal.id} style={styles.goalCard}>
                    <View style={[styles.goalIcon, { backgroundColor: goal.color }]}>
                      <IconComponent size={20} color="white" />
                    </View>
                    
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalDescription}>{goal.description}</Text>
                      
                      <View style={styles.goalProgress}>
                        <View style={styles.goalProgressBar}>
                          <View 
                            style={[
                              styles.goalProgressFill, 
                              { 
                                width: `${Math.min(progressPercentage, 100)}%`,
                                backgroundColor: goal.color 
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.goalProgressText}>
                          {goal.progress}/{goal.target}
                        </Text>
                      </View>
                    </View>
                    
                    {progressPercentage >= 100 && (
                      <View style={styles.goalCompleted}>
                        <Trophy size={16} color="#F59E0B" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Achievements Tab */}
        {selectedTab === 'achievements' && (
          <View style={styles.achievementsContainer} testID="achievements-tab">
            <Text style={styles.sectionTitle}>Your Achievements</Text>

            <View style={styles.streakCard} testID="streak-card">
              <View style={styles.streakHeader}>
                <Flame size={20} color="#EF4444" />
                <Text style={styles.streakTitle}>Current Streak</Text>
                <Text style={styles.streakValue}>{userStats.streakDays} days</Text>
              </View>
              <View style={styles.streakBarContainer}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const filled = userStats.streakDays >= 7 - i;
                  return (
                    <View
                      key={i}
                      style={[styles.streakDot, filled ? styles.streakDotFilled : styles.streakDotEmpty]}
                      testID={`streak-dot-${i}`}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.sectionBlock} testID="lesson-achievements">
              <Text style={styles.subSectionTitle}>Lesson Achievements</Text>
              <View style={styles.typeGrid}>
                {(['alphabet','number','vowel','consonant','syllable','word','grammar'] as const).map((t) => {
                  const list = Object.values(skills).filter(s => s.type === t);
                  const mastered = list.filter(s => s.mastery === 'mastered').length;
                  const progressPct = list.length > 0 ? (mastered / list.length) * 100 : 0;
                  return (
                    <View key={t} style={styles.typeCard}>
                      <View style={styles.typeHeader}>
                        <Text style={styles.typeTitle}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                        {mastered > 0 && (
                          <Trophy size={16} color="#F59E0B" />
                        )}
                      </View>
                      <View style={styles.goalProgressBar}>
                        <View style={[styles.goalProgressFill, { width: `${Math.min(progressPct, 100)}%`, backgroundColor: '#10B981' }]} />
                      </View>
                      <Text style={styles.typeMeta}>{mastered}/{list.length} mastered</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {userStats.badges.length > 0 ? (
              <View style={styles.badgesGrid} testID="earned-badges">
                {userStats.badges.map((badge) => (
                  <View key={badge.id} style={styles.badgeCard}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                    <Text style={styles.badgeDescription}>{badge.description}</Text>
                    <Text style={styles.badgeDate}>
                      Earned {new Date(badge.unlockedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noBadgesContainer}>
                <Trophy size={48} color="#9CA3AF" />
                <Text style={styles.noBadgesTitle}>No achievements yet</Text>
                <Text style={styles.noBadgesText}>
                  Complete lessons and maintain streaks to earn badges!
                </Text>
              </View>
            )}

            <View style={styles.nextBadgeCard} testID="next-badge">
              <Text style={styles.subSectionTitle}>Next Badge Progress</Text>
              {(() => {
                const badgesCatalog = [
                  { id: 'first_chat', name: 'First Steps', requiredValue: 1, type: 'totalChats', icon: '🎯' },
                  { id: 'streak_3', name: '3-Day Streak', requiredValue: 3, type: 'streakDays', icon: '🔥' },
                  { id: 'streak_7', name: 'Week Warrior', requiredValue: 7, type: 'streakDays', icon: '⚡' },
                  { id: 'streak_30', name: 'Monthly Master', requiredValue: 30, type: 'streakDays', icon: '👑' },
                  { id: 'chats_50', name: 'Chatterbox', requiredValue: 50, type: 'totalChats', icon: '💬' },
                  { id: 'chats_100', name: 'Conversation King', requiredValue: 100, type: 'totalChats', icon: '🗣️' },
                  { id: 'words_100', name: 'Vocabulary Builder', requiredValue: 100, type: 'wordsLearned', icon: '📚' },
                ] as const;
                const earnedIds = new Set(userStats.badges.map(b => b.id));
                const pending = badgesCatalog.filter(b => !earnedIds.has(b.id));
                const next = pending[0];
                if (!next) {
                  return <Text style={styles.badgeDescription}>All badges unlocked. Fantastic!</Text>;
                }
                const currentValue = (userStats as any)[next.type] ?? 0;
                const pct = Math.min((currentValue / next.requiredValue) * 100, 100);
                return (
                  <View style={styles.nextBadgeRow}>
                    <Text style={styles.nextBadgeIcon}>{next.icon}</Text>
                    <View style={styles.nextBadgeDetails}>
                      <Text style={styles.badgeName}>{next.name}</Text>
                      <View style={styles.goalProgressBar}>
                        <View style={[styles.goalProgressFill, { width: `${pct}%`, backgroundColor: '#6366F1' }]} />
                      </View>
                      <Text style={styles.goalProgressText}>{currentValue}/{next.requiredValue}</Text>
                    </View>
                  </View>
                );
              })()}
            </View>

            <View style={styles.availableBadgesContainer}>
              <Text style={styles.sectionTitle}>Available Badges</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.availableBadgesList}>
                  {[
                    { icon: '🎯', name: 'First Steps', requirement: '1 chat' },
                    { icon: '🔥', name: '3-Day Streak', requirement: '3 days' },
                    { icon: '⚡', name: 'Week Warrior', requirement: '7 days' },
                    { icon: '👑', name: 'Monthly Master', requirement: '30 days' },
                    { icon: '💬', name: 'Chatterbox', requirement: '50 chats' },
                    { icon: '📚', name: 'Vocabulary Builder', requirement: '100 words' },
                  ].map((badge, index) => (
                    <View key={index} style={styles.availableBadgeCard}>
                      <Text style={styles.availableBadgeIcon}>{badge.icon}</Text>
                      <Text style={styles.availableBadgeName}>{badge.name}</Text>
                      <Text style={styles.availableBadgeRequirement}>{badge.requirement}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.languagesCard} testID="languages-card">
              <Text style={styles.subSectionTitle}>Languages</Text>
              <View style={styles.languagesRow}>
                <Globe size={18} color="#0EA5E9" />
                <Text style={styles.languageStatText}>Learning: {user.selectedLanguage ? 1 : 0}</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Friends Tab */}
        {selectedTab === 'friends' && (
          <View style={styles.friendsContainer}>
            <Text style={styles.sectionTitle}>Friends Activity</Text>
            
            <View style={styles.addFriendsCard}>
              <Users size={24} color="#8B5CF6" />
              <Text style={styles.addFriendsTitle}>Connect with Friends</Text>
              <Text style={styles.addFriendsText}>
                Add friends to compete and motivate each other!
              </Text>
              <TouchableOpacity style={styles.addFriendsButton}>
                <Text style={styles.addFriendsButtonText}>Find Friends</Text>
              </TouchableOpacity>
            </View>
            
            {friendsActivity.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <Text style={styles.activityAvatar}>{activity.avatar}</Text>
                
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityAction}>{activity.action}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                
                <View style={styles.activityXp}>
                  <Zap size={14} color="#F59E0B" />
                  <Text style={styles.activityXpText}>+{activity.xp}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* Leaderboard Tab */}
        {selectedTab === 'leaderboard' && (
          <View style={styles.leaderboardContainer}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <TouchableOpacity
                style={styles.filterToggle}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter size={20} color="#6B7280" />
                <ChevronDown size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Filters */}
            {showFilters && (
              <View style={styles.filtersContainer}>
                <Text style={styles.filterLabel}>Time Period:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <FilterButton title="All Time" value="all" isActive={filter === 'all'} />
                  <FilterButton title="This Week" value="weekly" isActive={filter === 'weekly'} />
                  <FilterButton title="This Month" value="monthly" isActive={filter === 'monthly'} />
                  <FilterButton title="Friends" value="friends" isActive={filter === 'friends'} />
                </ScrollView>
                
                <Text style={styles.filterLabel}>Sort By:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  <SortButton title="XP" value="xp" isActive={sortBy === 'xp'} />
                  <SortButton title="Streak" value="streak" isActive={sortBy === 'streak'} />
                  <SortButton title="Lessons" value="lessons" isActive={sortBy === 'lessons'} />
                  <SortButton title="Languages" value="languages" isActive={sortBy === 'languages'} />
                </ScrollView>
              </View>
            )}

            {/* Stats Overview */}
            <View style={styles.leaderboardStatsContainer}>
              <View style={styles.statCard}>
                <Trophy size={20} color="#10B981" />
                <Text style={styles.statNumber}>{user.stats?.xpPoints || 0}</Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
              <View style={styles.statCard}>
                <Zap size={20} color="#F59E0B" />
                <Text style={styles.statNumber}>{user.stats?.streakDays || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Award size={20} color="#8B5CF6" />
                <Text style={styles.statNumber}>{user.stats?.badges?.length || 0}</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
              <View style={styles.statCard}>
                <Target size={20} color="#EF4444" />
                <Text style={styles.statNumber}>{Math.floor((user.stats?.xpPoints || 0) / 1000) + 1}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
            </View>

            {/* Leaderboard */}
            <ScrollView
              style={styles.leaderboard}
              showsVerticalScrollIndicator={false}
            >
              {filteredData.map((userData, index) => {
                const currentRank = index + 1;
                const isCurrentUser = userData.id === user.id;
                const xpToShow = filter === 'weekly' ? userData.weeklyXP :
                                filter === 'monthly' ? userData.monthlyXP :
                                userData.totalXP;

                return (
                  <TouchableOpacity
                    key={userData.id}
                    style={[
                      styles.leaderboardItem,
                      isCurrentUser && styles.currentUserItem,
                      currentRank <= 3 && styles.topThreeItem,
                    ]}
                    onPress={() => userData?.name?.trim() && showUserDetails(userData)}
                  >
                    <View style={styles.rankContainer}>
                      {getRankIcon(currentRank)}
                    </View>

                    <View style={styles.avatarContainer}>
                      {userData.avatar ? (
                        <Image source={{ uri: userData.avatar }} style={styles.leaderboardAvatar} />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: getRankColor(currentRank) }]}>
                          <Text style={styles.leaderboardAvatarText}>
                            {userData.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {currentRank <= 3 && (
                        <View style={[styles.rankBadge, { backgroundColor: getRankColor(currentRank) }]}>
                          <Text style={styles.rankBadgeText}>{currentRank}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.userInfo}>
                      <View style={styles.userHeader}>
                        <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
                          {userData.name} {isCurrentUser && '(You)'}
                        </Text>
                        <Text style={styles.userLevel}>Level {userData.level}</Text>
                      </View>
                      
                      <View style={styles.userStats}>
                        <View style={styles.statItem}>
                          <Star size={14} color="#F59E0B" />
                          <Text style={styles.statText}>{xpToShow.toLocaleString()} XP</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Zap size={14} color="#10B981" />
                          <Text style={styles.statText}>{userData.streak} day streak</Text>
                        </View>
                      </View>
                      
                      <View style={styles.userAchievements}>
                        <Text style={styles.achievementText}>
                          {userData.languagesLearned.length} language{userData.languagesLearned.length !== 1 ? 's' : ''} •{' '}
                          {userData.badges.length} badge{userData.badges.length !== 1 ? 's' : ''} •{' '}
                          {userData.completedLessons} lessons
                        </Text>
                      </View>
                    </View>

                    <View style={styles.trendingContainer}>
                      <TrendingUp size={16} color="#10B981" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {!user.isPremium && (
          <View style={styles.premiumPromoContainer}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.premiumPromo}
            >
              <Crown size={32} color="#FFD700" />
              <Text style={styles.premiumPromoTitle}>Unlock Premium</Text>
              <Text style={styles.premiumPromoText}>
                • Unlimited lessons and exercises{"\n"}
                • Advanced AI coaching{"\n"}
                • Detailed progress analytics{"\n"}
                • Priority support
              </Text>
              <TouchableOpacity 
                style={styles.premiumPromoButton}
                onPress={() => setShowUpgradeModal(true)}
              >
                <Sparkles size={16} color="#8B5CF6" />
                <Text style={styles.premiumPromoButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Quick Stats Summary */}
        <View style={styles.quickStatsContainer}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatItem}>
              <Calendar size={20} color="#3B82F6" />
              <Text style={styles.quickStatValue}>12</Text>
              <Text style={styles.quickStatLabel}>Days Active</Text>
            </View>
            
            <View style={styles.quickStatItem}>
              <Clock size={20} color="#10B981" />
              <Text style={styles.quickStatValue}>2.5h</Text>
              <Text style={styles.quickStatLabel}>Study Time</Text>
            </View>
            
            <View style={styles.quickStatItem}>
              <Award size={20} color="#F59E0B" />
              <Text style={styles.quickStatValue}>85%</Text>
              <Text style={styles.quickStatLabel}>Accuracy</Text>
            </View>
            
            <View style={styles.quickStatItem}>
              <Target size={20} color="#8B5CF6" />
              <Text style={styles.quickStatValue}>#8</Text>
              <Text style={styles.quickStatLabel}>Rank</Text>
            </View>
          </View>
        </View>

        {/* Personal Journal */}
        <View style={styles.journalContainer} testID="journal-container">
          <View style={styles.journalHeader}>
            <View style={styles.journalTitleRow}>
              <Quote size={18} color="#111827" />
              <Text style={styles.journalTitle}>Personal Journal</Text>
              <History size={16} color="#6B7280" />
            </View>
            <Text style={styles.journalSubtitle}>Reflect on what you learned today. Entries are saved privately on this device.</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.journalChipsRow}>
            {suggestionChips.map((s, idx) => (
              <TouchableOpacity
                key={`${idx}-${s.slice(0,10)}`}
                style={styles.chip}
                onPress={() => appendSuggestion(s)}
                testID={`journal-chip-${idx}`}
              >
                <Lightbulb size={14} color="#0EA5E9" />
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.journalEditor}>
            <TextInput
              style={styles.journalInput}
              placeholder="What did you practice, discover, or struggle with today?"
              multiline
              value={journalDraft}
              onChangeText={setJournalDraft}
              editable={!journalSaving}
              testID="journal-input"
            />
            <TouchableOpacity 
              style={[styles.saveButton, journalSaving && styles.saveButtonDisabled]}
              onPress={saveJournalEntry}
              disabled={journalSaving}
              testID="journal-save-button"
            >
              <Save size={16} color="white" />
              <Text style={styles.saveButtonText}>{journalSaving ? 'Saving…' : 'Save Entry'}</Text>
            </TouchableOpacity>
          </View>

          {journal.length > 0 && (
            <View style={styles.entriesList} testID="journal-entries">
              {journal.slice(0, 5).map((entry) => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryHeaderLeft}>
                      <Calendar size={14} color="#6B7280" />
                      <Text style={styles.entryDate}>{new Date(entry.createdAt).toLocaleString()}</Text>
                      {!!entry.languageCode && (
                        <Text style={styles.entryLangTag}>{LANGUAGES.find(l => l.code === entry.languageCode)?.flag} {LANGUAGES.find(l => l.code === entry.languageCode)?.name}</Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => removeEntry(entry.id)} accessibilityRole="button" testID={`delete-entry-${entry.id}`}>
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.entryText}>{entry.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        reason="feature"
      />
      
      {/* User Details Modal */}
      <Modal
        visible={showUserModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedUser?.name}</Text>
              <TouchableOpacity
                onPress={() => setShowUserModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedUser && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Level</Text>
                    <Text style={styles.modalStatValue}>{selectedUser.level}</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Total XP</Text>
                    <Text style={styles.modalStatValue}>{selectedUser.totalXP.toLocaleString()}</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Streak</Text>
                    <Text style={styles.modalStatValue}>{selectedUser.streak} days</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Lessons</Text>
                    <Text style={styles.modalStatValue}>{selectedUser.completedLessons}</Text>
                  </View>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Languages Learning</Text>
                  <Text style={styles.modalSectionContent}>
                    {selectedUser.languagesLearned.join(', ') || 'None'}
                  </Text>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Achievements</Text>
                  <Text style={styles.modalSectionContent}>
                    {selectedUser.achievements.join(', ') || 'None'}
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  authScrollContainer: {
    flexGrow: 1,
  },
  authHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  authHeaderContent: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  authHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  authHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  authFormContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  authForm: {
    padding: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  socialAuthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButton: {
    borderColor: '#4285F4',
  },
  facebookButton: {
    borderColor: '#1877F2',
  },
  appleButton: {
    borderColor: '#000',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  submitButtonIcon: {
    marginLeft: 8,
  },
  switchAuthContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  switchAuthText: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchAuthLink: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  featuresContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signOutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signOutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  premiumBadge: {
    marginTop: 8,
  },
  premiumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  premiumText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  badgesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  badgesList: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  badgeCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  premiumPromoContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  premiumPromo: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  premiumPromoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  premiumPromoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumPromoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  premiumPromoButtonText: {
    color: '#8B5CF6',
    fontWeight: '600',
    marginLeft: 4,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  languageFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  languageName: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: '#F0FDF4',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#10B981',
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statChangeText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  goalsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 8,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalProgressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  goalCompleted: {
    marginLeft: 8,
  },
  achievementsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeDate: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  streakTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  streakValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  streakBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakDot: {
    height: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 2,
  },
  streakDotFilled: {
    backgroundColor: '#F59E0B',
  },
  streakDotEmpty: {
    backgroundColor: '#E5E7EB',
  },
  sectionBlock: {
    marginTop: 8,
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  typeMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  nextBadgeCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  nextBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextBadgeIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  nextBadgeDetails: {
    flex: 1,
  },
  languagesCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  languagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageStatText: {
    marginLeft: 8,
    color: '#374151',
    fontWeight: '600',
  },
  noBadgesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noBadgesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  noBadgesText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  availableBadgesContainer: {
    marginTop: 24,
  },
  availableBadgesList: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  availableBadgeCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 100,
  },
  availableBadgeIcon: {
    fontSize: 24,
    marginBottom: 8,
    opacity: 0.5,
  },
  availableBadgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  availableBadgeRequirement: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  friendsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  addFriendsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addFriendsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  addFriendsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  addFriendsButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addFriendsButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityAvatar: {
    fontSize: 20,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityAction: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  activityXp: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityXpText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 2,
  },
  quickStatsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStatItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  journalContainer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  journalHeader: {
    marginBottom: 12,
  },
  journalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 8,
  },
  journalSubtitle: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 12,
  },
  journalChipsRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  journalEditor: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  journalInput: {
    minHeight: 90,
    maxHeight: 160,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#111827',
    padding: 8,
  },
  saveButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
    marginLeft: 6,
  },
  entriesList: {
    marginTop: 16,
    gap: 10,
  },
  entryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  entryDate: {
    color: '#6B7280',
    fontSize: 12,
  },
  entryLangTag: {
    marginLeft: 6,
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  entryText: {
    color: '#111827',
    fontSize: 14,
    lineHeight: 20,
  },
  // Leaderboard styles
  leaderboardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  sortButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  leaderboardStatsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  leaderboard: {
    flex: 1,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currentUserItem: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  topThreeItem: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  leaderboardAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  rankBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  currentUserName: {
    color: '#10B981',
  },
  userLevel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  userAchievements: {
    marginTop: 2,
  },
  achievementText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  trendingContainer: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  modalStatItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSectionContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});