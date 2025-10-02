import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';

type Props = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  testID?: string;
};

export default function LanguageSearchBar({
  value,
  onChange,
  placeholder = 'Search by name or code (e.g., en, pa)',
  autoFocus,
  testID = 'language-search',
}: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const id = setTimeout(() => onChange(draft), 200);
    return () => clearTimeout(id);
  }, [draft, onChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔎</Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={styles.input}
        returnKeyType="search"
        accessibilityLabel="Search languages"
        testID={testID}
        placeholderTextColor="#9CA3AF"
      />
      {draft?.length ? (
        <TouchableOpacity
          onPress={() => setDraft('')}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <Text style={styles.clear}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  icon: {
    marginRight: 8,
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
    color: '#1F2937',
  },
  clear: {
    marginLeft: 8,
    opacity: 0.6,
    fontSize: 16,
    color: '#6B7280',
  },
});
