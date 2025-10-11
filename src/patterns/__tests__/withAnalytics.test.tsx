import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { withAnalytics, AnalyticsProvider, useAnalytics } from '../hoc/withAnalytics';

// Mock analytics service for testing
class MockAnalyticsService {
  public events: any[] = [];
  public userId: string | null = null;

  track(event: any) {
    this.events.push(event);
  }

  identify(userId: string, traits?: any) {
    this.userId = userId;
  }

  page(name: string, properties?: any) {
    this.track({ name: 'page_viewed', properties: { page_name: name, ...properties } });
  }

  screen(name: string, properties?: any) {
    this.track({ name: 'screen_viewed', properties: { screen_name: name, ...properties } });
  }

  group(groupId: string, traits?: any) {
    this.track({ name: 'group_identified', properties: { group_id: groupId, ...traits } });
  }

  alias(newId: string, oldId?: string) {
    this.track({ name: 'user_aliased', properties: { new_id: newId, old_id: oldId } });
  }

  reset() {
    this.userId = null;
    this.events = [];
  }
}

// Test component
function TestComponent() {
  const analytics = useAnalytics();

  const handleClick = () => {
    analytics.track({ name: 'button_clicked', properties: { button: 'test' } });
  };

  const handleIdentify = () => {
    analytics.identify('test-user', { name: 'Test User' });
  };

  return (
    <div>
      <button data-testid="track-button" onClick={handleClick}>
        Track Event
      </button>
      <button data-testid="identify-button" onClick={handleIdentify}>
        Identify User
      </button>
    </div>
  );
}

// Component with analytics HOC
const TestComponentWithAnalytics = withAnalytics(TestComponent, {
  trackScreenView: true,
  trackUserInteractions: true,
  screenName: 'TestScreen',
});

describe('withAnalytics', () => {
  let mockAnalytics: MockAnalyticsService;

  beforeEach(() => {
    mockAnalytics = new MockAnalyticsService();
  });

  it('should track screen view on mount', () => {
    render(
      <AnalyticsProvider service={mockAnalytics}>
        <TestComponentWithAnalytics />
      </AnalyticsProvider>
    );

    expect(mockAnalytics.events).toHaveLength(1);
    expect(mockAnalytics.events[0].name).toBe('screen_viewed');
    expect(mockAnalytics.events[0].properties.screen_name).toBe('TestScreen');
  });

  it('should track user interactions', () => {
    render(
      <AnalyticsProvider service={mockAnalytics}>
        <TestComponentWithAnalytics />
      </AnalyticsProvider>
    );

    // Clear initial screen view event
    mockAnalytics.events = [];

    // Simulate user interaction
    fireEvent.click(screen.getByTestId('track-button'));

    // Should have tracked the button click
    expect(mockAnalytics.events).toHaveLength(1);
    expect(mockAnalytics.events[0].name).toBe('button_clicked');
  });

  it('should not track interactions when disabled', () => {
    const TestComponentWithoutInteractionTracking = withAnalytics(TestComponent, {
      trackScreenView: true,
      trackUserInteractions: false,
    });

    render(
      <AnalyticsProvider service={mockAnalytics}>
        <TestComponentWithoutInteractionTracking />
      </AnalyticsProvider>
    );

    // Clear initial screen view event
    mockAnalytics.events = [];

    // Simulate user interaction
    fireEvent.click(screen.getByTestId('track-button'));

    // Should not have tracked the interaction
    expect(mockAnalytics.events).toHaveLength(0);
  });

  it('should call onMount and onUnmount callbacks', () => {
    const onMount = jest.fn();
    const onUnmount = jest.fn();

    const TestComponentWithCallbacks = withAnalytics(TestComponent, {
      onMount,
      onUnmount,
    });

    const { unmount } = render(
      <AnalyticsProvider service={mockAnalytics}>
        <TestComponentWithCallbacks />
      </AnalyticsProvider>
    );

    expect(onMount).toHaveBeenCalledWith(expect.any(Object));

    unmount();

    expect(onUnmount).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should work without analytics provider (fallback)', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponentWithAnalytics />);
    }).not.toThrow();

    consoleSpy.mockRestore();
  });

  it('should track custom properties', () => {
    const TestComponentWithCustomProps = withAnalytics(TestComponent, {
      trackScreenView: true,
      customProperties: { customProp: 'test-value' },
    });

    render(
      <AnalyticsProvider service={mockAnalytics}>
        <TestComponentWithCustomProps />
      </AnalyticsProvider>
    );

    expect(mockAnalytics.events[0].properties.customProp).toBe('test-value');
  });
});

describe('useAnalytics', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAnalytics must be used within an AnalyticsProvider');

    consoleSpy.mockRestore();
  });

  it('should work with custom analytics service', () => {
    const mockAnalytics = new MockAnalyticsService();

    render(
      <AnalyticsProvider service={mockAnalytics}>
        <TestComponent />
      </AnalyticsProvider>
    );

    fireEvent.click(screen.getByTestId('track-button'));
    fireEvent.click(screen.getByTestId('identify-button'));

    expect(mockAnalytics.events).toHaveLength(1);
    expect(mockAnalytics.userId).toBe('test-user');
  });
});

describe('AnalyticsProvider', () => {
  it('should provide default analytics service when none provided', () => {
    render(
      <AnalyticsProvider>
        <TestComponent />
      </AnalyticsProvider>
    );

    // Should not throw
    fireEvent.click(screen.getByTestId('track-button'));
  });
});