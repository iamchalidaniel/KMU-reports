import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import StatCard from '../../src/components/StatCard';
import {
  listStudentReports, listStudentCases, listAppeals, listMaintenanceReports,
  StudentReport, StudentCase, Appeal, MaintenanceReport,
} from '../../src/services/studentService';
import { Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function StudentHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<StudentReport[]>([]);
  const [cases, setCases] = useState<StudentCase[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const fetchAll = useCallback(async () => {
    try {
      const [r, c, a, m] = await Promise.allSettled([
        listStudentReports(),
        listStudentCases(),
        listAppeals(),
        listMaintenanceReports(),
      ]);
      if (r.status === 'fulfilled') setReports(r.value);
      if (c.status === 'fulfilled') setCases(c.value);
      if (a.status === 'fulfilled') setAppeals(a.value);
      if (m.status === 'fulfilled') setMaintenance(m.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const pendingAppeals = appeals.filter(a => a.appealStatus === 'pending');
  const openCases = cases.filter(c => c.status === 'Open' || c.status === 'In Progress');
  const needsAttention = pendingAppeals.length > 0 || openCases.length > 0;

  const handleLogout = () =>
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.student} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.student }]}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? 'S'}</Text>
          </View>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greet()}</Text>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{user?.name ?? 'Student'}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleLogout}>
          <Text style={[styles.logoutIcon, { color: colors.text }]}>⏻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.student} />}
        contentContainerStyle={styles.content}
      >
        {/* Attention banner */}
        {needsAttention && (
          <View style={[styles.attentionBanner, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '40' }]}>
            <Text style={styles.attentionIcon}>⚠️</Text>
            <Text style={[styles.attentionText, { color: colors.warning }]}>
              {openCases.length > 0 && `${openCases.length} open case(s)`}
              {openCases.length > 0 && pendingAppeals.length > 0 && '  ·  '}
              {pendingAppeals.length > 0 && `${pendingAppeals.length} appeal(s) pending`}
            </Text>
          </View>
        )}

        {/* Stats */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>OVERVIEW</Text>
        <View style={styles.statsRow}>
          <StatCard
            title="My Cases"
            value={cases.length}
            icon="⚖️"
            accent={colors.danger}
            subtitle={openCases.length > 0 ? `${openCases.length} open` : undefined}
            style={styles.statFlex}
          />
          <StatCard
            title="Reports"
            value={reports.length}
            icon="📋"
            accent={colors.student}
            style={styles.statFlex}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Appeals"
            value={appeals.length}
            icon="🏛️"
            accent={colors.warning}
            subtitle={pendingAppeals.length > 0 ? `${pendingAppeals.length} pending` : undefined}
            style={styles.statFlex}
          />
          <StatCard
            title="Maintenance"
            value={maintenance.length}
            icon="🔧"
            accent={colors.success}
            style={styles.statFlex}
          />
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="🚨"
            label="Report Incident"
            subtitle="Tell us what happened"
            accent={colors.danger}
            onPress={() => router.push('/(student)/report-incident')}
            colors={colors}
          />
          <ActionCard
            icon="🔧"
            label="Request Repair"
            subtitle="Broken or damaged item"
            accent={colors.success}
            onPress={() => router.push('/(student)/request-repair')}
            colors={colors}
          />
          <ActionCard
            icon="⚖️"
            label="My Cases"
            subtitle="View active cases"
            accent={colors.warning}
            onPress={() => router.push('/(student)/cases')}
            colors={colors}
          />
          <ActionCard
            icon="🏛️"
            label="My Appeals"
            subtitle="Track appeal status"
            accent={colors.info}
            onPress={() => router.push('/(student)/appeals')}
            colors={colors}
          />
        </View>

        {/* Recent Reports */}
        {reports.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>RECENT REPORTS</Text>
            {reports.slice(0, 3).map(r => {
              const getStatusColor = (status: string, colorsObj: any) => {
                const map: Record<string, string> = {
                  Pending: colorsObj.warning,
                  Reviewed: colorsObj.info,
                  Approved: colorsObj.success,
                  Rejected: colorsObj.danger,
                  Converted: colorsObj.student,
                  Open: colorsObj.danger,
                  'In Progress': colorsObj.warning,
                  Resolved: colorsObj.success,
                  Closed: colorsObj.textMuted,
                };
                return map[status] || colorsObj.textMuted;
              };
              return (
                <RecentItem
                  key={r._id}
                  icon="📋"
                  title={r.offense_type || 'Incident Report'}
                  status={r.status}
                  date={r.created_at}
                  statusColor={getStatusColor(r.status, colors)}
                  colors={colors}
                />
              );
            })}
          </>
        )}

        {/* Empty state */}
        {reports.length === 0 && cases.length === 0 && appeals.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All clear!</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              You have no reports or cases. Use the quick actions above if you need to report something.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const STATUS_COLORS_MAP = (colors: any): Record<string, string> => ({
  Pending: colors.warning,
  Reviewed: colors.info,
  Approved: colors.success,
  Rejected: colors.danger,
  Converted: colors.student,
  Open: colors.danger,
  'In Progress': colors.warning,
  Closed: colors.textMuted,
});

function ActionCard({ icon, label, subtitle, accent, onPress, colors }: { icon: string; label: string; subtitle: string; accent: string; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: accent }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: accent + '22' }]}>
        <Text style={styles.actionIcon}>{icon}</Text>
      </View>
      <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function RecentItem({ icon, title, status, date, statusColor, colors }: { icon: string; title: string; status: string; date: string; statusColor: string; colors: any }) {
  const finalStatusColor = STATUS_COLORS_MAP(colors)[status] ?? statusColor;
  return (
    <View style={[styles.recentItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.recentIcon}>{icon}</Text>
      <View style={styles.recentContent}>
        <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.recentDate, { color: colors.textMuted }]}>{new Date(date).toLocaleDateString()}</Text>
      </View>
      <View style={[styles.recentBadge, { backgroundColor: finalStatusColor + '22' }]}>
        <Text style={[styles.recentBadgeText, { color: finalStatusColor }]}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  avatar: { width: 42, height: 42, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  greeting: { fontSize: FontSize.xs },
  name: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, maxWidth: 200 },
  logoutBtn: { width: 38, height: 38, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  logoutIcon: { fontSize: 16 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  attentionBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, marginBottom: Spacing.md, gap: Spacing.sm },
  attentionIcon: { fontSize: 16 },
  attentionText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, flex: 1 },
  sectionLabel: { fontSize: 10, fontWeight: FontWeight.semibold, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: Spacing.lg, marginBottom: Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  statFlex: { flex: 1 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionCard: { width: '47%', borderRadius: Radius.md, borderWidth: 1, borderLeftWidth: 3, padding: Spacing.md, gap: 4 },
  actionIconWrap: { width: 40, height: 40, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  actionSubtitle: { fontSize: FontSize.xs },
  recentItem: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm + 2, marginBottom: Spacing.sm, gap: Spacing.sm },
  recentIcon: { fontSize: 20, width: 28 },
  recentContent: { flex: 1 },
  recentTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  recentDate: { fontSize: FontSize.xs, marginTop: 2 },
  recentBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  recentBadgeText: { fontSize: 10, fontWeight: FontWeight.semibold },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
});
