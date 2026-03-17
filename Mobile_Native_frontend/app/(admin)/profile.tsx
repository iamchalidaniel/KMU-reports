import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius } from '../../../src/constants/theme';
import ThemeToggle from '../../../src/components/ThemeToggle';

function roleLabel(role?: string) {
  return (role || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#008542',                // kmuGreen
  academic_office: '#3B82F6',
  security_officer: '#F59E0B',
  chief_security_officer: '#F97316',
  hall_warden: '#06B6D4',
  electrician: '#84CC16',
  secretary: '#EC4899',
  dean_of_students: '#6366F1',
  assistant_dean: '#8B5CF6',
};

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const accent = ROLE_COLORS[user?.role || ''] || colors.primary;
  const initials = (user?.name || user?.username || 'A')[0].toUpperCase();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={[styles.avatarWrap, { backgroundColor: accent + '22' }]}>
          <Text style={[styles.avatarText, { color: accent }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.name || user?.username || 'Administrator'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: accent + '22', borderColor: accent }]}>
          <Text style={[styles.roleText, { color: accent }]}>{roleLabel(user?.role)}</Text>
        </View>

        {/* Info card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow label="Name" value={user?.name || '—'} colors={colors} />
          <InfoRow label="Username" value={user?.username || '—'} colors={colors} />
          {user?.email ? <InfoRow label="Email" value={user.email} colors={colors} /> : null}
          <InfoRow label="Role" value={roleLabel(user?.role)} colors={colors} last />
        </View>

        {/* Theme toggle */}
        <ThemeToggle />

        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.danger }]} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, colors, last }: { label: string; value: string; colors: any; last?: boolean }) {
  return (
    <View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { alignItems: 'center', padding: Spacing.lg, gap: Spacing.md, paddingBottom: 48 },
  avatarWrap: { width: 96, height: 96, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 40, fontWeight: FontWeight.bold },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  roleBadge: { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 5 },
  roleText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  card: { width: '100%', borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  rowLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  rowValue: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  logoutBtn: { width: '100%', backgroundColor: '#EF444415', borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 1 },
  logoutText: { fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
