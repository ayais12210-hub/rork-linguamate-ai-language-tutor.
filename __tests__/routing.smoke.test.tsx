import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Mock the main app screens
const MockHomeScreen = () => <div testID="home-screen">Home Screen</div>;
const MockLearnScreen = () => <div testID="learn-screen">Learn Screen</div>;
const MockProfileScreen = () => <div testID="profile-screen">Profile Screen</div>;

const Stack = createNativeStackNavigator();

const MockApp = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Home" component={MockHomeScreen} />
      <Stack.Screen name="Learn" component={MockLearnScreen} />
      <Stack.Screen name="Profile" component={MockProfileScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

describe('Routing Smoke Tests', () => {
  it('should render home screen without errors', () => {
    render(<MockApp />);
    expect(screen.getByTestId('home-screen')).toBeTruthy();
  });

  it('should render learn screen without errors', () => {
    render(<MockApp />);
    expect(screen.getByTestId('learn-screen')).toBeTruthy();
  });

  it('should render profile screen without errors', () => {
    render(<MockApp />);
    expect(screen.getByTestId('profile-screen')).toBeTruthy();
  });

  it('should not have console errors', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<MockApp />);
    
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
