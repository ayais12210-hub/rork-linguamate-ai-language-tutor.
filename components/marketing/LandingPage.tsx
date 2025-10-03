import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { brand } from '@/config/brand';
import Navbar from './Navbar';
import Hero from './Hero';
import TrustBar from './TrustBar';
import StatsSection from './StatsSection';
import Features from './Features';
import LiveShowcase from './LiveShowcase';
import LanguageShowcase from './LanguageShowcase';
import Curriculum from './Curriculum';
import ComparisonTable from './ComparisonTable';
import Pricing from './Pricing';
import SocialProof from './SocialProof';
import CTA from './CTA';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <ScrollView style={styles.container} testID="landing-page">
      <Navbar />
      <Hero />
      <TrustBar />
      <StatsSection />
      <Features />
      <LiveShowcase />
      <LanguageShowcase />
      <Curriculum />
      <ComparisonTable />
      <Pricing />
      <SocialProof />
      <CTA />
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.palette.bg,
  },
});
