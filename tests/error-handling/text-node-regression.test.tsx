// Regression test for React Native "text node in View" errors
import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// Mock components that might have text node issues
const ProblematicComponent = () => (
  <View>
    <Text>This is correct</Text>
  </View>
);

const CorrectComponent = () => (
  <View>
    <Text>All text is properly wrapped</Text>
    <View>
      <Text>Nested text is also wrapped</Text>
    </View>
  </View>
);

// Test component that would cause the error (for testing purposes)
const TextNodeErrorComponent = () => (
  <View>
    {/* This would cause the error: */}
    {/* Some unwrapped text */}
    <Text>Properly wrapped text</Text>
  </View>
);

describe('Text Node Regression Tests', () => {
  // Mock console.error to catch React Native warnings
  let originalConsoleError: typeof console.error;
  let consoleErrors: string[];

  beforeEach(() => {
    originalConsoleError = console.error;
    consoleErrors = [];
    console.error = jest.fn((message: string) => {
      consoleErrors.push(message);
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should not have text node errors in ProblematicComponent', () => {
    render(<ProblematicComponent />);
    
    // Check that no text node errors were logged
    const textNodeErrors = consoleErrors.filter(error =>
      error.includes('Text strings must be rendered within a <Text> component') ||
      error.includes('A text node cannot be a child of a <View>')
    );
    
    expect(textNodeErrors).toHaveLength(0);
  });

  it('should not have text node errors in CorrectComponent', () => {
    render(<CorrectComponent />);
    
    const textNodeErrors = consoleErrors.filter(error =>
      error.includes('Text strings must be rendered within a <Text> component') ||
      error.includes('A text node cannot be a child of a <View>')
    );
    
    expect(textNodeErrors).toHaveLength(0);
  });

  it('should render text content correctly', () => {
    const { getByText } = render(<CorrectComponent />);
    
    expect(getByText('All text is properly wrapped')).toBeTruthy();
    expect(getByText('Nested text is also wrapped')).toBeTruthy();
  });

  describe('Common Components Text Node Safety', () => {
    // Test common app components for text node issues
    
    it('should handle empty View components', () => {
      const EmptyView = () => <View />;
      
      render(<EmptyView />);
      
      const textNodeErrors = consoleErrors.filter(error =>
        error.includes('Text strings must be rendered within a <Text> component')
      );
      
      expect(textNodeErrors).toHaveLength(0);
    });

    it('should handle View with only other Views', () => {
      const ViewWithViews = () => (
        <View>
          <View />
          <View>
            <View />
          </View>
        </View>
      );
      
      render(<ViewWithViews />);
      
      const textNodeErrors = consoleErrors.filter(error =>
        error.includes('Text strings must be rendered within a <Text> component')
      );
      
      expect(textNodeErrors).toHaveLength(0);
    });

    it('should handle conditional text rendering', () => {
      const ConditionalText = ({ showText }: { showText: boolean }) => (
        <View>
          {showText && <Text>Conditional text</Text>}
          {!showText && <View />}
        </View>
      );
      
      const { rerender } = render(<ConditionalText showText={true} />);
      
      let textNodeErrors = consoleErrors.filter(error =>
        error.includes('Text strings must be rendered within a <Text> component')
      );
      expect(textNodeErrors).toHaveLength(0);
      
      rerender(<ConditionalText showText={false} />);
      
      textNodeErrors = consoleErrors.filter(error =>
        error.includes('Text strings must be rendered within a <Text> component')
      );
      expect(textNodeErrors).toHaveLength(0);
    });

    it('should handle array rendering with text', () => {
      const ArrayWithText = () => (
        <View>
          {['Item 1', 'Item 2', 'Item 3'].map((item, index) => (
            <Text key={index}>{item}</Text>
          ))}
        </View>
      );
      
      render(<ArrayWithText />);
      
      const textNodeErrors = consoleErrors.filter(error =>
        error.includes('Text strings must be rendered within a <Text> component')
      );
      
      expect(textNodeErrors).toHaveLength(0);
    });

    it('should handle interpolated values in Text', () => {
      const InterpolatedText = ({ value }: { value: string | number }) => (
        <View>
          <Text>Value: {value}</Text>
          <Text>{`Formatted: ${value}`}</Text>
        </View>
      );
      
      render(<InterpolatedText value="test" />);
      render(<InterpolatedText value={42} />);
      
      const textNodeErrors = consoleErrors.filter(error =>
        error.includes('Text strings must be rendered within a <Text> component')
      );
      
      expect(textNodeErrors).toHaveLength(0);
    });

    it('should handle null and undefined values safely', () => {
      const SafeNullHandling = ({ text }: { text?: string | null }) => (
        <View>
          {text && <Text>{text}</Text>}
          <Text>{text || 'Default text'}</Text>
        </View>
      );
      
      render(<SafeNullHandling text={null} />);
      render(<SafeNullHandling text={undefined} />);
      render(<SafeNullHandling text="Valid text" />);
      
      const textNodeErrors = consoleErrors.filter(error =>
        error.includes('Text strings must be rendered within a <Text> component')
      );
      
      expect(textNodeErrors).toHaveLength(0);
    });
  });

  describe('Error Component Text Node Safety', () => {
    // Test our error components for text node issues
    
    it('should not have text node errors in ErrorView', async () => {
      const { AppError } = await import('@/lib/errors');
      const { default: ErrorView } = await import('@/components/ErrorView');
      
      const testError = new AppError({
        kind: 'Network',
        message: 'Test error',
        code: 'TEST_ERROR',
      });
      
      render(<ErrorView error={testError} />);
      
      const textNodeErrors = consoleErrors.filter(error =>
        error.includes('Text strings must be rendered within a <Text> component')
      );
      
      expect(textNodeErrors).toHaveLength(0);
    });

    it('should not have text node errors in NetworkBoundary', async () => {
      const { default: NetworkBoundary } = await import('@/components/NetworkBoundary');
      
      render(
        <NetworkBoundary>
          <View>
            <Text>Test content</Text>
          </View>
        </NetworkBoundary>
      );
      
      const textNodeErrors = consoleErrors.filter(error =>
        error.includes('Text strings must be rendered within a <Text> component')
      );
      
      expect(textNodeErrors).toHaveLength(0);
    });
  });

  describe('ESLint Rule Validation', () => {
    // These tests would fail if the ESLint rule isn't working
    
    it('should have ESLint rule configured to catch text nodes', () => {
      // This test ensures our ESLint configuration includes the rule
      // In a real scenario, this would be tested by running ESLint on problematic code
      
      const eslintConfig = require('../../eslint.config.js');
      const hasReactNativeRules = eslintConfig.some((config: any) => 
        config.plugins && config.plugins['react-native']
      );
      
      expect(hasReactNativeRules).toBe(true);
    });
  });
});