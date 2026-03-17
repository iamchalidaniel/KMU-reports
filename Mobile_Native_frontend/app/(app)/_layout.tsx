import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { Redirect } from 'expo-router';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: 'Reports', tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} /> }}
      />
      <Tabs.Screen
        name="cases"
        options={{ title: 'Cases', tabBarIcon: ({ color }) => <TabIcon icon="⚖️" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, color }}>{icon}</Text>;
}
