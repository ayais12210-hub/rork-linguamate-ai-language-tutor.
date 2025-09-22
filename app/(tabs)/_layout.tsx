import { Tabs, useRouter } from 'expo-router';
import { BookOpen, Settings, Layers, GraduationCap } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

export default function TabLayout() {
  const router = useRouter();

  const SettingsButton = () => (
    <TouchableOpacity
      onPress={() => router.push('/settings')}
      style={styles.settingsButton}
    >
      <Settings size={24} color="#6B7280" />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: true,
        headerStyle: {
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1F2937',
        },
        headerRight: () => <SettingsButton />,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          headerTitle: 'Learn',
          tabBarIcon: ({ color, size }) => <GraduationCap size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          title: 'Lessons',
          headerTitle: 'Lessons',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          title: 'Modules',
          headerTitle: 'Advanced Modules',
          tabBarIcon: ({ color, size }) => <Layers size={size} color={color} />,
        }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    marginRight: 16,
  },
});