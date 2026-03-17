import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, SafeAreaView, Modal, ScrollView,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { Spacing, FontSize, FontWeight, Radius } from '../../../src/constants/theme';
import { useTheme } from '../../../src/context/ThemeContext';
import { listAllStudentReports, updateStudentReport, type AdminStudentReport } from '../../../src/services/adminService';

const ACCENT = '#10B981';

const STATUS_COLORS: Record<string, string> = {
  Pending: '#F59E0B',
  Reviewed: '#3B82F6',
  Resolved: '#10B981',
  Dismissed: '#6B7280',
};
const SEVERITY_COLORS: Record<string, string> = {
  Low: '#10B981', Medium: '#F59E0B', High: '#EF4444',
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function getStudentName(r: AdminStudentReport) {
  if (r.is_anonymous) return '🕵️ Anonymous';
  if (typeof r.student_id === 'object' && r.student_id?.fullName) return r.student_id.fullName;
  if (r.student_name) return r.student_name;
  return String(r.student_id || '—');
}

export default function AdminReports() {
  const [reports, setReports] = useState<AdminStudentReport[]>([]);
  const [filtered, setFiltered] = useState<AdminStudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<AdminStudentReport | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [saving, setSaving] = useState(false);
  const { colors } = useTheme();

  const load = useCallback(async () => {
    try {
      const { reports: data } = await listAllStudentReports();
      setReports(data);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let res = reports;
    if (statusFilter) res = res.filter(r => r.status === statusFilter);
    setFiltered(res);
  }, [reports, statusFilter]);

  const openDetail = (item: AdminStudentReport) => {
    setSelected(item);
    setNewStatus(item.status || 'Pending');
    setAdminComment('');
  };

  const saveUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateStudentReport(selected._id, { status: newStatus, admin_comments: adminComment });
      setReports(prev => prev.map(r => r._id === selected._id ? { ...r, status: newStatus } : r));
      setSelected(null);
    } catch {
      Alert.alert('Error', 'Failed to update report.');
    } finally {
      setSaving(false);
    }
  };

  const STATUSES = ['', 'Pending', 'Reviewed', 'Resolved', 'Dismissed'];

  const renderItem = ({ item }: { item: AdminStudentReport }) => {
    const statusColor = STATUS_COLORS[item.status || ''] || '#6B7280';
    const severityColor = SEVERITY_COLORS[item.severity || ''] || '#6B7280';
    const date = item.created_at ? new Date(item.created_at).toLocaleDateString() : '—';
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => openDetail(item)} activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <Text style={[styles.studentName, { color: colors.text }]} numberOfLines={1}>{getStudentName(item)}</Text>
          <Badge label={item.status || 'Pending'} color={statusColor} />
        </View>
        <Text style={[styles.offense, { color: colors.textMuted }]}>{item.offense_type || 'Incident'}</Text>
        <Text style={[styles.description, { color: colors.textSecondary || colors.textMuted }]} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardMeta}>
          {item.severity && <Badge label={item.severity} color={severityColor} />}
          <Text style={[styles.date, { color: colors.textMuted }]}>{date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {STATUSES.map(s => (
            <TouchableOpacity
              key={s || 'all'}
              style={[
                styles.chip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                statusFilter === s && styles.chipActive
              ]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.chipText, { color: colors.textMuted }, statusFilter === s && styles.chipTextActive]}>{s || 'All'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={ACCENT} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 32 }}
          ListHeaderComponent={<Text style={[styles.countLabel, { color: colors.textMuted }]}>{filtered.length} report{filtered.length !== 1 ? 's' : ''}</Text>}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No reports found.</Text>}
        />
      )}

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Incident Report</Text>
              <TouchableOpacity onPress={() => setSelected(null)}><Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}>
              <DetailRow label="Submitted by" value={getStudentName(selected)} colors={colors} />
              <DetailRow label="Offense" value={selected.offense_type || 'N/A'} colors={colors} />
              <DetailRow label="Severity" value={selected.severity || 'N/A'} colors={colors} />
              <DetailRow label="Anonymous" value={selected.is_anonymous ? 'Yes' : 'No'} colors={colors} />
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Description</Text>
              <Text style={[styles.descBlock, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}>{selected.description}</Text>

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Update Status</Text>
              {['Pending', 'Reviewed', 'Resolved', 'Dismissed'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.optionRow, { borderColor: colors.border }, newStatus === s && styles.optionRowActive]}
                  onPress={() => setNewStatus(s)}
                >
                  <Text style={[styles.optionText, { color: colors.text }, newStatus === s && { color: ACCENT }]}>{s}</Text>
                  {newStatus === s && <Text style={{ color: ACCENT }}>✓</Text>}
                </TouchableOpacity>
              ))}

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Admin Comment</Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={adminComment}
                onChangeText={setAdminComment}
                placeholder="Add comment or findings…"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={saveUpdate} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
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
  toolbar: { padding: Spacing.md, borderBottomWidth: 1 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  chipActive: { backgroundColor: ACCENT + '22', borderColor: ACCENT },
  chipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  chipTextActive: { color: ACCENT },
  countLabel: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  card: { borderRadius: Radius.xl, padding: Spacing.md, gap: 6, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  studentName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, flex: 1, marginRight: 8 },
  offense: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  description: { fontSize: FontSize.sm, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  date: { fontSize: FontSize.xs, marginLeft: 'auto' },
  badge: { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: FontWeight.semibold },
  empty: { textAlign: 'center', marginTop: 48, fontSize: FontSize.sm },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  modalClose: { fontSize: 20 },
  detailRow: { flexDirection: 'row', gap: Spacing.sm },
  detailLabel: { width: 110, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  detailValue: { flex: 1, fontSize: FontSize.sm },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  descBlock: { fontSize: FontSize.sm, lineHeight: 22, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1 },
  optionRowActive: { backgroundColor: ACCENT + '12', borderColor: ACCENT },
  optionText: { fontSize: FontSize.sm },
  textarea: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, fontSize: FontSize.sm, minHeight: 96, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: ACCENT, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
