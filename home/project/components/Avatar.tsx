import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ImageSourcePropType,
} from 'react-native';
import { User } from 'lucide-react-native';

interface AvatarProps {
  source?: ImageSourcePropType | string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | number;
  onPress?: () => void;
  showBadge?: boolean;
  badgeColor?: string;
  badgePosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  style?: ViewStyle;
  textStyle?: TextStyle;
  backgroundColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'medium',
  onPress,
  showBadge = false,
  badgeColor = '#34C759',
  badgePosition = 'bottom-right',
  style,
  textStyle,
  backgroundColor = '#E5E5EA',
}) => {
  const getSize = (): number => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 48;
      case 'large':
        return 64;
      case 'xlarge':
        return 96;
      default:
        return 48;
    }
  };

  const avatarSize = getSize();
  const fontSize = avatarSize * 0.4;
  const iconSize = avatarSize * 0.5;
  const badgeSize = avatarSize * 0.25;

  const getInitials = (name: string): string => {
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const getBadgePosition = () => {
    const offset = -badgeSize / 4;
    switch (badgePosition) {
      case 'top-right':
        return { top: offset, right: offset };
      case 'bottom-right':
        return { bottom: offset, right: offset };
      case 'top-left':
        return { top: offset, left: offset };
      case 'bottom-left':
        return { bottom: offset, left: offset };
      default:
        return { bottom: offset, right: offset };
    }
  };

  const Container = onPress ? TouchableOpacity : View;

  const renderContent = () => {
    if (source) {
      const imageSource = typeof source === 'string' ? { uri: source } : source;
      return (
        <Image
          source={imageSource}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      );
    }

    if (name) {
      return (
        <View
          style={[
            styles.initialsContainer,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }, textStyle]}>
            {getInitials(name)}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.iconContainer,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor,
          },
        ]}
      >
        <User size={iconSize} color="#8E8E93" />
      </View>
    );
  };

  return (
    <Container
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {renderContent()}
      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: badgeColor,
              ...getBadgePosition(),
            },
          ]}
        />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: '600',
    color: '#000000',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});