import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Spacing, FontSize, FontWeight, Radius, Brand } from '../../../src/constants/theme';
import { useTheme } from '../../../src/context/ThemeContext';
import { listAuditLogs, type AuditLog } from '../../../src/services/adminService';

const ACCENT = '#10B981';

export default function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const load = useCallback(async () => {
    try {
      const data = await listAuditLogs();
      setLogs(data);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: AuditLog }) => {
    const ts = item.timestamp || item.created_at;
    const dateStr = ts ? new Date(ts).toLocaleString() : '—';
    return (
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        <View style={styles.dot} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.action, { color: colors.text }]}>{item.action || '—'}</Text>
          {item.user ? <Text style={[styles.user, { color: colors.textMuted }]}>👤 {item.user}</Text> : null}
          {item.details ? <Text style={[styles.details, { color: colors.textMuted }]}>{item.details}</Text> : null}
          <Text style={[styles.date, { color: colors.textMuted }]}>{dateStr}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {loading ? (
        <ActivityIndicator color={ACCENT} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 32 }}
          ListHeaderComponent={<Text style={[styles.countLabel, { color: colors.textMuted }]}>{logs.length} audit entries</Text>}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No audit logs available.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  countLabel: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT, marginTop: 6 },
  action: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  user: { fontSize: FontSize.xs, marginTop: 2 },
  details: { fontSize: FontSize.xs, marginTop: 2, lineHeight: 18 },
  date: { fontSize: FontSize.xs, marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 48, fontSize: FontSize.sm },
});
