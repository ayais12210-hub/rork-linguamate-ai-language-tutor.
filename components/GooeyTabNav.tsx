import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabItem {
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  route: string;
}

interface GooeyTabNavProps {
  items: TabItem[];
  activeIndex: number;
  onTabPress: (index: number, route: string) => void;
  colors?: string[];
  animationTime?: number;
}

const GooeyTabNav: React.FC<GooeyTabNavProps> = ({
  items,
  activeIndex,
  onTabPress,
  colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'],
  animationTime = 300,
}) => {
  const [indicatorAnim] = useState(new Animated.Value(activeIndex));
  const [scaleAnims] = useState(items.map(() => new Animated.Value(1)));
  const [glowAnim] = useState(new Animated.Value(0));

  const tabWidth = SCREEN_WIDTH / items.length;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(indicatorAnim, {
        toValue: activeIndex,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: animationTime / 2,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: animationTime / 2,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    scaleAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: index === activeIndex ? 1.2 : 1,
        useNativeDriver: true,
        tension: 50,
        friction: 5,
      }).start();
    });
  }, [activeIndex, animationTime, indicatorAnim, scaleAnims, glowAnim]);

  const handlePress = (index: number, route: string) => {
    if (index !== activeIndex) {
      onTabPress(index, route);
    }
  };

  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: items.map((_, i) => i),
    outputRange: items.map((_, i) => i * tabWidth + tabWidth / 2 - 20),
  });

  const getColorForIndex = (index: number) => {
    return colors[index % colors.length];
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: getColorForIndex(activeIndex),
            transform: [{ translateX: indicatorTranslateX }],
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.6],
            }),
          },
        ]}
      />

      <View style={styles.tabsContainer}>
        {items.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = index === activeIndex;
          const color = isActive ? getColorForIndex(index) : '#9CA3AF';

          return (
            <TouchableOpacity
              key={`tab-${index}-${item.route}`}
              style={styles.tab}
              onPress={() => handlePress(index, item.route)}
              activeOpacity={0.7}
              testID={`gooey-tab-${item.route}`}
            >
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: scaleAnims[index] }],
                  },
                ]}
              >
                <IconComponent size={24} color={color} />
              </Animated.View>
              <Text
                style={[
                  styles.label,
                  {
                    color,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default GooeyTabNav;
