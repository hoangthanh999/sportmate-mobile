import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS } from '../../constants/config';

type Notification = {
  id: number;
  type: string;
  refId: number | null;
  message: string;
  isRead: number; // 0 = chưa đọc, 1 = đã đọc
  createdAt: string;
};

/** Map type → icon + màu */
const TYPE_META: Record<string, { icon: string; color: string }> = {
  MATCH: { icon: 'people-outline', color: COLORS.primary },
  SESSION_JOIN: { icon: 'calendar-outline', color: COLORS.success },
  SESSION_ACCEPT: { icon: 'checkmark-circle-outline', color: COLORS.success },
  SESSION_CANCEL: { icon: 'close-circle-outline', color: COLORS.error },
  RATING: { icon: 'star-outline', color: '#FFD700' },
  REPORT: { icon: 'flag-outline', color: COLORS.warning },
  DEFAULT: { icon: 'notifications-outline', color: COLORS.textMuted },
};

function getMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.DEFAULT;
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return d.toLocaleDateString('vi-VN');
  } catch { return ''; }
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications', { params: { page: 0, size: 50 } });
      const data: Notification[] = res.data.data ?? [];
      setItems(data);
      setUnreadCount(data.filter(n => n.isRead === 0).length);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (item: Notification) => {
    if (item.isRead === 1) return;
    try {
      await api.patch(`/api/notifications/${item.id}/read`);
      setItems(prev =>
        prev.map(n => n.id === item.id ? { ...n, isRead: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setItems(prev => prev.map(n => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const meta = getMeta(item.type);
    const isUnread = item.isRead === 0;

    return (
      <TouchableOpacity
        style={[styles.card, isUnread && styles.cardUnread]}
        onPress={() => markRead(item)}
        activeOpacity={0.75}
      >
        {/* Icon bubble */}
        <View style={[styles.iconBubble, { backgroundColor: meta.color + '22' }]}>
          <Ionicons name={meta.icon as any} size={22} color={meta.color} />
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={[styles.message, isUnread && styles.messageUnread]}>
            {item.message}
          </Text>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
        </View>

        {/* Unread dot */}
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={markAllRead} disabled={unreadCount === 0}>
          <Text style={[styles.markAllText, unreadCount === 0 && { opacity: 0.4 }]}>
            Đọc tất cả
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, items.length === 0 && { flex: 1 }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
              <Text style={styles.emptySubtitle}>
                Các hoạt động như ghép đôi, tham gia buổi tập, đánh giá{'\n'}sẽ xuất hiện ở đây.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={COLORS.primary}
              onRefresh={() => { setRefreshing(true); load(); }}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: { width: 40 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerBadge: {
    backgroundColor: COLORS.error, borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 1, minWidth: 20, alignItems: 'center',
  },
  headerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  markAllText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },

  list: { padding: 12, gap: 8 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardUnread: {
    borderColor: COLORS.primary + '50',
    backgroundColor: COLORS.primary + '08',
  },
  iconBubble: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  message: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  messageUnread: { color: COLORS.text, fontWeight: '600' },
  timeText: { color: COLORS.textMuted, fontSize: 12 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySubtitle: {
    fontSize: 14, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 20,
  },
});
