import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TextInput, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Spacing, FontSize, FontWeight, Radius } from '../../../src/constants/theme';
import { useTheme } from '../../../src/context/ThemeContext';
import { listAllUsers, type AdminUser } from '../../../src/services/adminService';

const ACCENT = '#008542';

const ROLE_COLORS: Record<string, string> = {
  admin: '#EF4444',
  student: '#8B5CF6',
  academic_office: '#3B82F6',
  security_officer: '#F59E0B',
  chief_security_officer: '#F97316',
  hall_warden: '#06B6D4',
  electrician: '#84CC16',
  secretary: '#EC4899',
  dean_of_students: '#6366F1',
  assistant_dean: '#8B5CF6',
};

function roleLabel(role?: string) {
  return (role || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function RoleBadge({ role, colors }: { role?: string; colors: any }) {
  const roleName = roleLabel(role);
  const color = ROLE_COLORS[role || ''] || colors.textMuted;
  return (
    <View style={[styles.badge, { borderColor: color + '40', backgroundColor: color + '15' }]}>
      <Text style={[styles.badgeText, { color }]}>{roleName}</Text>
    </View>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filtered, setFiltered] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const { colors } = useTheme();

  const loadData = useCallback(async () => {
    try {
      const data = await listAllUsers();
      setUsers(data);
      setFiltered(data);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!search) { setFiltered(users); return; }
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    ));
  }, [search, users]);

  const renderItem = ({ item }: { item: AdminUser }) => {
    const initials = (item.name || item.username || '?')[0].toUpperCase();
    const color = ROLE_COLORS[item.role || ''] || colors.textMuted;
    const dateStr = item.createdAt || item.created_at;
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: color + '22' }]}>
          <Text style={[styles.avatarText, { color }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name || item.username || '—'}</Text>
          {item.email ? <Text style={[styles.email, { color: colors.textMuted }]}>{item.email}</Text> : null}
          <View style={styles.row}>
            <RoleBadge role={item.role} colors={colors} />
            {dateStr && <Text style={[styles.date, { color: colors.textMuted }]}>Joined {new Date(dateStr).toLocaleDateString()}</Text>}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>System Users</Text>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
          placeholder="Search users..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loading ? (
        <ActivityIndicator color={ACCENT} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={[styles.countLabel, { color: colors.textMuted }]}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</Text>}
          ListEmptyComponent={<View style={styles.empty}><Text style={[styles.emptyText, { color: colors.textMuted }]}>No users found.</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  searchInput: { borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.md, borderWidth: 1 },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  countLabel: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  card: { flexDirection: 'row', gap: Spacing.md, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, alignItems: 'flex-start' },
  avatar: { width: 44, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: FontWeight.bold },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  email: { fontSize: FontSize.xs, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  date: { fontSize: FontSize.xs },
  badge: { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: FontWeight.semibold },
  empty: { padding: Spacing.xl, alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: FontSize.md },
});
