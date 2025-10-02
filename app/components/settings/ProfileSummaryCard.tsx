import React, { memo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface Props {
  displayName: string;
  avatarUri?: string;
  personas?: string[];
}

function ProfileSummaryCardBase({ displayName, avatarUri, personas = [] }: Props) {
  return (
    <View style={styles.card} testID="profile-summary-card">
      <Image
        source={{ uri: avatarUri ?? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&auto=format&fit=crop&q=60' }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.personas} numberOfLines={1}>
          {personas.join(' · ')}
        </Text>
      </View>
    </View>
  );
}

export default memo(ProfileSummaryCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: { width: 48, height: 48, borderRadius: 12, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  personas: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});