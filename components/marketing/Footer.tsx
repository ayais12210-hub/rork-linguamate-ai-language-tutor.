import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { Github, Twitter } from 'lucide-react-native';
import { brand } from '@/config/brand';
import { landingContent } from '@/content/landing';

const { width } = Dimensions.get('window');

export default function Footer() {
  const { footer } = landingContent;
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.brandSection}>
            <View style={styles.logo}>
              <Text style={styles.logoIcon}>🌍</Text>
              <Text style={styles.logoText}>{brand.name}</Text>
            </View>
            <Text style={styles.tagline}>{footer.tagline}</Text>
            <View style={styles.social}>
              <TouchableOpacity style={styles.socialButton}>
                <Twitter size={20} color={brand.palette.fgSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Github size={20} color={brand.palette.fgSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.linksSection}>
            {footer.sections.map((section) => (
              <View key={section.title} style={styles.linkColumn}>
                <Text style={styles.columnTitle}>{section.title}</Text>
                <View style={styles.links}>
                  {section.links.map((link) => (
                    <Link key={link.href} href={link.href as any} asChild>
                      <TouchableOpacity>
                        <Text style={styles.linkText}>{link.label}</Text>
                      </TouchableOpacity>
                    </Link>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.copyright}>
            © {currentYear} {brand.name}. All rights reserved.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: brand.palette.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 64,
  },
  content: {
    maxWidth: 1280,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 24,
    width: '100%',
  },
  topSection: {
    flexDirection: width < 768 ? 'column' : 'row',
    gap: 48,
    marginBottom: 48,
  },
  brandSection: {
    flex: 1,
    maxWidth: 320,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700' as any,
    color: brand.palette.fg,
  },
  tagline: {
    fontSize: 14,
    color: brand.palette.fgSecondary,
    marginBottom: 24,
  },
  social: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  linksSection: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 48,
  },
  linkColumn: {
    minWidth: 140,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: brand.palette.fg,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  links: {
    gap: 12,
  },
  linkText: {
    fontSize: 14,
    color: brand.palette.fgSecondary,
  },
  bottomSection: {
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  copyright: {
    fontSize: 14,
    color: brand.palette.fgSecondary,
    textAlign: 'center',
  },
});
