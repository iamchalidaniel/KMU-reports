import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, TextInput, SafeAreaView, Modal,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Spacing, FontSize, FontWeight, Radius, Brand } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { listAllCases as getAdminCases, updateCase, type AdminCase } from '../../src/services/adminService';
import { useRouter } from 'expo-router';

const ACCENT = Brand.green;

const STATUS_COLORS: Record<string, string> = {
  Open: '#EF4444',
  'In Progress': '#F59E0B',
  Resolved: '#10B981',
  Closed: '#6B7280',
};

const SEVERITY_COLORS: Record<string, string> = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444',
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function AdminCases() {
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [filtered, setFiltered] = useState<AdminCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCase, setSelectedCase] = useState<AdminCase | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editSanctions, setEditSanctions] = useState('');
  const [saving, setSaving] = useState(false);

  const { colors } = useTheme();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const { cases: data } = await getAdminCases();
      setCases(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let res = cases;
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(c =>
        (c.student?.fullName || '').toLowerCase().includes(q) ||
        (c.student?.studentId || '').toLowerCase().includes(q) ||
        (c.offense_type || c.offenseType || '').toLowerCase().includes(q) ||
        (c.status || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) res = res.filter(c => c.status === statusFilter);
    setFiltered(res);
  }, [cases, search, statusFilter]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const openDetail = (item: AdminCase) => {
    setSelectedCase(item);
    setEditStatus(item.status || '');
    setEditSanctions(item.sanctions || '');
  };

  const saveUpdate = async () => {
    if (!selectedCase) return;
    setSaving(true);
    try {
      await updateCase(selectedCase._id, { status: editStatus, sanctions: editSanctions });
      setCases(prev => prev.map(c => c._id === selectedCase._id ? { ...c, status: editStatus, sanctions: editSanctions } : c));
      setSelectedCase(null);
    } catch {
      Alert.alert('Error', 'Failed to update case.');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: AdminCase }) => {
    const statusColor = STATUS_COLORS[item.status || ''] || '#6B7280';
    const severityColor = SEVERITY_COLORS[item.severity || ''] || '#6B7280';
    const offense = item.offense_type || item.offenseType || '—';
    const studentName = item.student?.fullName || item.student_id || '—';
    const date = item.incident_date ? new Date(item.incident_date).toLocaleDateString() : '—';

    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => openDetail(item)} activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <Text style={[styles.studentName, { color: colors.text }]} numberOfLines={1}>{studentName}</Text>
          <Badge label={item.status || 'Unknown'} color={statusColor} />
        </View>
        <Text style={[styles.offense, { color: colors.textMuted }]}>{offense}</Text>
        <View style={styles.cardMeta}>
          <Badge label={item.severity || 'N/A'} color={severityColor} />
          {item.appeal_status && item.appeal_status !== 'none' && (
            <Badge label={`Appeal: ${item.appeal_status}`} color="#8B5CF6" />
          )}
          <Text style={[styles.date, { color: colors.textMuted }]}>{date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const STATUSES = ['', 'Open', 'In Progress', 'Resolved', 'Closed'];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Search + filter */}
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.search, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
          placeholder="Search by name, offense, status…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
          {STATUSES.map(s => (
            <TouchableOpacity
              key={s || 'all'}
              style={[
                styles.chip,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 100 }}
          ListHeaderComponent={<Text style={[styles.countLabel, { color: colors.textMuted }]}>{filtered.length} cases</Text>}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No cases found.</Text>}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: ACCENT, shadowColor: ACCENT }]}
        onPress={() => router.push('/(admin)/create-case')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Detail / Edit modal */}
      <Modal visible={!!selectedCase} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedCase(null)}>
        {selectedCase && (
          <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Case Detail</Text>
              <TouchableOpacity onPress={() => setSelectedCase(null)}><Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}>
              <DetailRow label="Student" value={selectedCase.student?.fullName || selectedCase.student_id || '—'} colors={colors} />
              <DetailRow label="Student ID" value={selectedCase.student?.studentId || '—'} colors={colors} />
              <DetailRow label="Program" value={selectedCase.student?.program || '—'} colors={colors} />
              <DetailRow label="Offense" value={selectedCase.offense_type || selectedCase.offenseType || '—'} colors={colors} />
              <DetailRow label="Severity" value={selectedCase.severity || '—'} colors={colors} />
              <DetailRow label="Description" value={selectedCase.description || '—'} colors={colors} />
              <DetailRow label="Appeal Status" value={selectedCase.appeal_status || 'none'} colors={colors} />

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Status</Text>
              {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.optionRow, { borderColor: colors.border }, editStatus === s && styles.optionRowActive]}
                  onPress={() => setEditStatus(s)}
                >
                  <Text style={[styles.optionText, { color: colors.text }, editStatus === s && { color: ACCENT }]}>{s}</Text>
                  {editStatus === s && <Text style={{ color: ACCENT }}>✓</Text>}
                </TouchableOpacity>
              ))}

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Sanctions / Notes</Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={editSanctions}
                onChangeText={setEditSanctions}
                placeholder="Enter sanctions or notes…"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={saveUpdate} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
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
  toolbar: { padding: Spacing.md, gap: 8, borderBottomWidth: 1 },
  search: { borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: FontSize.sm, borderWidth: 1 },
  filterRow: { flexGrow: 0 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  chipActive: { backgroundColor: ACCENT + '22', borderColor: ACCENT },
  chipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  chipTextActive: { color: ACCENT },
  countLabel: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  card: { borderRadius: Radius.xl, padding: Spacing.md, gap: 8, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  studentName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, flex: 1, marginRight: 8 },
  offense: { fontSize: FontSize.sm },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  date: { fontSize: FontSize.xs, marginLeft: 'auto' },
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
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1 },
  optionRowActive: { backgroundColor: ACCENT + '12', borderColor: ACCENT },
  optionText: { fontSize: FontSize.sm },
  textarea: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, fontSize: FontSize.sm, minHeight: 100, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: ACCENT, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.md },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.xl, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
