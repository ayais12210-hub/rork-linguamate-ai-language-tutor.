import React from 'react';
import { View, StyleSheet } from 'react-native';
import TutorDataFetcher from '@/components/TutorDataFetcher';

export default function TutorDataPage() {
  const handleDataFetched = (data: any) => {
    console.log('Tutor data fetched:', data);
  };

  const handleError = (error: Error) => {
    console.error('Tutor data fetch error:', error);
  };

  return (
    <View style={styles.container}>
      <TutorDataFetcher
        initialUrl="https://linguamate-ai-language-tutor-1yzk6my-76pccekj-lg0fppmq.rork.app"
        onDataFetched={handleDataFetched}
        onError={handleError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});