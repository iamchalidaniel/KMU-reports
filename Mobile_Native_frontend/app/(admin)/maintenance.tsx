import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  SafeAreaView, ActivityIndicator, TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import { Spacing, FontSize, FontWeight, Radius } from '../../../src/constants/theme';
import { useTheme } from '../../../src/context/ThemeContext';
import { listMaintenanceAdmin, type MaintenanceReport } from '../../../src/services/adminService';

const ACCENT = '#10B981';

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#10B981', Medium: '#F59E0B', High: '#EF4444', Critical: '#DC2626',
};
const STATUS_COLORS: Record<string, string> = {
  Pending: '#F59E0B', 'In Progress': '#3B82F6', Resolved: '#10B981', Closed: '#6B7280',
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const CATEGORY_EMOJI: Record<string, string> = {
  electrical: '⚡', plumbing: '🚿', furniture: '🪑', hvac: '❄️',
  structural: '🏗️', cleaning: '🧹', other: '🔧',
};

export default function AdminMaintenance() {
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<MaintenanceReport | null>(null);
  const { colors } = useTheme();

  const load = useCallback(async () => {
    try {
      const data = await listMaintenanceAdmin();
      setReports(data);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: MaintenanceReport }) => {
    const priorityColor = PRIORITY_COLORS[item.priority || ''] || '#6B7280';
    const statusColor = STATUS_COLORS[item.status || ''] || '#6B7280';
    const emoji = CATEGORY_EMOJI[item.category || 'other'] || '🔧';
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setSelected(item)} activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <Text style={styles.emoji}>{emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.category, { color: colors.text }]}>{(item.category || 'Other').charAt(0).toUpperCase() + (item.category || 'other').slice(1)}</Text>
            <Text style={[styles.location, { color: colors.textMuted }]}>{item.location?.hall || 'N/A'}{item.location?.room ? ` · Room ${item.location.room}` : ''}</Text>
          </View>
          <View style={{ gap: 4, alignItems: 'flex-end' }}>
            <Badge label={item.priority || 'N/A'} color={priorityColor} />
            <Badge label={item.status || 'Pending'} color={statusColor} />
          </View>
        </View>
        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>{item.description}</Text>
        {item.reported_by?.name ? <Text style={[styles.reporter, { color: colors.textMuted }]}>👤 {item.reported_by.name}</Text> : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 32 }}
          ListHeaderComponent={<Text style={[styles.countLabel, { color: colors.textMuted }]}>{reports.length} maintenance report{reports.length !== 1 ? 's' : ''}</Text>}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No maintenance reports.</Text>}
        />
      )}

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Maintenance Detail</Text>
              <TouchableOpacity onPress={() => setSelected(null)}><Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}>
              <DetailRow label="Category" value={selected.category || '—'} colors={colors} />
              <DetailRow label="Priority" value={selected.priority || '—'} colors={colors} />
              <DetailRow label="Status" value={selected.status || '—'} colors={colors} />
              <DetailRow label="Hall" value={selected.location?.hall || '—'} colors={colors} />
              <DetailRow label="Room" value={selected.location?.room || '—'} colors={colors} />
              <DetailRow label="Reported by" value={selected.reported_by?.name || '—'} colors={colors} />
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Description</Text>
              <Text style={[styles.descBlock, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}>{selected.description}</Text>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  countLabel: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  card: { borderRadius: Radius.xl, padding: Spacing.md, gap: 8, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  emoji: { fontSize: 28, width: 36 },
  category: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  location: { fontSize: FontSize.xs, marginTop: 2 },
  description: { fontSize: FontSize.sm, lineHeight: 20 },
  reporter: { fontSize: FontSize.xs },
  badge: { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: FontWeight.semibold },
  empty: { textAlign: 'center', marginTop: 48, fontSize: FontSize.sm },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  modalClose: { fontSize: 20 },
  detailRow: { flexDirection: 'row', gap: Spacing.sm },
  detailLabel: { width: 100, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  detailValue: { flex: 1, fontSize: FontSize.sm },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  descBlock: { fontSize: FontSize.sm, lineHeight: 22, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1 },
});
