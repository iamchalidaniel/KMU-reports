import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';
import ThemeToggle from '../../src/components/ThemeToggle';

export default function StudentProfileScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const fields = [
    { label: 'Full Name', value: user?.name ?? 'N/A' },
    { label: 'Email', value: user?.email ?? 'N/A' },
    { label: 'Role', value: 'Student' },
    ...(user?.studentId ? [{ label: 'Student ID', value: user.studentId }] : []),
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={[styles.avatarWrap, { shadowColor: colors.student }]}>
          <View style={[styles.avatar, { backgroundColor: colors.student }]}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? 'S'}</Text>
          </View>
        </View>

        <Text style={[styles.name, { color: colors.text }]}>{user?.name ?? 'Student'}</Text>
        <View style={[styles.rolePill, { backgroundColor: colors.student + '22', borderColor: colors.student + '44' }]}>
          <View style={[styles.roleStatusDot, { backgroundColor: colors.student }]} />
          <Text style={[styles.roleText, { color: colors.student }]}>Student</Text>
        </View>

        {/* Info card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {fields.map((f, i) => (
            <View key={f.label} style={[styles.fieldRow, i < fields.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{f.label}</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* Theme toggle */}
        <View style={styles.toggleWrap}>
          <ThemeToggle />
        </View>

        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.danger + '44', backgroundColor: colors.danger + '15' }]} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, alignItems: 'center' },
  avatarWrap: { marginTop: Spacing.lg, marginBottom: Spacing.md, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  avatar: { width: 88, height: 88, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, borderWidth: 1, marginBottom: Spacing.xl },
  roleStatusDot: { width: 7, height: 7, borderRadius: Radius.full },
  roleText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  card: { width: '100%', borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: Spacing.md },
  fieldRow: { padding: Spacing.md },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, marginBottom: 2 },
  fieldValue: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  toggleWrap: { width: '100%', marginBottom: Spacing.md },
  logoutBtn: { width: '100%', borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, alignItems: 'center' },
  logoutText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
