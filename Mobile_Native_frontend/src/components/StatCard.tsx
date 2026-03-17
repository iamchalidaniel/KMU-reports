import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, FontSize, FontWeight } from '../constants/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: string;
  icon?: string;
  style?: ViewStyle;
}

export default function StatCard({ title, value, subtitle, accent, icon, style }: StatCardProps) {
  const { colors } = useTheme();
  const cardAccent = accent ?? colors.primary;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: cardAccent }, style]}>
      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
          <Text style={[styles.value, { color: cardAccent }]}>{value}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
        </View>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: cardAccent + '22' }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderLeftWidth: 3, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  content: { flex: 1 },
  title: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, marginBottom: 4 },
  value: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginBottom: 2 },
  subtitle: { fontSize: FontSize.xs },
  iconWrap: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
  icon: { fontSize: 22 },
});
