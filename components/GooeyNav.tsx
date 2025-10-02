import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface GooeyNavItem {
  label: string;
  href: string;
}

export interface GooeyNavProps {
  items: GooeyNavItem[];
  initialActiveIndex?: number;
  onItemPress?: (index: number, href: string) => void;
}

const GooeyNav: React.FC<GooeyNavProps> = ({
  items,
  initialActiveIndex = 0,
  onItemPress,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(initialActiveIndex);

  const handlePress = (index: number) => {
    setActiveIndex(index);
    if (onItemPress) {
      onItemPress(index, items[index].href);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.navItem,
                isActive && styles.navItemActive,
              ]}
              onPress={() => handlePress(index)}
              testID={`gooey-nav-${index}`}
            >
              <Text
                style={[
                  styles.navText,
                  isActive && styles.navTextActive,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  nav: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 4,
    gap: 8,
  },
  navItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: '#10B981',
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  navTextActive: {
    color: '#FFFFFF',
  },
});

export default GooeyNav;
