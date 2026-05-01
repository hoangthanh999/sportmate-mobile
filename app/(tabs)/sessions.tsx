import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { sessionApi } from '../../services/apiServices';
import { COLORS } from '../../constants/config';

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setSessions(await sessionApi.getNearby({ radius_km: 20 })); }
    catch { } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/session/${item.id}`)}>
      <View style={styles.cardTop}>
        <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.sportBadge}>
          <Text style={styles.sportText}>{item.sportName}</Text>
        </LinearGradient>
        <View style={[styles.statusBadge,
          { backgroundColor: item.status === 0 ? COLORS.success + '30' : COLORS.error + '30' }]}>
          <Text style={{ color: item.status === 0 ? COLORS.success : COLORS.error, fontSize: 12, fontWeight: '700' }}>
            {item.status === 0 ? 'Đang mở' : 'Đã đóng'}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.host}>👤 {item.hostName}</Text>

      <View style={styles.details}>
        <View style={styles.detail}>
          <Ionicons name="people" size={15} color={COLORS.textMuted} />
          <Text style={styles.detailText}>{item.currentMembers}/{item.maxMembers} người</Text>
        </View>
        {item.distanceKm != null && (
          <View style={styles.detail}>
            <Ionicons name="location" size={15} color={COLORS.textMuted} />
            <Text style={styles.detailText}>{item.distanceKm} km</Text>
          </View>
        )}
        {item.locationName && (
          <View style={styles.detail}>
            <Ionicons name="pin" size={15} color={COLORS.textMuted} />
            <Text style={styles.detailText} numberOfLines={1}>{item.locationName}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buổi tập gần bạn 🏃</Text>
        <TouchableOpacity onPress={() => router.push('/session/create')}>
          <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.createBtn}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createText}>Tạo mới</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList data={sessions} keyExtractor={i => i.id.toString()}
          renderItem={renderItem} contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={50} color={COLORS.textMuted} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 12, textAlign: 'center' }}>
                Chưa có buổi tập nào gần bạn{'\n'}Hãy tạo buổi tập đầu tiên!
              </Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  createText: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sportBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  sportText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  host: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 },
  details: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { color: COLORS.textMuted, fontSize: 13 },
});
