import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../constants/theme';

interface TabItem {
  label: string;
  icon: string;
  href: string;
}

interface BottomNavProps {
  tabs: TabItem[];
}

export default function BottomNav({ tabs }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bar}>
        {tabs.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <TouchableOpacity
              key={tab.href}
              style={styles.tab}
              onPress={() => router.push(tab.href as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Text style={styles.icon}>{tab.icon}</Text>
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.surface },
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  iconWrap: { width: 40, height: 28, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: Colors.primary + '22' },
  icon: { fontSize: 20 },
  label: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  labelActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
});
