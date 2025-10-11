import type { Preview } from '@storybook/react-native';
import { SettingsProvider } from '../src/patterns/context/SettingsContext';
import { AudioEngineProvider } from '../src/patterns/context/AudioEngineContext';
import { AnalyticsProvider } from '../src/patterns/hoc/withAnalytics';
import { LoggerProvider } from '../src/patterns/hoc/withLogger';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <LoggerProvider>
        <AnalyticsProvider>
          <SettingsProvider>
            <AudioEngineProvider>
              <Story />
            </AudioEngineProvider>
          </SettingsProvider>
        </AnalyticsProvider>
      </LoggerProvider>
    ),
  ],
};

export default preview;