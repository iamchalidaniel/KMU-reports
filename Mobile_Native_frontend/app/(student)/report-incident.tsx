import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createStudentReport, CreateStudentReportInput } from '../../src/services/studentService';
import { Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

const OFFENSE_TYPES = ['General', 'Theft', 'Assault', 'Harassment', 'Property Damage', 'Academic Misconduct', 'Noise Disturbance', 'Other'];
const SEVERITIES: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];

const SEVERITY_COLOR_MAP = (colors: any) => ({ Low: colors.success, Medium: colors.warning, High: colors.danger });

export default function ReportIncidentScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [offenseType, setOffenseType] = useState('General');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  async function handleSubmit() {
    if (!description.trim() || description.trim().length < 10) {
      Alert.alert('Validation Error', 'Description must be at least 10 characters.');
      return;
    }

    setLoading(true);
    try {
      const input: CreateStudentReportInput = {
        description: description.trim(),
        offense_type: offenseType,
        severity,
        is_anonymous: isAnonymous,
        incident_date: new Date().toISOString(),
      };
      await createStudentReport(input);
      Alert.alert('✅ Report Submitted', 'Your incident report has been submitted successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to submit report.';
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
          <Text style={[styles.title, { color: colors.text }]}>Report Incident</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Description <Text style={{ color: colors.danger }}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what happened in detail (min. 10 characters)..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.textMuted }]}>{description.length} characters</Text>
          </View>

          {/* Offense Type */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Incident Type</Text>
            <View style={styles.chipRow}>
              {OFFENSE_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    offenseType === type && { backgroundColor: colors.student, borderColor: colors.student }
                  ]}
                  onPress={() => setOffenseType(type)}
                >
                  <Text style={[
                    styles.chipText,
                    { color: colors.textSecondary },
                    offenseType === type && { color: '#fff' }
                  ]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Severity */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Severity</Text>
            <View style={styles.severityRow}>
              {SEVERITIES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.severityBtn,
                    { borderColor: SEVERITY_COLOR_MAP(colors)[s] },
                    severity === s && { backgroundColor: SEVERITY_COLOR_MAP(colors)[s] },
                  ]}
                  onPress={() => setSeverity(s)}
                >
                  <Text style={[styles.severityText, { color: severity === s ? '#fff' : SEVERITY_COLOR_MAP(colors)[s] }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Anonymous */}
          <View style={[styles.field, styles.toggleRow]}>
            <View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Submit Anonymously</Text>
              <Text style={[styles.toggleHint, { color: colors.textMuted }]}>Your identity will not be shown to staff</Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: colors.surfaceElevated, true: colors.student + '88' }}
              thumbColor={isAnonymous ? colors.student : colors.textMuted}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.student, shadowColor: colors.student }, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Submit Report</Text>}
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
  charCount: { fontSize: 11, marginTop: 4, textAlign: 'right' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  chipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  severityRow: { flexDirection: 'row', gap: Spacing.sm },
  severityBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5, alignItems: 'center' },
  severityText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleHint: { fontSize: FontSize.xs, marginTop: 2 },
  submitBtn: { borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
