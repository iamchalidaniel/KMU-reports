import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { StyleSheet } from 'react-native';
import { Colors } from '../src/constants/theme';
import CustomSplashScreen from '../src/components/SplashScreen';

function RootLayoutNav() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  // Show custom animated splash while auth is resolving or animation isn't done
  if (isLoading || !splashDone) {
    return (
      <CustomSplashScreen
        onFinish={() => {
          if (!isLoading) setSplashDone(true);
        }}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="(public)" />
          <Stack.Screen name="(auth)" />
        </>
      ) : user?.role === 'student' ? (
        <Stack.Screen name="(student)" />
      ) : user?.role === 'admin' ? (
        <Stack.Screen name="(admin)" />
      ) : (
        <Stack.Screen name="(app)" />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
