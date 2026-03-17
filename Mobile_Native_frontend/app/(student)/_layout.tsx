import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Redirect } from 'expo-router';

export default function StudentLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { colors } = useTheme();

  if (!isLoading && (!isAuthenticated || user?.role !== 'student')) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.student,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Cases',
          tabBarIcon: ({ color }) => <TabIcon icon="⚖️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="appeals"
        options={{
          title: 'Appeals',
          tabBarIcon: ({ color }) => <TabIcon icon="🏛️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} />,
        }}
      />
      {/* These screens are modals/push-screens, hidden from the tab bar */}
      <Tabs.Screen name="report-incident" options={{ href: null }} />
      <Tabs.Screen name="request-repair" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{icon}</Text>;
}
