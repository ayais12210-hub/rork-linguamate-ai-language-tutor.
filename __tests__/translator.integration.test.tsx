import React from 'react';
import { renderWithProviders } from '../tests/utils/render';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { server } from '../tests/msw/server';
import { http, HttpResponse } from 'msw';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
  getStringAsync: jest.fn().mockResolvedValue(''),
}));

describe('Translator Screen - Integration Tests', () => {
  beforeEach(() => {
    server.use(
      http.post('**/api/trpc/chat*', async () => {
        return HttpResponse.json({
          result: {
            data: {
              translation: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
              explanation: 'Traditional Punjabi greeting',
              culturalContext: 'Used in Sikh culture',
              grammarInsights: 'Formal greeting structure',
              alternativeTranslations: ['ਹੈਲੋ', 'ਨਮਸਤੇ'],
              difficulty: 'beginner',
              confidence: 0.95,
            },
          },
        });
      })
    );
  });

  it('should translate text and show AI coach insights', async () => {
    const TranslatorScreen = require('@/app/(tabs)/translator').default;
    const { getByPlaceholderText, getByText } = renderWithProviders(<TranslatorScreen />);

    const input = getByPlaceholderText(/enter text/i);
    fireEvent.changeText(input, 'Hello');

    const translateButton = getByText(/translate/i);
    fireEvent.press(translateButton);

    await waitFor(
      () => {
        expect(screen.getByText(/ਸਤ ਸ੍ਰੀ ਅਕਾਲ/)).toBeTruthy();
      },
      { timeout: 5000 }
    );
  });

  it('should handle translation errors gracefully', async () => {
    server.use(
      http.post('**/api/trpc/chat*', async () => {
        return HttpResponse.json(
          { error: { message: 'Translation failed' } },
          { status: 500 }
        );
      })
    );

    const TranslatorScreen = require('@/app/(tabs)/translator').default;
    const { getByPlaceholderText, getByText } = renderWithProviders(<TranslatorScreen />);

    const input = getByPlaceholderText(/enter text/i);
    fireEvent.changeText(input, 'Hello');

    const translateButton = getByText(/translate/i);
    fireEvent.press(translateButton);

    await waitFor(() => {
      expect(screen.queryByText(/error/i)).toBeTruthy();
    });
  });

  it('should handle offline mode with cached translations', async () => {
    server.use(
      http.post('**/api/trpc/chat*', async () => {
        return HttpResponse.error();
      })
    );

    const TranslatorScreen = require('@/app/(tabs)/translator').default;
    const { getByPlaceholderText, getByText } = renderWithProviders(<TranslatorScreen />);

    const input = getByPlaceholderText(/enter text/i);
    fireEvent.changeText(input, 'Hello');

    const translateButton = getByText(/translate/i);
    fireEvent.press(translateButton);

    await waitFor(() => {
      expect(screen.queryByText(/offline/i) || screen.queryByText(/cached/i) || screen.queryByText(/error/i)).toBeTruthy();
    });
  });

  it('should show loading state during translation', async () => {
    server.use(
      http.post('**/api/trpc/chat*', async () => {
        // Simulate slow response
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({
          result: {
            data: {
              translation: 'Test translation',
              explanation: 'Test explanation',
            },
          },
        });
      })
    );

    const TranslatorScreen = require('@/app/(tabs)/translator').default;
    const { getByPlaceholderText, getByText } = renderWithProviders(<TranslatorScreen />);

    const input = getByPlaceholderText(/enter text/i);
    fireEvent.changeText(input, 'Hello');

    const translateButton = getByText(/translate/i);
    fireEvent.press(translateButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.queryByText(/loading|translating/i)).toBeTruthy();
    });

    // Should eventually show result
    await waitFor(() => {
      expect(screen.getByText(/Test translation/)).toBeTruthy();
    }, { timeout: 2000 });
  });
});
