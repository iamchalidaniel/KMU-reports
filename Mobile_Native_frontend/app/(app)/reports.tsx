import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/services/apiClient';
import { ENDPOINTS } from '../../src/constants/api';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';

interface Report {
  _id: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  type?: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  resolved: Colors.success,
  open: Colors.info,
  closed: Colors.textMuted,
};

export default function ReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchReports() {
    try {
      const res = await apiClient.get(ENDPOINTS.studentReports);
      const data = Array.isArray(res.data) ? res.data : res.data?.reports ?? res.data?.data ?? [];
      setReports(data);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchReports(); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.count}>{reports.length} total</Text>
      </View>
      <FlatList
        data={reports}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>No reports found.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title ?? item.type ?? 'Report'}</Text>
              <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status ?? ''] ?? Colors.textMuted) + '22' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status ?? ''] ?? Colors.textMuted }]}>
                  {item.status ?? 'N/A'}
                </Text>
              </View>
            </View>
            {item.description ? (
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
            ) : null}
            {item.createdAt ? (
              <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            ) : null}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  count: { color: Colors.textMuted, fontSize: FontSize.sm },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, flex: 1 },
  badge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'capitalize' },
  cardDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: 4 },
  cardDate: { color: Colors.textMuted, fontSize: FontSize.xs },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl, fontSize: FontSize.md },
});
