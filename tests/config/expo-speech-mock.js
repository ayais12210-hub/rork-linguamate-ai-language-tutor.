// Mock Expo Speech for Jest tests
module.exports = {
  speak: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  pause: jest.fn(() => Promise.resolve()),
  resume: jest.fn(() => Promise.resolve()),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([
    {
      identifier: 'com.apple.voice.compact.en-US.Samantha',
      name: 'Samantha',
      language: 'en-US',
      quality: 'default',
    },
  ])),
  setDefaultLanguageAsync: jest.fn(() => Promise.resolve()),
  getDefaultLanguageAsync: jest.fn(() => Promise.resolve('en-US')),
  getSupportedLanguagesAsync: jest.fn(() => Promise.resolve(['en-US', 'en-GB', 'es-ES'])),
  getVoicesAsync: jest.fn(() => Promise.resolve([
    {
      identifier: 'com.apple.voice.compact.en-US.Samantha',
      name: 'Samantha',
      language: 'en-US',
      quality: 'default',
    },
  ])),
  getStatusAsync: jest.fn(() => Promise.resolve({
    isSpeaking: false,
    isPaused: false,
    language: 'en-US',
    pitch: 1.0,
    rate: 1.0,
    volume: 1.0,
  })),
  setOnSpeechStart: jest.fn(),
  setOnSpeechEnd: jest.fn(),
  setOnSpeechError: jest.fn(),
  setOnSpeechPause: jest.fn(),
  setOnSpeechResume: jest.fn(),
};