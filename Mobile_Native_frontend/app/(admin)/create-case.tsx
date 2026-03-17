import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Brand } from '../../src/constants/theme';
import { createCase, uploadCaseEvidence, CaseDossierPayload } from '../../src/services/adminService';
import { Audio } from 'expo-av';
import SignatureScreen from 'react-native-signature-canvas';

const ACCENT = Brand.orange;

interface Statement {
  id: number;
  fullName: string;
  content: string;
  takenAt: string;
  phone: string;
  residentialAddress: string;
  tribe: string;
  village: string;
  active: boolean;
  audioUrl: string;
  sin?: string;
  signature?: string | null;
}

export default function CreateCaseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Auto-generate Case Number
  const generateCaseNumber = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `KMU/SEC/${year}/${rand}`;
  };

  const [formData, setFormData] = useState<CaseDossierPayload>({
    case_number: generateCaseNumber(),
    case_type: 'single_student',
    ob_number: '',
    incident_date: new Date().toISOString().slice(0, 10),
    description: '',
    offense_type: '',
    student_id: '',
    dossier: {
      occurrenceDocket: {
        investigatingOfficer: '',
        occurrenceBookNumber: '',
        dateTimeReported: new Date().toISOString().slice(0, 16),
        complainant: { name: '', address: '', phone: '', programOfStudy: '', yearOfStudy: '', sin: '' },
        accused: { name: '', address: '', phone: '', programOfStudy: '', yearOfStudy: '', sin: '' },
        offence: '',
        occurrenceDetails: '',
      },
      statements: [] as Statement[],
      warnAndCaution: {
        fullName: '',
        address: '',
        phone: '',
        sin: '',
        offence: '',
        occurrenceDate: '',
        occurrencePlace: '',
        signature: null,
      },
      signatures: { investigatingOfficer: null, complainant: null },
    },
  });

  // Pre-fill from report conversion
  useEffect(() => {
    if (params.studentId || params.description || params.offense) {
      updateNested('dossier.occurrenceDocket.accused.sin', params.studentId || '');
      updateNested('dossier.occurrenceDocket.accused.name', params.studentName || '');
      updateNested('dossier.occurrenceDocket.offence', params.offense || '');
      updateNested('dossier.occurrenceDocket.occurrenceDetails', params.description || '');
      setFormData(prev => ({
        ...prev,
        description: (params.description as string) || '',
        offense_type: (params.offense as string) || '',
        student_id: (params.studentId as string) || '',
        ob_number: prev.case_number
      }));
    }
  }, [params]);

  const updateNested = (path: string, value: any) => {
    const keys = path.split('.');
    setFormData((prev: any) => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const submitCase = async () => {
    if (!formData.dossier.occurrenceDocket.accused.name || !formData.dossier.occurrenceDocket.offence) {
      Alert.alert('Incomplete', 'Please fill out required accused details and offense.');
      return;
    }

    setLoading(true);
    try {
      const finalPayload = {
        ...formData,
        ob_number: formData.case_number,
        incident_date: formData.dossier.occurrenceDocket.dateTimeReported.split('T')[0],
        description: formData.dossier.occurrenceDocket.occurrenceDetails,
        offense_type: formData.dossier.occurrenceDocket.offence,
        student_id: formData.dossier.occurrenceDocket.accused.sin || formData.dossier.occurrenceDocket.accused.phone
      };

      await createCase(finalPayload);
      Alert.alert('Success', 'Case created successfully!', [
        { text: 'View Cases', onPress: () => router.replace('/(admin)/cases') }
      ]);
    } catch (err: any) {
      Alert.alert('Submission Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────── STEP 1 ─────────────────────────────────────────
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>I. Incident Details</Text>
      
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder="Investigating Officer Name"
        placeholderTextColor={colors.textMuted}
        value={formData.dossier.occurrenceDocket.investigatingOfficer}
        onChangeText={(v) => updateNested('dossier.occurrenceDocket.investigatingOfficer', v)}
      />

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Accused Student</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder="Full Name *" placeholderTextColor={colors.textMuted} value={formData.dossier.occurrenceDocket.accused.name} onChangeText={(v) => { updateNested('dossier.occurrenceDocket.accused.name', v); updateNested('dossier.warnAndCaution.fullName', v); }} />
        <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder="Student ID (SIN) *" placeholderTextColor={colors.textMuted} value={formData.dossier.occurrenceDocket.accused.sin} onChangeText={(v) => updateNested('dossier.occurrenceDocket.accused.sin', v)} />
        <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder="Phone Number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" value={formData.dossier.occurrenceDocket.accused.phone} onChangeText={(v) => updateNested('dossier.occurrenceDocket.accused.phone', v)} />
      </View>

      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="Offense Category *" placeholderTextColor={colors.textMuted} value={formData.dossier.occurrenceDocket.offence} onChangeText={(v) => updateNested('dossier.occurrenceDocket.offence', v)} />
      <TextInput style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} placeholder="Detailed incident description... (Dictation supported via OS keyboard)" placeholderTextColor={colors.textMuted} multiline numberOfLines={5} textAlignVertical="top" value={formData.dossier.occurrenceDocket.occurrenceDetails} onChangeText={(v) => updateNested('dossier.occurrenceDocket.occurrenceDetails', v)} />
    </View>
  );

  // ───────────────────────────────────────── STEP 2 (Witness + Audio) ─────────────────────────────────────────
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [activeStatementIndex, setActiveStatementIndex] = useState<number>(-1);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const startRecording = async (index: number) => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setActiveStatementIndex(index);
    } catch (err) {
      Alert.alert('Permission Denied', 'Microphone access is required to record statements.');
    }
  };

  const stopRecordingAndUpload = async () => {
    if (!recording) return;
    setRecording(null);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    if (!uri) return;

    setUploadingAudio(true);
    try {
      // Use caseId prefix for temp id
      const tempId = `temp_${Date.now()}`;
      const uploadedFilename = await uploadCaseEvidence(uri, tempId);
      
      const stmts = [...formData.dossier.statements];
      stmts[activeStatementIndex].audioUrl = uploadedFilename;
      updateNested('dossier.statements', stmts);
      Alert.alert('Uploaded', 'Voice recording attached to statement!');
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploadingAudio(false);
      setActiveStatementIndex(-1);
    }
  };

  const addEmptyStatement = () => {
    updateNested('dossier.statements', [
      ...formData.dossier.statements,
      { id: Date.now(), fullName: '', content: '', takenAt: new Date().toISOString().slice(0, 10), phone: '', residentialAddress: '', tribe: '', village: '', active: true, audioUrl: '', signature: null }
    ]);
  };

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>II. Witness Statements</Text>
      <Text style={[styles.helpText, { color: colors.textMuted }]}>
        Use OS Keyboard dictation to transcribe speech into the content area, or record an actual voice note attachment.
      </Text>

      {formData.dossier.statements.map((stmt: Statement, index: number) => (
        <View key={stmt.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder="Witness Full Name" placeholderTextColor={colors.textMuted} value={stmt.fullName} onChangeText={(v) => { const s = [...formData.dossier.statements]; s[index].fullName = v; updateNested('dossier.statements', s); }} />
          <TextInput style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder="Statement Content..." placeholderTextColor={colors.textMuted} multiline value={stmt.content} onChangeText={(v) => { const s = [...formData.dossier.statements]; s[index].content = v; updateNested('dossier.statements', s); }} />
          
          <View style={styles.audioRow}>
            {recording && activeStatementIndex === index ? (
              <TouchableOpacity style={styles.recordBtnStop} onPress={stopRecordingAndUpload}>
                <Text style={styles.recordText}>⏹ Stop Recording</Text>
              </TouchableOpacity>
            ) : stmt.audioUrl ? (
              <View style={styles.audioBadge}>
                <Text style={styles.audioText}>🎤 Audio Attached</Text>
              </View>
            ) : (
              <TouchableOpacity style={[styles.recordBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onPress={() => startRecording(index)} disabled={uploadingAudio || !!recording}>
                <Text style={[styles.recordText, { color: uploadingAudio ? colors.textMuted : ACCENT }]}>🎤 Record Voice Note</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity style={[styles.addBtn, { borderColor: ACCENT }]} onPress={addEmptyStatement}>
        <Text style={{ color: ACCENT, fontWeight: FontWeight.bold }}>+ Add Witness Statement</Text>
      </TouchableOpacity>
    </View>
  );

  // ───────────────────────────────────────── STEP 3 & 4 (Signatures) ─────────────────────────────────────────
  const [signingField, setSigningField] = useState<string | null>(null);

  const handleSignature = (signature: string) => {
    if (signingField) {
      updateNested(signingField, signature);
    }
    setSigningField(null);
  };

  const renderSignaturePad = () => {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 9999, paddingTop: 50 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20 }}>
          <Text style={{ color: colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold }}>Sign Below</Text>
          <TouchableOpacity onPress={() => setSigningField(null)}><Text style={{ color: colors.danger, fontWeight: FontWeight.bold }}>Cancel</Text></TouchableOpacity>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <SignatureScreen
            onOK={handleSignature}
            onEmpty={() => Alert.alert('Empty', 'Please sign before saving.')}
            descriptionText="Sign your name"
            clearText="Clear"
            confirmText="Save"
            webStyle={`.m-signature-pad {box-shadow: none; border: none;} .m-signature-pad--body {border: none;}`}
          />
        </View>
      </View>
    );
  };

  const SignatureButton = ({ label, targetPath, currentValue }: { label: string, targetPath: string, currentValue: string | null | undefined }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{label}</Text>
      {currentValue ? (
        <View style={{ alignItems: 'center', padding: Spacing.md }}>
          <Text style={{ color: Brand.green, fontWeight: FontWeight.bold, marginBottom: 8 }}>✓ Signed</Text>
          <TouchableOpacity onPress={() => setSigningField(targetPath)}><Text style={{ color: colors.textMuted, fontSize: FontSize.xs }}>Tap to Resign</Text></TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[styles.signBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setSigningField(targetPath)}>
          <Text style={{ color: ACCENT, fontWeight: FontWeight.bold }}>🖋 Tap to Sign</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>III. Warning and Caution</Text>
      <View style={[styles.warningBox, { backgroundColor: ACCENT + '15', borderColor: ACCENT + '30' }]}>
        <Text style={[styles.warningText, { color: colors.text }]}>
          "I, {formData.dossier.warnAndCaution.fullName || '[Accused]'}, have been warned and cautioned that a case of {formData.dossier.occurrenceDocket.offence || '[Offense]'} is being investigated against me. I am not obliged to make any statement..."
        </Text>
      </View>
      <SignatureButton label="Accused Signature" targetPath="dossier.warnAndCaution.signature" currentValue={formData.dossier.warnAndCaution.signature} />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>IV. Review & Final Sign-off</Text>
      <SignatureButton label="Investigating Officer Signature" targetPath="dossier.signatures.investigatingOfficer" currentValue={formData.dossier.signatures.investigatingOfficer} />
      <SignatureButton label="Complainant Signature (Optional)" targetPath="dossier.signatures.complainant" currentValue={formData.dossier.signatures.complainant} />
      
      <TouchableOpacity style={[styles.submitBtn, loading && styles.disabled]} onPress={submitCase} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Case Dossier</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}><Text style={{ color: colors.text, fontSize: 18 }}>← Back</Text></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Case</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.navBtn, { backgroundColor: colors.background, borderColor: colors.border }]} 
            onPress={() => setStep(prev => Math.max(1, prev - 1))}
            disabled={step === 1}
          >
            <Text style={{ color: step === 1 ? colors.textMuted : colors.text }}>Previous</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.textMuted, fontSize: FontSize.xs }}>Step {step} of 4</Text>
          <TouchableOpacity 
            style={[styles.navBtn, { backgroundColor: ACCENT, borderColor: ACCENT }]} 
            onPress={() => setStep(prev => Math.min(4, prev + 1))}
            disabled={step === 4}
          >
            <Text style={{ color: '#fff', fontWeight: FontWeight.bold }}>Next</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {signingField && renderSignaturePad()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  scrollContent: { padding: Spacing.lg, paddingBottom: 100 },
  stepContainer: { flex: 1, gap: Spacing.md },
  stepTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  helpText: { fontSize: FontSize.sm, marginBottom: Spacing.sm },
  input: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md, marginBottom: Spacing.sm },
  textArea: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md, minHeight: 120 },
  card: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, textTransform: 'uppercase', marginBottom: Spacing.sm },
  addBtn: { borderWidth: 2, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  audioRow: { flexDirection: 'row', marginTop: Spacing.sm },
  recordBtn: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  recordBtnStop: { backgroundColor: Brand.orange + '22', borderWidth: 1, borderColor: Brand.orange, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  recordText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  audioBadge: { backgroundColor: Brand.green + '22', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  audioText: { color: Brand.green, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  signBtn: { borderWidth: 1, borderStyle: 'dashed', borderRadius: Radius.md, padding: Spacing.xl, alignItems: 'center' },
  warningBox: { padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.md },
  warningText: { fontStyle: 'italic', fontSize: FontSize.md, lineHeight: 24 },
  submitBtn: { backgroundColor: Brand.green, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.xl },
  disabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderTopWidth: 1 },
  navBtn: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 10 },
});
