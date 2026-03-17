import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, SafeAreaView, Dimensions, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const ACCENT = '#10B981';
const BG = '#0B1120';

// Role cards shown on the home screen
const ROLES = [
  { emoji: '🎓', label: 'Student', desc: 'Report incidents, track your cases & repairs', color: '#8B5CF6' },
  { emoji: '🛡️', label: 'Administrator', desc: 'Full system management and oversight', color: '#10B981' },
  { emoji: '⚖️', label: 'Dean / Staff', desc: 'Manage discipline and student welfare', color: '#3B82F6' },
  { emoji: '🔒', label: 'Security', desc: 'Monitor incidents and access reports', color: '#F59E0B' },
];

const FEATURES = [
  { emoji: '📋', label: 'Incident Reports', desc: 'Submit and track disciplinary reports' },
  { emoji: '⚖️', label: 'Case Management', desc: 'Full disciplinary case workflow' },
  { emoji: '🔧', label: 'Maintenance', desc: 'Facility repair request tracking' },
  { emoji: '📊', label: 'Analytics', desc: 'System-wide insights and audit logs' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section */}
        <View style={styles.hero}>
          {/* Decorative rings */}
          <View style={styles.ringOuter} />
          <View style={styles.ringInner} />

          <Image
            source={require('../../assets/kmu_official.png')}
            style={styles.heroLogo}
            resizeMode="contain"
          />

          <Text style={styles.heroTitle}>KMU Reports</Text>
          <Text style={styles.heroSub}>
            University Discipline & Facilities{'\n'}Management System
          </Text>

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/(auth)')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>Sign In to Continue  →</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FEATURES</Text>
          <View style={styles.featureGrid}>
            {FEATURES.map(f => (
              <View key={f.label} style={styles.featureCard}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Who can use it */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHO USES IT</Text>
          <View style={styles.rolesGrid}>
            {ROLES.map(r => (
              <View key={r.label} style={[styles.roleCard, { borderLeftColor: r.color }]}>
                <Text style={styles.roleEmoji}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleLabel, { color: r.color }]}>{r.label}</Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Full-width logo wordmark */}
        <View style={styles.wordmarkRow}>
          <Image
            source={require('../../assets/kmu_official.png')}
            style={styles.wordmark}
            resizeMode="contain"
          />
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottomCta}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/(auth)')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>Get Started</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>© 2025 KMU · All rights reserved</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { paddingBottom: 48 },

  // Hero
  hero: {
    minHeight: height * 0.62,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  ringOuter: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    borderWidth: 1.5,
    borderColor: ACCENT + '20',
    top: '50%',
    left: '50%',
    marginLeft: -(width * 0.9) / 2,
    marginTop: -(width * 0.9) / 2,
  },
  ringInner: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    borderWidth: 1,
    borderColor: ACCENT + '15',
    top: '50%',
    left: '50%',
    marginLeft: -(width * 0.6) / 2,
    marginTop: -(width * 0.6) / 2,
  },
  heroLogo: {
    width: 110,
    height: 110,
    borderRadius: 26,
    marginBottom: 24,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 16,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.2,
    marginBottom: 32,
  },

  // CTA button
  ctaBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.4,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  // Feature cards
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#0F1E35',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    padding: 16,
    gap: 6,
  },
  featureEmoji: { fontSize: 24 },
  featureLabel: { fontSize: 14, fontWeight: '700', color: '#E2E8F0' },
  featureDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },

  // Role cards
  rolesGrid: { gap: 10 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0F1E35',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    borderLeftWidth: 4,
    padding: 14,
  },
  roleEmoji: { fontSize: 26 },
  roleLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  roleDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },

  // Wordmark
  wordmarkRow: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  wordmark: {
    width: width * 0.5,
    height: 60,
  },

  // Bottom CTA
  bottomCta: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#334155',
    letterSpacing: 0.5,
  },
});
