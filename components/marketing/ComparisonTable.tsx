import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { brand } from '@/config/brand';

const { width } = Dimensions.get('window');

const comparisonData = {
  title: 'Why choose Linguamate?',
  subtitle: 'See how we compare to traditional learning methods',
  features: [
    { name: 'AI-powered personalization', linguamate: true, traditional: false, apps: false },
    { name: 'Real-time pronunciation feedback', linguamate: true, traditional: false, apps: true },
    { name: 'Adaptive difficulty', linguamate: true, traditional: false, apps: false },
    { name: 'Offline mode', linguamate: true, traditional: true, apps: false },
    { name: 'Cultural context', linguamate: true, traditional: true, apps: false },
    { name: 'Natural conversations', linguamate: true, traditional: true, apps: false },
    { name: 'Spaced repetition', linguamate: true, traditional: false, apps: true },
    { name: 'Progress tracking', linguamate: true, traditional: false, apps: true },
    { name: 'Flexible schedule', linguamate: true, traditional: false, apps: true },
    { name: 'Affordable pricing', linguamate: true, traditional: false, apps: true },
  ],
  columns: [
    { id: 'linguamate', label: 'Linguamate AI', highlighted: true },
    { id: 'traditional', label: 'Traditional Classes' },
    { id: 'apps', label: 'Other Apps' },
  ],
};

export default function ComparisonTable() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{comparisonData.title}</Text>
          <Text style={styles.subtitle}>{comparisonData.subtitle}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.featureColumn}>
                <Text style={styles.columnHeaderText}>Features</Text>
              </View>
              {comparisonData.columns.map((col) => (
                <View
                  key={col.id}
                  style={[
                    styles.comparisonColumn,
                    col.highlighted && styles.comparisonColumnHighlighted,
                  ]}
                >
                  <Text
                    style={[
                      styles.columnHeaderText,
                      col.highlighted && styles.columnHeaderTextHighlighted,
                    ]}
                  >
                    {col.label}
                  </Text>
                </View>
              ))}
            </View>

            {comparisonData.features.map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowEven,
                ]}
              >
                <View style={styles.featureColumn}>
                  <Text style={styles.featureName}>{feature.name}</Text>
                </View>
                <View style={styles.comparisonColumn}>
                  {feature.linguamate ? (
                    <Check size={24} color="#10b981" />
                  ) : (
                    <X size={24} color="#ef4444" />
                  )}
                </View>
                <View style={styles.comparisonColumn}>
                  {feature.traditional ? (
                    <Check size={24} color="#10b981" />
                  ) : (
                    <X size={24} color="#ef4444" />
                  )}
                </View>
                <View style={styles.comparisonColumn}>
                  {feature.apps ? (
                    <Check size={24} color="#10b981" />
                  ) : (
                    <X size={24} color="#ef4444" />
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: brand.palette.bgSecondary,
    paddingVertical: 80,
  },
  content: {
    maxWidth: 1280,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 24,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 64,
  },
  title: {
    fontSize: width < 768 ? 32 : 48,
    fontWeight: '800' as any,
    color: brand.palette.fg,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: width < 768 ? 16 : 20,
    color: brand.palette.fgSecondary,
    textAlign: 'center',
    maxWidth: 600,
  },
  table: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: width < 768 ? 700 : '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableRowEven: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  featureColumn: {
    flex: 2,
    padding: 20,
    justifyContent: 'center',
  },
  comparisonColumn: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  comparisonColumnHighlighted: {
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  columnHeaderText: {
    fontSize: 14,
    fontWeight: '700' as any,
    color: brand.palette.fg,
    textAlign: 'center',
  },
  columnHeaderTextHighlighted: {
    color: brand.palette.primary.from,
  },
  featureName: {
    fontSize: 14,
    color: brand.palette.fg,
  },
});
