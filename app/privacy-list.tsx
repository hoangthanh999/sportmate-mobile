import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { privacyApi } from '../services/apiServices';
import { COLORS } from '../constants/config';

type PrivacyUser = {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  type: number; // 1 = ẩn, 2 = chặn
};

type TabType = 1 | 2;

export default function PrivacyListScreen() {
  const [tab, setTab] = useState<TabType>(1);
  const [items, setItems] = useState<PrivacyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  const load = useCallback(async (type: TabType) => {
    try {
      const data = await privacyApi.list(type);
      setItems(data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(tab);
  }, [tab, load]);

  const handleRemove = (item: PrivacyUser) => {
    const action = item.type === 1 ? 'bỏ ẩn' : 'bỏ chặn';
    Alert.alert(
      `${item.type === 1 ? 'Bỏ ẩn' : 'Bỏ chặn'} người dùng`,
      `Bạn có chắc muốn ${action} "${item.fullName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: item.type === 1 ? 'Bỏ ẩn' : 'Bỏ chặn',
          style: 'destructive',
          onPress: async () => {
            setRemoving(item.userId);
            try {
              await privacyApi.remove(item.userId);
              setItems(prev => prev.filter(u => u.userId !== item.userId));
            } catch {
              Alert.alert('Lỗi', 'Không thể thực hiện. Thử lại sau.');
            } finally {
              setRemoving(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: PrivacyUser }) => {
    const isRemoving = removing === item.userId;
    return (
      <View style={styles.card}>
        {/* Avatar */}
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{item.fullName?.[0] ?? '?'}</Text>
          </LinearGradient>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{item.fullName}</Text>
          <View style={[styles.typeBadge,
            { backgroundColor: item.type === 1 ? COLORS.warning + '25' : COLORS.error + '25' }]}>
            <Ionicons
              name={item.type === 1 ? 'eye-off-outline' : 'ban-outline'}
              size={12}
              color={item.type === 1 ? COLORS.warning : COLORS.error}
            />
            <Text style={[styles.typeText, { color: item.type === 1 ? COLORS.warning : COLORS.error }]}>
              {item.type === 1 ? 'Đang ẩn' : 'Đang chặn'}
            </Text>
          </View>
        </View>

        {/* Remove button */}
        <TouchableOpacity
          style={[styles.removeBtn, isRemoving && styles.removeBtnDisabled]}
          onPress={() => handleRemove(item)}
          disabled={isRemoving}
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.removeBtnText}>
                {item.type === 1 ? 'Bỏ ẩn' : 'Bỏ chặn'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const EmptyView = () => (
    <View style={styles.empty}>
      <Ionicons
        name={tab === 1 ? 'eye-off-outline' : 'ban-outline'}
        size={56}
        color={COLORS.textMuted}
      />
      <Text style={styles.emptyTitle}>
        {tab === 1 ? 'Chưa ẩn ai' : 'Chưa chặn ai'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {tab === 1
          ? 'Người dùng bị ẩn sẽ không xuất hiện trong feed của bạn.'
          : 'Người dùng bị chặn không thể nhắn tin hay xem hồ sơ của bạn.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách đã ẩn/chặn</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {([1, 2] as TabType[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => { setTab(t); }}
          >
            <Ionicons
              name={t === 1 ? 'eye-off-outline' : 'ban-outline'}
              size={16}
              color={tab === t ? '#fff' : COLORS.textMuted}
            />
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 1 ? 'Đã ẩn' : 'Đã chặn'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.userId.toString()}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, items.length === 0 && { flex: 1 }]}
          ListEmptyComponent={<EmptyView />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={COLORS.primary}
              onRefresh={() => { setRefreshing(true); load(tab); }}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  tabRow: {
    flexDirection: 'row', gap: 10,
    padding: 16, paddingBottom: 8,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
  },
  tabText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#fff' },

  list: { padding: 16, paddingTop: 8, gap: 10 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '700' },

  info: { flex: 1, gap: 4 },
  name: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start',
  },
  typeText: { fontSize: 12, fontWeight: '600' },

  removeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.error + '18', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.error + '40',
  },
  removeBtnDisabled: { opacity: 0.5 },
  removeBtnText: { color: COLORS.error, fontSize: 12, fontWeight: '700' },

  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySubtitle: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20,
  },
});
