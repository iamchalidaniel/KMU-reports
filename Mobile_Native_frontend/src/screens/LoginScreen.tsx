import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, FontSize, FontWeight } from '../constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Login failed. Please check your credentials.';
      Alert.alert('Login Error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Text style={styles.logoText}>K</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>KMU Reports</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to your account</Text>
        </View>

        {/* Form Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@kmu.ac.ke"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={secureText}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                autoComplete="current-password"
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setSecureText(prev => !prev)}>
                <Text style={styles.eyeIcon}>{secureText ? '👁' : '🙈'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          KMU Discipline and Reporting System
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xxl },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logoContainer: { width: 72, height: 72, borderRadius: Radius.xl, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  logoText: { color: '#fff', fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md },
  card: { borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, marginBottom: Spacing.lg },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4, fontSize: FontSize.md },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  eyeIcon: { fontSize: 18 },
  button: { borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  footer: { fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing.sm },
});
