import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Turn } from '@/schemas/dialogue.schema';

type Props = {
  turn: Turn;
  onPlayAudio?: () => void;
  testID?: string;
};

export default function TurnBubble({ turn, onPlayAudio, testID }: Props) {
  const isUser = turn.role === 'user';
  const isCoach = turn.role === 'coach';
  const isSystem = turn.role === 'system';

  return (
    <View
      style={[
        styles.container,
        isUser && styles.userContainer,
        isSystem && styles.systemContainer,
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.bubble,
          isUser && styles.userBubble,
          isCoach && styles.coachBubble,
          isSystem && styles.systemBubble,
        ]}
      >
        {!isUser && !isSystem && (
          <Text style={styles.role}>
            {turn.role === 'npc' ? '🗣️ NPC' : '🎓 Coach'}
          </Text>
        )}
        <Text style={[styles.text, isUser && styles.userText]}>{turn.text}</Text>
        {turn.audioUrl && onPlayAudio && (
          <TouchableOpacity
            onPress={onPlayAudio}
            style={styles.audioButton}
            accessibilityLabel="Play audio"
            accessibilityRole="button"
          >
            <Text style={styles.audioIcon}>🔊</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  systemContainer: {
    alignItems: 'center',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  coachBubble: {
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  systemBubble: {
    backgroundColor: '#E8E8E8',
    maxWidth: '90%',
  },
  role: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
  },
  userText: {
    color: '#FFF',
  },
  audioButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  audioIcon: {
    fontSize: 18,
  },
});
