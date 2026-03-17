import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { Spacing, FontSize, FontWeight, Radius, Brand } from '../../../src/constants/theme';
import { useTheme } from '../../../src/context/ThemeContext';
import { getAdminDashboardStats, type AdminStats } from '../../../src/services/adminService';

// kmuGreen accent
const ACCENT = Brand.green;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  const { colors } = useTheme();

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await getAdminDashboardStats();
      setStats(data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const displayName = user?.name || user?.username || 'Administrator';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting()}, {displayName}</Text>
            <Text style={[styles.subGreeting, { color: colors.textMuted }]}>Administrator · Discipline & Facilities</Text>
          </View>
        </View>

        {/* Pending reports alert */}
        {stats && stats.pendingReportsCount > 0 && (
          <TouchableOpacity style={styles.alert} onPress={() => router.push('/(admin)/reports')}>
            <Text style={styles.alertEmoji}>⚠️</Text>
            <Text style={styles.alertText}>
              {stats.pendingReportsCount} student report{stats.pendingReportsCount !== 1 ? 's' : ''} pending review
            </Text>
            <Text style={styles.alertArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Stat cards */}
        {loading ? (
          <ActivityIndicator color={ACCENT} style={{ marginVertical: 32 }} />
        ) : error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        ) : stats ? (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="Students" value={stats.studentsCount} emoji="🎓" onPress={() => router.push('/(admin)/students')} />
              <StatCard label="Cases" value={stats.casesCount} emoji="⚖️" onPress={() => router.push('/(admin)/cases')} />
              <StatCard label="Users" value={stats.usersCount} emoji="👥" onPress={() => router.push('/(admin)/users')} />
              <StatCard label="Maintenance" value={stats.maintenanceCount} emoji="🔧" onPress={() => router.push('/(admin)/maintenance')} />
            </View>

            {/* Open cases banner */}
            {stats.openCasesCount > 0 && (
              <View style={[styles.openCasesBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.openCasesText, { color: colors.text }]}>
                  🔴 {stats.openCasesCount} open/in-progress case{stats.openCasesCount !== 1 ? 's' : ''}
                </Text>
                <TouchableOpacity onPress={() => router.push('/(admin)/cases')}>
                  <Text style={styles.openCasesLink}>View all ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Top Offenses */}
            {stats.topOffenses.length > 0 && (
              <SectionCard title="Top Offense Types" colors={colors}>
                {stats.topOffenses.map((o: any, i: number) => (
                  <BarRow key={o.label} rank={i + 1} label={o.label} count={o.count} max={stats.topOffenses[0].count} color={ACCENT} colors={colors} />
                ))}
              </SectionCard>
            )}

            {/* Top Maintenance */}
            {stats.topMaintenance.length > 0 && (
              <SectionCard title="Maintenance by Category" colors={colors}>
                {stats.topMaintenance.map((m: any, i: number) => (
                  <BarRow key={m.label} rank={i + 1} label={m.label} count={m.count} max={stats.topMaintenance[0].count} color="#3B82F6" colors={colors} />
                ))}
              </SectionCard>
            )}

            {/* Quick actions */}
            <SectionCard title="Quick Actions" colors={colors}>
              <View style={styles.actionsGrid}>
                {[
                  { label: 'Manage Cases', emoji: '⚖️', href: '/(admin)/cases' },
                  { label: 'Incident Reports', emoji: '📋', href: '/(admin)/reports' },
                  { label: 'Maintenance', emoji: '🔧', href: '/(admin)/maintenance' },
                  { label: 'Audit Log', emoji: '🗂️', href: '/(admin)/audit' },
                ].map(a => (
                  <TouchableOpacity
                    key={a.label}
                    style={[styles.actionCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => router.push(a.href as any)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.actionEmoji}>{a.emoji}</Text>
                    <Text style={[styles.actionLabel, { color: colors.textMuted }]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SectionCard>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, emoji, onPress, colors }: { label: string; value: number; emoji: string; onPress: () => void; colors?: any }) {
  const themeColors = colors || useTheme().colors;
  return (
    <TouchableOpacity style={[styles.statCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color: themeColors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionCard({ title, children, colors }: { title: string; children: React.ReactNode; colors?: any }) {
  const themeColors = colors || useTheme().colors;
  return (
    <View style={[styles.sectionCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>{title}</Text>
      {children}
    </View>
  );
}

function BarRow({ rank, label, count, max, color, colors }: { rank: number; label: string; count: number; max: number; color: string; colors?: any }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const themeColors = colors || useTheme().colors;
  return (
    <View style={styles.barRow}>
      <Text style={[styles.barRank, { color: themeColors.textMuted }]}>{rank}</Text>
      <View style={{ flex: 1 }}>
        <View style={styles.barLabelRow}>
          <Text style={[styles.barLabel, { color: themeColors.text }]}>{label}</Text>
          <Text style={[styles.barCount, { color: themeColors.textMuted }]}>{count}</Text>
        </View>
        <View style={[styles.barTrack, { backgroundColor: themeColors.border }]}>
          <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1 },
  avatarWrap: { width: 52, height: 52, borderRadius: Radius.full, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26 },
  greeting: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  subGreeting: { fontSize: FontSize.sm, marginTop: 2 },
  alert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#92400E22', borderWidth: 1, borderColor: '#D97706', borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, gap: 8 },
  alertEmoji: { fontSize: 18 },
  alertText: { flex: 1, color: '#FCD34D', fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  alertArrow: { color: '#FCD34D', fontSize: 20, fontWeight: FontWeight.bold },
  errorText: { textAlign: 'center', padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: { flex: 1, minWidth: '45%', borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center', gap: 4, borderWidth: 1 },
  statEmoji: { fontSize: 28 },
  statValue: { fontSize: 28, fontWeight: FontWeight.bold, marginTop: 2 },
  statLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  openCasesBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  openCasesText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  openCasesLink: { color: ACCENT, fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
  sectionCard: { borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barRank: { width: 18, fontSize: FontSize.xs, fontWeight: FontWeight.bold, textAlign: 'center' },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: FontSize.sm, flexShrink: 1, flexGrow: 1 },
  barCount: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginLeft: 8 },
  barTrack: { height: 6, borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: Radius.full },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionCard: { flex: 1, minWidth: '45%', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, alignItems: 'center', gap: 6 },
  actionEmoji: { fontSize: 28 },
  actionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textAlign: 'center' },
});
