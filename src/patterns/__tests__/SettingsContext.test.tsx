import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { SettingsProvider, useSettings } from '../context/SettingsContext';

// Test component that uses the settings context
function TestComponent() {
  const { settings, setTheme, setDifficulty, setVoiceId, resetSettings } = useSettings();

  return (
    <div>
      <div data-testid="theme">{settings.theme}</div>
      <div data-testid="difficulty">{settings.difficulty}</div>
      <div data-testid="voiceId">{settings.voiceId}</div>
      <button data-testid="set-theme" onClick={() => setTheme('dark')}>
        Set Dark Theme
      </button>
      <button data-testid="set-difficulty" onClick={() => setDifficulty('advanced')}>
        Set Advanced
      </button>
      <button data-testid="set-voice" onClick={() => setVoiceId('custom-voice')}>
        Set Custom Voice
      </button>
      <button data-testid="reset" onClick={resetSettings}>
        Reset
      </button>
    </div>
  );
}

describe('SettingsContext', () => {
  it('should provide default settings', () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('system');
    expect(screen.getByTestId('difficulty')).toHaveTextContent('beginner');
    expect(screen.getByTestId('voiceId')).toHaveTextContent('default');
  });

  it('should update theme when setTheme is called', async () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    fireEvent.press(screen.getByTestId('set-theme'));
    
    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });
  });

  it('should update difficulty when setDifficulty is called', async () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    fireEvent.press(screen.getByTestId('set-difficulty'));
    
    await waitFor(() => {
      expect(screen.getByTestId('difficulty')).toHaveTextContent('advanced');
    });
  });

  it('should update voiceId when setVoiceId is called', async () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    fireEvent.press(screen.getByTestId('set-voice'));
    
    await waitFor(() => {
      expect(screen.getByTestId('voiceId')).toHaveTextContent('custom-voice');
    });
  });

  it('should reset settings when resetSettings is called', async () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // First change some settings
    fireEvent.press(screen.getByTestId('set-theme'));
    fireEvent.press(screen.getByTestId('set-difficulty'));
    
    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('difficulty')).toHaveTextContent('advanced');
    });

    // Then reset
    fireEvent.press(screen.getByTestId('reset'));
    
    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
      expect(screen.getByTestId('difficulty')).toHaveTextContent('beginner');
    });
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSettings must be used within a SettingsProvider');
    
    consoleSpy.mockRestore();
  });

  it('should accept initial settings', () => {
    render(
      <SettingsProvider initialSettings={{ theme: 'dark', difficulty: 'advanced' }}>
        <TestComponent />
      </SettingsProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('difficulty')).toHaveTextContent('advanced');
  });
});