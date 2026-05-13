import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import api from '../../services/api';
import { COLORS } from '../../constants/config';

export default function TabLayout() {
  const [unreadNotif, setUnreadNotif] = useState(0);

  useEffect(() => {
    // Poll unread count khi app load
    api.get('/api/notifications/unread-count')
      .then(res => setUnreadNotif(res.data.data ?? 0))
      .catch(() => {});
  }, []);

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
      <Tabs.Screen name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="notifications-outline" size={size} color={color} />
              {unreadNotif > 0 && (
                <View style={{
                  position: 'absolute', top: -4, right: -6,
                  backgroundColor: COLORS.error, borderRadius: 8,
                  minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
                  paddingHorizontal: 3,
                }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                    {unreadNotif > 99 ? '99+' : unreadNotif}
                  </Text>
                </View>
              )}
            </View>
          ),
        }} />
      <Tabs.Screen name="chat"
        options={{ title: 'Tin nhắn', tabBarIcon: ({ color, size }) =>
          <Ionicons name="chatbubbles" size={size} color={color} /> }} />
      <Tabs.Screen name="profile"
        options={{ title: 'Hồ sơ', tabBarIcon: ({ color, size }) =>
          <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}
