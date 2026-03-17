import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const roleBadgeColor: Record<string, string> = {
    student: Colors.student,
    security: Colors.danger,
    maintenance: Colors.warning,
    admin: Colors.primary,
    secretary: Colors.info,
    'assistant-dean': Colors.success,
    'dean-of-students': Colors.primaryLight,
    'chief-security-officer': Colors.danger,
    'hall-warden': Colors.warning,
  };
  const accentColor = roleBadgeColor[user?.role ?? ''] ?? Colors.primary;

  const profileFields = [
    { label: 'Full Name', value: user?.name ?? 'N/A' },
    { label: 'Email', value: user?.email ?? 'N/A' },
    { label: 'Role', value: (user?.role ?? 'N/A').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
    ...(user?.studentId ? [{ label: 'Student ID', value: user.studentId }] : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={[styles.avatarContainer, { shadowColor: accentColor }]}>
          <View style={[styles.avatar, { backgroundColor: accentColor }]}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
        </View>

        <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: accentColor + '22', borderColor: accentColor + '44' }]}>
          <Text style={[styles.roleText, { color: accentColor }]}>
            {(user?.role ?? 'User').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </Text>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          {profileFields.map((field, idx) => (
            <View key={field.label} style={[styles.fieldRow, idx < profileFields.length - 1 && styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text style={styles.fieldValue}>{field.value}</Text>
            </View>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, alignItems: 'center' },
  avatarContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: FontSize.xxxl, fontWeight: FontWeight.bold },
  userName: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  roleText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  fieldRow: { padding: Spacing.md },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  fieldLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.medium, marginBottom: 2 },
  fieldValue: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  logoutBtn: {
    width: '100%',
    backgroundColor: Colors.danger + '22',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.danger + '44',
    padding: Spacing.md,
    alignItems: 'center',
  },
  logoutText: { color: Colors.danger, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
