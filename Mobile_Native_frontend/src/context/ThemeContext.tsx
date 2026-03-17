import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DarkColors, LightColors, type AppColors } from '../constants/theme';

const THEME_KEY = 'kmu_theme_preference';

type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: AppColors;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  isDark: true,
  colors: DarkColors,
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null
  const [mode, setModeState] = useState<ThemeMode>('dark');

  // Load saved preference on mount
  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then(saved => {
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    await SecureStore.setItemAsync(THEME_KEY, newMode);
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  // Resolve isDark from mode
  const isDark =
    mode === 'system' ? (systemScheme === 'dark') : mode === 'dark';

  const colors: AppColors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
