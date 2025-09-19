import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { X } from 'lucide-react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  position?: 'center' | 'bottom';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  animationType?: 'fade' | 'slide' | 'none';
  headerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  position = 'center',
  showCloseButton = true,
  closeOnBackdrop = true,
  animationType = 'fade',
  headerStyle,
  titleStyle,
  contentStyle,
  footer,
}) => {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      if (animationType === 'fade') {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else if (animationType === 'slide') {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } else {
      if (animationType === 'fade') {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else if (animationType === 'slide') {
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [visible, animationType, fadeAnim, slideAnim]);

  const getModalHeight = () => {
    switch (size) {
      case 'small':
        return '30%';
      case 'medium':
        return '50%';
      case 'large':
        return '80%';
      case 'full':
        return '95%';
      default:
        return '50%';
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeOnBackdrop ? onClose : undefined}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              position === 'bottom' && styles.bottomModal,
              animationType === 'fade' && { opacity: fadeAnim },
              animationType === 'slide' && {
                transform: [{ translateY: slideAnim }],
              },
              { maxHeight: getModalHeight() },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={[styles.modal, contentStyle]}>
                {(title || showCloseButton) && (
                  <View style={[styles.header, headerStyle]}>
                    {title && (
                      <Text style={[styles.title, titleStyle]}>{title}</Text>
                    )}
                    {showCloseButton && (
                      <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeButton}
                      >
                        <X size={24} color="#000000" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <ScrollView
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {children}
                </ScrollView>
                {footer && <View style={styles.footer}>{footer}</View>}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  bottomModal: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  modal: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});