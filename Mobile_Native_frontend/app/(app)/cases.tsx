import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/services/apiClient';
import { ENDPOINTS } from '../../src/constants/api';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';

interface Case {
  _id: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  caseNumber?: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  open: Colors.info,
  resolved: Colors.success,
  closed: Colors.textMuted,
  active: Colors.primary,
};

export default function CasesScreen() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchCases() {
    try {
      const res = await apiClient.get(ENDPOINTS.cases);
      const data = Array.isArray(res.data) ? res.data : res.data?.cases ?? res.data?.data ?? [];
      setCases(data);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCases(); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchCases();
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
        <Text style={styles.title}>Cases</Text>
        <Text style={styles.count}>{cases.length} total</Text>
      </View>
      <FlatList
        data={cases}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>No cases found.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                {item.caseNumber ? <Text style={styles.caseNum}>#{item.caseNumber}</Text> : null}
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title ?? 'Untitled Case'}</Text>
              </View>
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
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  caseNum: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.medium, marginBottom: 2 },
  cardTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  badge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textTransform: 'capitalize' },
  cardDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: 4 },
  cardDate: { color: Colors.textMuted, fontSize: FontSize.xs },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl, fontSize: FontSize.md },
});
