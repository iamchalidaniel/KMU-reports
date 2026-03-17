import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { listStudentReports, StudentReport } from '../../src/services/studentService';
import { Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

const STATUS_COLOR_MAP = (colors: any): Record<string, string> => ({
  Pending: colors.warning,
  Reviewed: colors.info,
  Approved: colors.success,
  Rejected: colors.danger,
  Converted: colors.student,
});

const SEVERITY_COLOR_MAP = (colors: any): Record<string, string> => ({
  Low: colors.success,
  Medium: colors.warning,
  High: colors.danger,
});

export default function MyReportsScreen() {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  const fetchReports = useCallback(async () => {
    try {
      const data = await listStudentReports();
      setReports(data);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.student} /></View>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Reports</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.student }]}
          onPress={() => router.push('/(student)/report-incident')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* @ts-ignore */}
      <RNFlatList
        data={reports}
        keyExtractor={(item: StudentReport) => item._id}
        contentContainerStyle={styles.list as any}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.student} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No reports yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Tap "New" to submit your first incident report.</Text>
          </View>
        }
        renderItem={({ item }: { item: StudentReport }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={[styles.cardType, { color: colors.text }]}>{item.offense_type || 'General'}</Text>
                {item.is_anonymous && (
                  <View style={[styles.anonBadge, { backgroundColor: colors.textMuted + '22' }]}>
                    <Text style={[styles.anonText, { color: colors.textMuted }]}>Anonymous</Text>
                  </View>
                )}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR_MAP(colors)[item.status] ?? colors.textMuted) + '22' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR_MAP(colors)[item.status] ?? colors.textMuted }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>

            <View style={styles.cardFooter}>
              <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR_MAP(colors)[item.severity] ?? colors.textMuted }]} />
              <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{item.severity} severity</Text>
              <Text style={[styles.cardDot, { color: colors.textMuted }]}>·</Text>
              <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                {item.incident_date
                  ? new Date(item.incident_date).toLocaleDateString()
                  : new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>

            {item.admin_comments && (
              <View style={[styles.commentBox, { backgroundColor: colors.surfaceElevated, borderLeftColor: colors.info }]}>
                <Text style={[styles.commentLabel, { color: colors.info }]}>Admin Comment</Text>
                <Text style={[styles.commentText, { color: colors.textSecondary }]}>{item.admin_comments}</Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  addBtn: { borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
  addBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm },
  card: { borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cardType: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  anonBadge: { borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  anonText: { fontSize: 10, fontWeight: FontWeight.medium },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: FontWeight.semibold },
  cardDesc: { fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.sm },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  severityDot: { width: 7, height: 7, borderRadius: Radius.full },
  cardMeta: { fontSize: FontSize.xs },
  cardDot: { fontSize: FontSize.xs },
  commentBox: { marginTop: Spacing.sm, borderRadius: Radius.sm, padding: Spacing.sm, borderLeftWidth: 3 },
  commentLabel: { fontSize: 10, fontWeight: FontWeight.semibold, marginBottom: 2 },
  commentText: { fontSize: FontSize.xs },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: FontSize.sm, textAlign: 'center' },
});
