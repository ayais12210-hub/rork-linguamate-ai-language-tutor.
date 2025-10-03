import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../tests/utils/render';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
  getStringAsync: jest.fn().mockResolvedValue(''),
}));

jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      startAsync: jest.fn().mockResolvedValue(undefined),
      stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
      getURI: jest.fn().mockReturnValue('file://recording.m4a'),
    })),
  },
}));

describe('Translator Screen - Unit Tests', () => {
  it('should render input field and translate button', () => {
    const TranslatorScreen = require('@/app/(tabs)/translator').default;
    renderWithProviders(<TranslatorScreen />);

    expect(screen.getByPlaceholderText(/enter text/i)).toBeTruthy();
    expect(screen.getByText(/translate/i)).toBeTruthy();
  });

  it('should enable translate button when text is entered', async () => {
    const TranslatorScreen = require('@/app/(tabs)/translator').default;
    const { getByPlaceholderText, getByText } = renderWithProviders(<TranslatorScreen />);

    const input = getByPlaceholderText(/enter text/i);
    fireEvent.changeText(input, 'Hello');

    await waitFor(() => {
      const translateButton = getByText(/translate/i);
      expect(translateButton).toBeTruthy();
    });
  });

  it('should show copy and paste buttons', () => {
    const TranslatorScreen = require('@/app/(tabs)/translator').default;
    const { getAllByLabelText } = renderWithProviders(<TranslatorScreen />);

    const copyButtons = getAllByLabelText(/copy/i);
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('should show clear button when text is present', async () => {
    const TranslatorScreen = require('@/app/(tabs)/translator').default;
    const { getByPlaceholderText, getByText } = renderWithProviders(<TranslatorScreen />);

    const input = getByPlaceholderText(/enter text/i);
    fireEvent.changeText(input, 'Test text');

    await waitFor(() => {
      expect(getByText(/clear/i)).toBeTruthy();
    });
  });

  it('should clear text when clear button is pressed', async () => {
    const TranslatorScreen = require('@/app/(tabs)/translator').default;
    const { getByPlaceholderText, getByText } = renderWithProviders(<TranslatorScreen />);

    const input = getByPlaceholderText(/enter text/i);
    fireEvent.changeText(input, 'Test text');

    await waitFor(() => {
      const clearButton = getByText(/clear/i);
      fireEvent.press(clearButton);
    });

    await waitFor(() => {
      expect(input.props.value).toBe('');
    });
  });

  it('should show speech-to-text button', () => {
    const TranslatorScreen = require('@/app/(tabs)/translator').default;
    const { getByLabelText } = renderWithProviders(<TranslatorScreen />);

    expect(getByLabelText(/speech to text/i)).toBeTruthy();
  });
});
