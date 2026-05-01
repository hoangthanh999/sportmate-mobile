import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index"
        options={{ title: 'Khám phá', tabBarIcon: ({ color, size }) =>
          <Ionicons name="flash" size={size} color={color} /> }} />
      <Tabs.Screen name="sessions"
        options={{ title: 'Buổi tập', tabBarIcon: ({ color, size }) =>
          <Ionicons name="people" size={size} color={color} /> }} />
      <Tabs.Screen name="map"
        options={{ title: 'Bản đồ', tabBarIcon: ({ color, size }) =>
          <Ionicons name="map" size={size} color={color} /> }} />
      <Tabs.Screen name="chat"
        options={{ title: 'Tin nhắn', tabBarIcon: ({ color, size }) =>
          <Ionicons name="chatbubbles" size={size} color={color} /> }} />
      <Tabs.Screen name="profile"
        options={{ title: 'Hồ sơ', tabBarIcon: ({ color, size }) =>
          <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}
