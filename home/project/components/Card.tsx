import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  onPress,
  variant = 'default',
  padding = 'medium',
  style,
  titleStyle,
  subtitleStyle,
  header,
  footer,
}) => {
  const Container = onPress ? TouchableOpacity : View;
  
  const paddingStyle = padding === 'small' ? styles.paddingSmall :
                       padding === 'medium' ? styles.paddingMedium :
                       padding === 'large' ? styles.paddingLarge : undefined;

  return (
    <Container
      style={[
        styles.container,
        styles[variant],
        paddingStyle,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {header && <>{header}</>}
      {(title || subtitle) && (
        <View style={styles.headerContainer}>
          {title && (
            <Text style={[styles.title, titleStyle]}>{title}</Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
          )}
        </View>
      )}
      {children && <View style={styles.content}>{children}</View>}
      {footer && <>{footer}</>}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  default: {
    backgroundColor: '#FFFFFF',
  },
  elevated: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  outlined: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  paddingSmall: {
    padding: 12,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },
  headerContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
  },
});