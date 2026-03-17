import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listAppeals, Appeal } from '../../src/services/studentService';
import { Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

const APPEAL_STATUS_COLOR_MAP = (colors: any): Record<string, string> => ({
  pending: colors.warning,
  approved: colors.success,
  rejected: colors.danger,
});
const APPEAL_STATUS_ICON: Record<string, string> = {
  pending: '⏳',
  approved: '✅',
  rejected: '❌',
};

export default function AppealsScreen() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const fetchAppeals = useCallback(async () => {
    try {
      const data = await listAppeals();
      setAppeals(data);
    } catch {
      setAppeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppeals(); }, [fetchAppeals]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppeals();
    setRefreshing(false);
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.warning} /></View>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Appeals</Text>
        <Text style={[styles.count, { color: colors.textMuted }]}>{appeals.length} total</Text>
      </View>

      {/* @ts-ignore */}
      <RNFlatList
        data={appeals}
        keyExtractor={(item: Appeal) => item._id}
        contentContainerStyle={styles.list as any}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.warning} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏛️</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No appeals</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              You have not submitted any appeals. You can appeal a case from the "My Cases" screen.
            </Text>
          </View>
        }
        renderItem={({ item }: { item: Appeal }) => {
          const statusColor = APPEAL_STATUS_COLOR_MAP(colors)[item.appealStatus ?? ''] ?? colors.textMuted;
          const statusIcon = APPEAL_STATUS_ICON[item.appealStatus ?? ''] ?? '❓';
          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: statusColor }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.statusIcon}>{statusIcon}</Text>
                  <View>
                    <Text style={[styles.cardType, { color: colors.text }]}>{item.offense_type || 'Appeal'}</Text>
                    {item.appealDate && (
                      <Text style={[styles.cardDate, { color: colors.textMuted }]}>Filed {new Date(item.appealDate).toLocaleDateString()}</Text>
                    )}
                  </View>
                </View>
                <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
                  <Text style={[styles.badgeText, { color: statusColor }]}>
                    {item.appealStatus
                      ? item.appealStatus.charAt(0).toUpperCase() + item.appealStatus.slice(1)
                      : 'Unknown'}
                  </Text>
                </View>
              </View>

              {item.appealReason && (
                <View style={[styles.reasonBox, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={[styles.reasonLabel, { color: colors.textMuted }]}>Your Reason</Text>
                  <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{item.appealReason}</Text>
                </View>
              )}

              {item.appealDecision && (
                <View style={[styles.decisionBox, { backgroundColor: colors.surfaceElevated, borderLeftColor: statusColor }]}>
                  <Text style={[styles.decisionLabel, { color: statusColor }]}>
                    Decision
                  </Text>
                  <Text style={[styles.decisionText, { color: colors.textSecondary }]}>{item.appealDecision}</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  count: { fontSize: FontSize.sm },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm },
  card: { borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderLeftWidth: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  statusIcon: { fontSize: 22 },
  cardType: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  cardDate: { fontSize: FontSize.xs, marginTop: 2 },
  badge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: FontWeight.semibold },
  reasonBox: { borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.sm },
  reasonLabel: { fontSize: 10, fontWeight: FontWeight.bold, marginBottom: 2 },
  reasonText: { fontSize: FontSize.sm, lineHeight: 20 },
  decisionBox: { borderRadius: Radius.sm, padding: Spacing.sm, borderLeftWidth: 2 },
  decisionLabel: { fontSize: 10, fontWeight: FontWeight.bold, marginBottom: 2 },
  decisionText: { fontSize: FontSize.sm, lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
});
