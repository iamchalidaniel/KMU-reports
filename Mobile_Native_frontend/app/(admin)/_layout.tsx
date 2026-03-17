import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { useTheme } from '../../../src/context/ThemeContext';
import { ActivityIndicator, View, Text } from 'react-native';
import { Brand } from '../../../src/constants/theme';

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, opacity: color === Brand.green ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={Brand.green} />
      </View>
    );
  }

  if (!user || user.role !== 'admin') return <Redirect href="/(auth)" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <TabIcon emoji="🛡️" color={color} /> }} />
      <Tabs.Screen name="cases"   options={{ title: 'Cases',     tabBarIcon: ({ color }) => <TabIcon emoji="⚖️"  color={color} /> }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports',   tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} /> }} />
      <Tabs.Screen name="students"options={{ title: 'Students',  tabBarIcon: ({ color }) => <TabIcon emoji="🎓" color={color} /> }} />
      <Tabs.Screen name="users"   options={{ title: 'Users',     tabBarIcon: ({ color }) => <TabIcon emoji="👥" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile',   tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }} />
      <Tabs.Screen name="case-detail" options={{ href: null }} />
      <Tabs.Screen name="maintenance" options={{ href: null }} />
      <Tabs.Screen name="audit"       options={{ href: null }} />
    </Tabs>
  );
}
