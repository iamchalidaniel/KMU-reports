import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import StatCard from '../../src/components/StatCard';
import apiClient from '../../src/services/apiClient';
import { ENDPOINTS } from '../../src/constants/api';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';

interface DashboardStats {
  totalCases?: number;
  pendingCases?: number;
  totalReports?: number;
  pendingMaintenance?: number;
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [refreshing, setRefreshing] = useState(false);

  async function fetchStats() {
    try {
      // Fetch relevant counts from available endpoints
      const [casesRes, reportsRes] = await Promise.allSettled([
        apiClient.get(ENDPOINTS.cases + '?limit=1'),
        apiClient.get(ENDPOINTS.studentReports + '?limit=1'),
      ]);

      setStats({
        totalCases: casesRes.status === 'fulfilled' ? casesRes.value.data?.total ?? casesRes.value.data?.length ?? 0 : 0,
        totalReports: reportsRes.status === 'fulfilled' ? reportsRes.value.data?.total ?? reportsRes.value.data?.length ?? 0 : 0,
      });
    } catch {
      // silently fail – stats are non-critical
    }
  }

  useEffect(() => { fetchStats(); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }

  const roleBadgeColor: Record<string, string> = {
    student: Colors.student,
    security: Colors.danger,
    maintenance: Colors.warning,
    admin: Colors.primary,
    secretary: Colors.info,
    'assistant-dean': Colors.success,
    'dean-of-students': Colors.primaryLight,
    'chief-security-officer': Colors.danger,
    'hall-warden': Colors.warning,
  };

  const accentColor = roleBadgeColor[user?.role ?? ''] ?? Colors.primary;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name ?? 'User'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutIcon}>⏻</Text>
        </TouchableOpacity>
      </View>

      {/* Role Badge */}
      <View style={[styles.roleBadge, { backgroundColor: accentColor + '22', borderColor: accentColor + '44' }]}>
        <View style={[styles.roleDot, { backgroundColor: accentColor }]} />
        <Text style={[styles.roleText, { color: accentColor }]}>
          {(user?.role ?? 'User').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
      >
        {/* Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsRow}>
          <StatCard
            title="Total Cases"
            value={stats.totalCases ?? '–'}
            icon="⚖️"
            accent={Colors.primary}
            style={styles.statCard}
          />
          <StatCard
            title="Reports"
            value={stats.totalReports ?? '–'}
            icon="📋"
            accent={Colors.success}
            style={styles.statCard}
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity key={action.label} style={styles.actionCard} activeOpacity={0.7}>
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const QUICK_ACTIONS = [
  { icon: '📋', label: 'New Report' },
  { icon: '⚖️', label: 'View Cases' },
  { icon: '🔧', label: 'Maintenance' },
  { icon: '📊', label: 'Analytics' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: { color: Colors.textSecondary, fontSize: FontSize.sm },
  name: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: { fontSize: 18 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 6,
  },
  roleDot: { width: 7, height: 7, borderRadius: Radius.full },
  roleText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    width: '47%',
    gap: Spacing.sm,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium, textAlign: 'center' },
});
