import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TextInput, SafeAreaView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Spacing, FontSize, FontWeight, Radius, Brand } from '../../../src/constants/theme';
import { useTheme } from '../../../src/context/ThemeContext';
import { listAllStudents, type AdminStudent } from '../../../src/services/adminService';

const ACCENT = Brand.green;

export default function AdminStudents() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [filtered, setFiltered] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const { colors } = useTheme();

  const loadData = useCallback(async () => {
    try {
      const data = await listAllStudents();
      setStudents(data);
      setFiltered(data);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!search) { setFiltered(students); return; }
    const q = search.toLowerCase();
    setFiltered(students.filter(s =>
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.studentId || '').toLowerCase().includes(q) ||
      (s.program || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    ));
  }, [search, students]);

  const renderItem = ({ item }: { item: AdminStudent }) => (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.rowInner}>
        <View style={[styles.avatar, { backgroundColor: ACCENT + '22' }]}>
          <Text style={[styles.avatarText, { color: ACCENT }]}>{(item.fullName || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{item.fullName || '—'}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>{item.studentId || '—'} · {item.program || 'N/A'}</Text>
          {item.email ? <Text style={[styles.sub, { color: colors.textMuted }]}>{item.email}</Text> : null}
          {item.hall ? <Text style={[styles.sub, { color: colors.textMuted }]}>🏠 {item.hall}</Text> : null}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Students</Text>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
          placeholder="Search by name, ID, or email..."
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
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {search ? 'No students match your search.' : 'No students found.'}
                </Text>
              </View>
            ) : null
          }
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
  row: { borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1 },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20 },
  info: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 2 },
  sub: { fontSize: FontSize.sm },
  empty: { padding: Spacing.xl, alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: FontSize.md },
});
