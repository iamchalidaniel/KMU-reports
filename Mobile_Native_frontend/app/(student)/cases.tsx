import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listStudentCases, submitAppeal, StudentCase } from '../../src/services/studentService';
import { Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

const STATUS_COLOR_MAP = (colors: any): Record<string, string> => ({
  Open: colors.danger,
  'In Progress': colors.warning,
  Resolved: colors.success,
  Closed: colors.textMuted,
  Dismissed: colors.textMuted,
});
const APPEAL_STATUS_COLOR_MAP = (colors: any): Record<string, string> => ({
  pending: colors.warning,
  approved: colors.success,
  rejected: colors.danger,
});

export default function MyCasesScreen() {
  const [cases, setCases] = useState<StudentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appealModal, setAppealModal] = useState<{ visible: boolean; caseId: string | null }>({ visible: false, caseId: null });
  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const { colors } = useTheme();

  const fetchCases = useCallback(async () => {
    try {
      const data = await listStudentCases();
      setCases(data);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCases();
    setRefreshing(false);
  };

  const openAppealModal = (caseId: string) => {
    setAppealReason('');
    setAppealModal({ visible: true, caseId });
  };

  const handleSubmitAppeal = async () => {
    if (!appealReason.trim() || !appealModal.caseId) {
      Alert.alert('Required', 'Please provide a reason for your appeal.');
      return;
    }
    setSubmittingAppeal(true);
    try {
      await submitAppeal(appealModal.caseId, appealReason.trim());
      setAppealModal({ visible: false, caseId: null });
      Alert.alert('✅ Appeal Submitted', 'Your appeal has been submitted and is under review.');
      fetchCases();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to submit appeal.';
      Alert.alert('Error', msg);
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.danger} /></View>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Cases</Text>
        <Text style={[styles.count, { color: colors.textMuted }]}>{cases.length} total</Text>
      </View>

      {/* @ts-ignore */}
      <RNFlatList
        data={cases}
        keyExtractor={(item: StudentCase) => item._id}
        contentContainerStyle={styles.list as any}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.danger} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚖️</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No cases</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>You have no disciplinary cases on record.</Text>
          </View>
        }
        renderItem={({ item }: { item: StudentCase }) => {
          const hasAppeal = !!item.appeal_status;
          const canAppeal = !hasAppeal && (item.status === 'Open' || item.status === 'In Progress' || item.status === 'Resolved');
          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardType, { color: colors.text }]}>{item.offense_type || 'Disciplinary Case'}</Text>
                  {item.incident_date && (
                    <Text style={[styles.cardDate, { color: colors.textMuted }]}>{new Date(item.incident_date).toLocaleDateString()}</Text>
                  )}
                </View>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLOR_MAP(colors)[item.status ?? ''] ?? colors.textMuted) + '22' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLOR_MAP(colors)[item.status ?? ''] ?? colors.textMuted }]}>
                    {item.status ?? 'Unknown'}
                  </Text>
                </View>
              </View>

              {item.description && (
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
              )}

              {item.sanctions && (
                <View style={[styles.sanctionsBox, { backgroundColor: colors.danger + '11', borderLeftColor: colors.danger }]}>
                  <Text style={[styles.sanctionsLabel, { color: colors.danger }]}>Sanction</Text>
                  <Text style={[styles.sanctionsText, { color: colors.textSecondary }]}>{item.sanctions}</Text>
                </View>
              )}

              {/* Appeal status */}
              {hasAppeal && (
                <View style={[styles.appealStatus, { backgroundColor: (APPEAL_STATUS_COLOR_MAP(colors)[item.appeal_status!] ?? colors.textMuted) + '15' }]}>
                  <Text style={[styles.appealStatusText, { color: APPEAL_STATUS_COLOR_MAP(colors)[item.appeal_status!] ?? colors.textMuted }]}>
                    🏛️ Appeal {item.appeal_status?.charAt(0).toUpperCase() + (item.appeal_status?.slice(1) ?? '')}
                  </Text>
                  {item.appeal_decision && (
                    <Text style={[styles.appealDecision, { color: colors.textSecondary }]}>{item.appeal_decision}</Text>
                  )}
                </View>
              )}

              {canAppeal && (
                <TouchableOpacity
                  style={[styles.appealBtn, { backgroundColor: colors.info + '22', borderColor: colors.info + '44' }]}
                  onPress={() => openAppealModal(item._id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.appealBtnText, { color: colors.info }]}>Submit Appeal</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />


      {/* Appeal Modal */}
      <Modal visible={appealModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Submit Appeal</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Provide a clear reason for your appeal. Appeals cannot be withdrawn once submitted.</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
              value={appealReason}
              onChangeText={setAppealReason}
              placeholder="Explain why you are appealing this case..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setAppealModal({ visible: false, caseId: null })}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.info }, submittingAppeal && styles.modalSubmitDisabled]}
                onPress={handleSubmitAppeal}
                disabled={submittingAppeal}
              >
                {submittingAppeal
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalSubmitText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  card: { borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  cardType: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  cardDate: { fontSize: FontSize.xs, marginTop: 2 },
  badge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: FontWeight.semibold },
  cardDesc: { fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.sm },
  sanctionsBox: { borderRadius: Radius.sm, padding: Spacing.sm, borderLeftWidth: 2, marginBottom: Spacing.sm },
  sanctionsLabel: { fontSize: 10, fontWeight: FontWeight.bold, marginBottom: 2 },
  sanctionsText: { fontSize: FontSize.xs },
  appealStatus: { borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.sm },
  appealStatusText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  appealDecision: { fontSize: FontSize.xs, marginTop: 2 },
  appealBtn: { borderRadius: Radius.md, borderWidth: 1, paddingVertical: Spacing.xs + 2, alignItems: 'center', marginTop: Spacing.xs },
  appealBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: FontSize.sm, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, borderTopWidth: 1 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.xs },
  modalSubtitle: { fontSize: FontSize.sm, marginBottom: Spacing.md, lineHeight: 20 },
  modalInput: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md },
  modalTextArea: { height: 100 },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  modalCancelBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },
  modalCancelText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  modalSubmitBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  modalSubmitDisabled: { opacity: 0.6 },
  modalSubmitText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
