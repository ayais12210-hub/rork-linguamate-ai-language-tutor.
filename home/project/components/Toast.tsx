import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom';
  onDismiss?: () => void;
  showIcon?: boolean;
  showCloseButton?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  position = 'bottom',
  onDismiss,
  showIcon = true,
  showCloseButton = false,
  style,
  textStyle,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0 && onDismiss) {
        const timer = setTimeout(() => {
          hideToast();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  const getIcon = () => {
    const iconSize = 20;
    const iconColor = '#FFFFFF';
    
    switch (type) {
      case 'success':
        return <CheckCircle size={iconSize} color={iconColor} />;
      case 'error':
        return <AlertCircle size={iconSize} color={iconColor} />;
      case 'warning':
        return <AlertTriangle size={iconSize} color={iconColor} />;
      case 'info':
      default:
        return <Info size={iconSize} color={iconColor} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#34C759';
      case 'error':
        return '#FF3B30';
      case 'warning':
        return '#FF9500';
      case 'info':
      default:
        return '#007AFF';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        {
          backgroundColor: getBackgroundColor(),
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      {showIcon && <View style={styles.icon}>{getIcon()}</View>}
      <Text style={[styles.message, textStyle]} numberOfLines={2}>
        {message}
      </Text>
      {showCloseButton && (
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <X size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  topPosition: {
    top: 50,
  },
  bottomPosition: {
    bottom: 50,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
});