import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createMaintenanceReport, MaintenanceCategory, MaintenancePriority } from '../../src/services/studentService';
import { Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

const CATEGORIES: Array<{ value: MaintenanceCategory; label: string; icon: string }> = [
  { value: 'plumbing', label: 'Plumbing', icon: '🚿' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'furniture', label: 'Furniture', icon: '🪑' },
  { value: 'structural', label: 'Structural', icon: '🏗️' },
  { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { value: 'pest_control', label: 'Pest Control', icon: '🐛' },
  { value: 'other', label: 'Other', icon: '🔧' },
];

/* To be initialized dynamically with theme context */
const getPrioritiesMap = (colors: any): Array<{ value: MaintenancePriority; label: string; color: string }> => [
  { value: 'Low', label: 'Low', color: colors.success },
  { value: 'Medium', label: 'Medium', color: colors.warning },
  { value: 'High', label: 'High', color: colors.danger },
  { value: 'Critical', label: 'Critical', color: colors.danger }, 
];

export default function RequestRepairScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<MaintenanceCategory>('other');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>('Medium');
  const [hall, setHall] = useState('');
  const [room, setRoom] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();
  
  const PRIORITIES = getPrioritiesMap(colors);

  async function handleSubmit() {
    if (!description.trim() || description.trim().length < 5) {
      Alert.alert('Validation Error', 'Please provide a description of the issue.');
      return;
    }

    setLoading(true);
    try {
      await createMaintenanceReport({
        category,
        description: description.trim(),
        priority,
        location: {
          hall: hall.trim() || undefined,
          room: room.trim() || undefined,
        },
      });
      Alert.alert('✅ Request Submitted', 'Your maintenance request has been submitted successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to submit request.';
      Alert.alert('Submission Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Request Repair</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Category */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    category === cat.value && { borderColor: colors.success, backgroundColor: colors.success + '18' }
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[
                    styles.categoryLabel,
                    { color: colors.textSecondary },
                    category === cat.value && { color: colors.success }
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Description <Text style={{ color: colors.danger }}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Location (optional)</Text>
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.input, styles.locationInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={hall}
                onChangeText={setHall}
                placeholder="Hall / Block"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.input, styles.locationInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={room}
                onChangeText={setRoom}
                placeholder="Room No."
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Priority */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityBtn,
                    { borderColor: p.color },
                    priority === p.value && { backgroundColor: p.color },
                  ]}
                  onPress={() => setPriority(p.value)}
                >
                  <Text style={[styles.priorityText, { color: priority === p.value ? '#fff' : p.color }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.success, shadowColor: colors.success }, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Submit Request</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: Radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4, fontSize: FontSize.md },
  textArea: { height: 120 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  categoryCard: { width: '30%', borderRadius: Radius.md, borderWidth: 1, paddingVertical: Spacing.sm, alignItems: 'center', gap: 4 },
  categoryIcon: { fontSize: 24 },
  categoryLabel: { fontSize: 11, fontWeight: FontWeight.medium, textAlign: 'center' },
  locationRow: { flexDirection: 'row', gap: Spacing.sm },
  locationInput: { flex: 1 },
  priorityRow: { flexDirection: 'row', gap: Spacing.sm },
  priorityBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, alignItems: 'center' },
  priorityText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  submitBtn: { borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
