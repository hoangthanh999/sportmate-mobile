import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '../../services/apiServices';
import { COLORS } from '../../constants/config';

export default function ChatScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setConversations(await chatApi.getConversations()); }
    catch { } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.item} onPress={() => router.push(`/chat/${item.conversationId}`)}>
      {/* Avatar */}
      {item.otherUserAvatar ? (
        <Image source={{ uri: item.otherUserAvatar }} style={styles.avatar} />
      ) : (
        <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{item.otherUserName?.[0] ?? '?'}</Text>
        </LinearGradient>
      )}

      <View style={styles.itemContent}>
        <View style={styles.itemTop}>
          <Text style={styles.name}>{item.otherUserName}</Text>
          {item.lastMessageAt && (
            <Text style={styles.time}>
              {new Date(item.lastMessageAt).toLocaleDateString('vi-VN')}
            </Text>
          )}
        </View>
        <View style={styles.itemBottom}>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.lastMessage || 'Chưa có tin nhắn'}
          </Text>
          {item.unreadCount > 0 && (
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </LinearGradient>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin nhắn 💬</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={i => i.conversationId.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="chatbubbles-outline" size={50} color={COLORS.textMuted} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Chưa có hội thoại nào</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={COLORS.primary}
            onRefresh={() => { setRefreshing(true); load(); }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  item: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '800' },
  itemContent: { flex: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  time: { fontSize: 12, color: COLORS.textMuted },
  itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMsg: { flex: 1, fontSize: 14, color: COLORS.textSecondary },
  badge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
