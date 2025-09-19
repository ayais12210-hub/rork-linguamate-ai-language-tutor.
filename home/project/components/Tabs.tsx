import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  scrollable?: boolean;
  style?: ViewStyle;
  tabStyle?: ViewStyle;
  activeTabStyle?: ViewStyle;
  labelStyle?: TextStyle;
  activeLabelStyle?: TextStyle;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'medium',
  fullWidth = false,
  scrollable = false,
  style,
  tabStyle,
  activeTabStyle,
  labelStyle,
  activeLabelStyle,
}) => {
  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const activeLayout = tabLayouts[activeTab];
    if (activeLayout && variant === 'underline') {
      Animated.parallel([
        Animated.timing(indicatorPosition, {
          toValue: activeLayout.x,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(indicatorWidth, {
          toValue: activeLayout.width,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [activeTab, tabLayouts, variant, indicatorPosition, indicatorWidth]);

  const handleTabLayout = (key: string, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => ({ ...prev, [key]: { x, width } }));
  };

  const renderTab = (tab: Tab) => {
    const isActive = activeTab === tab.key;

    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.tab,
          styles[`${size}Tab`],
          variant === 'pills' && styles.pillTab,
          variant === 'pills' && isActive && styles.activePillTab,
          fullWidth && styles.fullWidthTab,
          tabStyle,
          isActive && activeTabStyle,
        ]}
        onPress={() => onTabChange(tab.key)}
        onLayout={(event) => handleTabLayout(tab.key, event)}
      >
        {tab.icon && <View style={styles.icon}>{tab.icon}</View>}
        <Text
          style={[
            styles.label,
            styles[`${size}Label`],
            labelStyle,
            isActive && styles.activeLabel,
            isActive && activeLabelStyle,
          ]}
        >
          {tab.label}
        </Text>
        {tab.badge !== undefined && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tab.badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const Container = scrollable ? ScrollView : View;

  return (
    <View style={[styles.container, style]}>
      <Container
        horizontal={scrollable}
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, variant === 'underline' && styles.underlineContainer]}
      >
        {tabs.map(renderTab)}
        {variant === 'underline' && (
          <Animated.View
            style={[
              styles.indicator,
              {
                transform: [{ translateX: indicatorPosition }],
                width: indicatorWidth,
              },
            ]}
          />
        )}
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  underlineContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  smallTab: {
    paddingVertical: 8,
  },
  mediumTab: {
    paddingVertical: 12,
  },
  largeTab: {
    paddingVertical: 16,
  },
  pillTab: {
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F2F2F7',
  },
  activePillTab: {
    backgroundColor: '#007AFF',
  },
  fullWidthTab: {
    flex: 1,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '500',
    color: '#8E8E93',
  },
  smallLabel: {
    fontSize: 14,
  },
  mediumLabel: {
    fontSize: 16,
  },
  largeLabel: {
    fontSize: 18,
  },
  activeLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#007AFF',
  },
});