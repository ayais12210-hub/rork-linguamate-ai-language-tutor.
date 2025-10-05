import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Menu, X } from 'lucide-react-native';
import { brand } from '@/config/brand';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Curriculum', href: '#curriculum' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>🌍</Text>
            <Text style={styles.logoText}>{brand.name}</Text>
          </View>
        </View>

        {Platform.OS === 'web' && (
          <View style={styles.centerSection}>
            {navLinks.map((link) => (
              <TouchableOpacity
                key={link.href}
                style={styles.navLink}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    const element = document.querySelector(link.href);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <Text style={styles.navLinkText}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.rightSection}>
          {Platform.OS === 'web' ? (
            <>
              <Link href="/auth/login" asChild>
                <TouchableOpacity style={styles.signInButton}>
                  <Text style={styles.signInText}>Sign in</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/(tabs)/chat" asChild>
                <TouchableOpacity style={styles.ctaButton}>
                  <Text style={styles.ctaButtonText}>Try the App</Text>
                </TouchableOpacity>
              </Link>
            </>
          ) : (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X size={24} color={brand.palette.fg} />
              ) : (
                <Menu size={24} color={brand.palette.fg} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {mobileMenuOpen && Platform.OS !== 'web' && (
        <View style={styles.mobileMenu}>
          <ScrollView>
            {navLinks.map((link) => (
              <TouchableOpacity
                key={link.href}
                style={styles.mobileNavLink}
                onPress={() => setMobileMenuOpen(false)}
              >
                <Text style={styles.mobileNavLinkText}>{link.label}</Text>
              </TouchableOpacity>
            ))}
            <Link href="/auth/login" asChild>
              <TouchableOpacity style={styles.mobileNavLink}>
                <Text style={styles.mobileNavLinkText}>Sign in</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/chat" asChild>
              <TouchableOpacity style={[styles.mobileNavLink, styles.mobileCtaLink]}>
                <Text style={styles.mobileCtaLinkText}>Try the App</Text>
              </TouchableOpacity>
            </Link>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: Platform.OS === 'web' ? ('sticky' as any) : 'relative',
    top: 0,
    zIndex: 50,
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    maxWidth: 1280,
    marginHorizontal: 'auto' as any,
    width: '100%',
  },
  leftSection: {
    flex: 1,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700' as any,
    color: brand.palette.fg,
  },
  centerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navLink: {
    paddingVertical: 8,
  },
  navLinkText: {
    fontSize: 14,
    color: brand.palette.fgSecondary,
    fontWeight: '500' as any,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  signInButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  signInText: {
    fontSize: 14,
    color: brand.palette.fg,
    fontWeight: '500' as any,
  },
  ctaButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: brand.palette.primary.from,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600' as any,
  },
  menuButton: {
    padding: 8,
  },
  mobileMenu: {
    backgroundColor: brand.palette.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
  },
  mobileNavLink: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  mobileNavLinkText: {
    fontSize: 16,
    color: brand.palette.fg,
    fontWeight: '500' as any,
  },
  mobileCtaLink: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: brand.palette.primary.from,
    borderRadius: 8,
    alignItems: 'center',
  },
  mobileCtaLinkText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600' as any,
  },
});
