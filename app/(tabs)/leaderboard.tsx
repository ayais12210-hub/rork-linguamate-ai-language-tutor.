import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import {
  Trophy,
  Medal,
  Crown,
  Search,
  Star,
  Award,
  Target,
  Zap,
  TrendingUp,
  Filter,
  ChevronDown,
  X,
} from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';
import { Badge } from '@/types/user';

interface LeaderboardUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  totalXP: number;
  streak: number;
  languagesLearned: string[];
  badges: Badge[];
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

export default function LeaderboardScreen() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<LeaderboardFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('xp');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);

  // Mock data for demonstration - in real app this would come from backend
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

  return (
    <View style={styles.container}>
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
      <View style={styles.statsContainer}>
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
                  <Image source={{ uri: userData.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: getRankColor(currentRank) }]}>
                    <Text style={styles.avatarText}>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  leaderboard: {
    flex: 1,
    paddingHorizontal: 16,
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
  avatar: {
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
  avatarText: {
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
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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