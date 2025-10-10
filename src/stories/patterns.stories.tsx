import type { Meta, StoryObj } from '@storybook/react-native';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SettingsProvider, useSettings } from '../patterns/context/SettingsContext';
import { AudioEngineProvider, useAudioEngine } from '../patterns/context/AudioEngineContext';
import { useExpensiveCalc } from '../patterns/memo/useExpensiveCalc';
import { Deferred, MouseTracker, InputTracker, DebouncedValue } from '../patterns/render-props/Deferred';
import { withAnalytics, withLogger, useComponentLogger } from '../patterns/hoc/withAnalytics';
import { LazyScreenWrapper, LoadingView } from '../patterns/lazy/lazyScreens';

// Settings Context Story
function SettingsDemo() {
  const { settings, setTheme, setDifficulty, setVoiceId } = useSettings();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings Context Demo</Text>
      <Text style={styles.info}>Current Theme: {settings.theme}</Text>
      <Text style={styles.info}>Current Difficulty: {settings.difficulty}</Text>
      <Text style={styles.info}>Current Voice: {settings.voiceId}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => setTheme(settings.theme === 'light' ? 'dark' : 'light')}
        >
          <Text style={styles.buttonText}>Toggle Theme</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => setDifficulty(settings.difficulty === 'beginner' ? 'intermediate' : 'beginner')}
        >
          <Text style={styles.buttonText}>Toggle Difficulty</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const SettingsStory: Meta<typeof SettingsDemo> = {
  title: 'Patterns/Context/Settings',
  component: SettingsDemo,
  decorators: [
    (Story) => (
      <SettingsProvider>
        <Story />
      </SettingsProvider>
    ),
  ],
};

// Audio Engine Context Story
function AudioEngineDemo() {
  const { engine, isSpeaking, error, setProvider } = useAudioEngine();
  const [text, setText] = useState('Hello, this is a test of the audio engine!');

  const handleSpeak = async () => {
    try {
      await engine.speak(text);
    } catch (err) {
      console.error('Speech error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Engine Context Demo</Text>
      <Text style={styles.info}>Speaking: {isSpeaking ? 'Yes' : 'No'}</Text>
      {error && <Text style={styles.error}>Error: {error}</Text>}
      
      <TextInput
        style={styles.textInput}
        value={text}
        onChangeText={setText}
        placeholder="Enter text to speak"
        multiline
      />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSpeak}>
          <Text style={styles.buttonText}>Speak</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => setProvider('expo')}
        >
          <Text style={styles.buttonText}>Use Expo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const AudioEngineStory: Meta<typeof AudioEngineDemo> = {
  title: 'Patterns/Context/AudioEngine',
  component: AudioEngineDemo,
  decorators: [
    (Story) => (
      <AudioEngineProvider>
        <Story />
      </AudioEngineProvider>
    ),
  ],
};

// Expensive Calculations Story
function ExpensiveCalcDemo() {
  const { scorePronunciation, analyzeVocabulary, tokenizeSentence } = useExpensiveCalc();
  const [expected, setExpected] = useState('Hello world');
  const [actual, setActual] = useState('Hello word');
  const [text, setText] = useState('The quick brown fox jumps over the lazy dog');

  const pronunciationScore = scorePronunciation(expected, actual);
  const vocabularyAnalysis = analyzeVocabulary(text);
  const tokenized = tokenizeSentence(text);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expensive Calculations Demo</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pronunciation Scoring</Text>
        <TextInput
          style={styles.textInput}
          value={expected}
          onChangeText={setExpected}
          placeholder="Expected text"
        />
        <TextInput
          style={styles.textInput}
          value={actual}
          onChangeText={setActual}
          placeholder="Actual text"
        />
        <Text style={styles.info}>Score: {pronunciationScore.score.toFixed(2)}</Text>
        <Text style={styles.info}>Accuracy: {pronunciationScore.accuracy}%</Text>
        <Text style={styles.info}>Feedback: {pronunciationScore.feedback}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vocabulary Analysis</Text>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Enter text to analyze"
          multiline
        />
        <Text style={styles.info}>Total Words: {vocabularyAnalysis.totalWords}</Text>
        <Text style={styles.info}>Unique Words: {vocabularyAnalysis.uniqueWords}</Text>
        <Text style={styles.info}>Difficulty: {vocabularyAnalysis.difficulty}</Text>
      </View>
    </View>
  );
}

const ExpensiveCalcStory: Meta<typeof ExpensiveCalcDemo> = {
  title: 'Patterns/Memo/ExpensiveCalc',
  component: ExpensiveCalcDemo,
};

// Render Props Story
function RenderPropsDemo() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Render Props Demo</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deferred Rendering</Text>
        <Deferred delay={1000}>
          {(isVisible) => (
            <Text style={styles.info}>
              {isVisible ? 'This text appeared after 1 second!' : 'Loading...'}
            </Text>
          )}
        </Deferred>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debounced Search</Text>
        <TextInput
          style={styles.textInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Type to search..."
        />
        <DebouncedValue value={searchTerm} delay={500}>
          {(debouncedValue, isDebouncing) => (
            <Text style={styles.info}>
              Search term: {debouncedValue} {isDebouncing && '(debouncing...)'}
            </Text>
          )}
        </DebouncedValue>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mouse Tracker</Text>
        <MouseTracker>
          {({ x, y, isActive, deltaX, deltaY }) => (
            <View style={styles.trackerContainer}>
              <Text style={styles.info}>Active: {isActive ? 'Yes' : 'No'}</Text>
              <Text style={styles.info}>Position: ({x}, {y})</Text>
              <Text style={styles.info}>Delta: ({deltaX}, {deltaY})</Text>
            </View>
          )}
        </MouseTracker>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Input Tracker</Text>
        <InputTracker idleTimeout={2000}>
          {({ isTyping, inputCount, isIdle }) => (
            <View>
              <TextInput
                style={styles.textInput}
                placeholder="Type here to test input tracking..."
              />
              <Text style={styles.info}>Typing: {isTyping ? 'Yes' : 'No'}</Text>
              <Text style={styles.info}>Input Count: {inputCount}</Text>
              <Text style={styles.info}>Idle: {isIdle ? 'Yes' : 'No'}</Text>
            </View>
          )}
        </InputTracker>
      </View>
    </View>
  );
}

const RenderPropsStory: Meta<typeof RenderPropsDemo> = {
  title: 'Patterns/RenderProps',
  component: RenderPropsDemo,
};

// HOC Story
function HOCDemo() {
  const logger = useComponentLogger('HOCDemo');
  const [count, setCount] = useState(0);

  React.useEffect(() => {
    logger.logEffect('count-change', [count]);
  }, [count, logger]);

  const handleIncrement = () => {
    logger.logCallback('increment', count);
    setCount(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HOC Demo</Text>
      <Text style={styles.info}>Count: {count}</Text>
      <TouchableOpacity style={styles.button} onPress={handleIncrement}>
        <Text style={styles.buttonText}>Increment</Text>
      </TouchableOpacity>
    </View>
  );
}

const HOCStory: Meta<typeof HOCDemo> = {
  title: 'Patterns/HOC',
  component: withLogger(withAnalytics(HOCDemo, {
    trackScreenView: true,
    trackUserInteractions: true,
  }), {
    logLifecycle: true,
    logProps: true,
  }),
};

// Lazy Loading Story
function LazyLoadingDemo() {
  const [showLazyComponent, setShowLazyComponent] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lazy Loading Demo</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setShowLazyComponent(!showLazyComponent)}
      >
        <Text style={styles.buttonText}>
          {showLazyComponent ? 'Hide' : 'Show'} Lazy Component
        </Text>
      </TouchableOpacity>

      {showLazyComponent && (
        <LazyScreenWrapper fallback={<LoadingView message="Loading lazy component..." />}>
          <View style={styles.lazyComponent}>
            <Text style={styles.info}>This is a lazy-loaded component!</Text>
            <Text style={styles.info}>It was loaded on demand.</Text>
          </View>
        </LazyScreenWrapper>
      )}
    </View>
  );
}

const LazyLoadingStory: Meta<typeof LazyLoadingDemo> = {
  title: 'Patterns/LazyLoading',
  component: LazyLoadingDemo,
};

// Export all stories
export const Settings: StoryObj<typeof SettingsDemo> = {};
export const AudioEngine: StoryObj<typeof AudioEngineDemo> = {};
export const ExpensiveCalc: StoryObj<typeof ExpensiveCalcDemo> = {};
export const RenderProps: StoryObj<typeof RenderPropsDemo> = {};
export const HOC: StoryObj<typeof HOCDemo> = {};
export const LazyLoading: StoryObj<typeof LazyLoadingDemo> = {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  info: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  error: {
    fontSize: 14,
    marginBottom: 5,
    color: '#f44336',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  button: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  trackerContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  lazyComponent: {
    padding: 20,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    marginTop: 15,
  },
});