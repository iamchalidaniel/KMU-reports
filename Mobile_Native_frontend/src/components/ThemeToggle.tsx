import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Radius, FontSize, FontWeight, Spacing } from '../constants/theme';

/**
 * A compact 3-way theme selector: Dark | System | Light
 * Place on any profile/settings screen.
 */
export default function ThemeToggle() {
  const { mode, setMode, isDark, colors } = useTheme();

  const options: Array<{ key: 'dark' | 'system' | 'light'; label: string; emoji: string }> = [
    { key: 'dark',   label: 'Dark',   emoji: '🌙' },
    { key: 'system', label: 'Auto',   emoji: '📱' },
    { key: 'light',  label: 'Light',  emoji: '☀️' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Appearance</Text>
      <View style={[styles.track, { backgroundColor: colors.surfaceElevated }]}>
        {options.map(opt => {
          const active = mode === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.option,
                active && { backgroundColor: colors.primary },
              ]}
              onPress={() => setMode(opt.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{opt.emoji}</Text>
              <Text style={[
                styles.optLabel,
                { color: active ? '#fff' : colors.textSecondary },
                active && { fontWeight: FontWeight.bold },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 10,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  track: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  emoji: { fontSize: 14 },
  optLabel: { fontSize: FontSize.sm },
});
