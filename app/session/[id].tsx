import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { sessionApi } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/config';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    sessionApi.getById(parseInt(id)).then(setSession).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await sessionApi.join(parseInt(id));
      Alert.alert('Thành công', 'Đã gửi yêu cầu tham gia! Host sẽ xét duyệt sớm.');
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.error || 'Không thể tham gia');
    } finally { setJoining(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!session) return <View style={styles.center}><Text style={{ color: COLORS.text }}>Không tìm thấy buổi tập</Text></View>;

  const isFull = session.currentMembers >= session.maxMembers;
  const isHost = session.hostId === user?.userId;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết buổi tập</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.sportRow}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.sportBadge}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{session.sportName}</Text>
            </LinearGradient>
            <View style={[styles.statusBadge,
              { backgroundColor: session.status === 0 ? COLORS.success + '30' : COLORS.error + '30' }]}>
              <Text style={{ color: session.status === 0 ? COLORS.success : COLORS.error, fontWeight: '700' }}>
                {session.status === 0 ? '🟢 Đang mở' : '🔴 Đã đóng'}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{session.title}</Text>
          {session.description && <Text style={styles.desc}>{session.description}</Text>}

          <View style={styles.infoGrid}>
            <InfoRow icon="person" label="Host" value={session.hostName} />
            <InfoRow icon="people" label="Thành viên" value={`${session.currentMembers}/${session.maxMembers} người`} />
            {session.locationName && <InfoRow icon="location" label="Địa điểm" value={session.locationName} />}
            {session.scheduledAt && <InfoRow icon="calendar" label="Thời gian"
              value={new Date(session.scheduledAt).toLocaleString('vi-VN')} />}
            {session.distanceKm != null && <InfoRow icon="navigate" label="Khoảng cách" value={`${session.distanceKm} km`} />}
          </View>
        </View>

        {/* Join button */}
        {!isHost && session.status === 0 && (
          <TouchableOpacity onPress={handleJoin} disabled={isFull || joining} style={{ marginTop: 8 }}>
            <LinearGradient
              colors={isFull ? ['#555', '#555'] : [COLORS.primary, COLORS.accent]}
              style={styles.joinBtn}>
              {joining ? <ActivityIndicator color="#fff" />
                : <Text style={styles.joinText}>{isFull ? 'Đã đầy chỗ' : 'Xin tham gia'}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isHost && (
          <TouchableOpacity style={styles.cancelBtn}
            onPress={() => Alert.alert('Hủy buổi tập', 'Xác nhận hủy?', [
              { text: 'Không', style: 'cancel' },
              { text: 'Hủy', style: 'destructive', onPress: async () => {
                await sessionApi.cancel(parseInt(id));
                router.back();
              }},
            ])}>
            <Text style={{ color: COLORS.error, fontWeight: '700' }}>🗑️ Hủy buổi tập (host)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <Ionicons name={icon} size={18} color={COLORS.primary} style={{ width: 28 }} />
      <Text style={{ color: COLORS.textSecondary, width: 90, fontSize: 14 }}>{label}</Text>
      <Text style={{ flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 16 },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  sportRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  sportBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  desc: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 22 },
  infoGrid: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  joinBtn: { borderRadius: 16, padding: 16, alignItems: 'center' },
  joinText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', padding: 16, marginTop: 8, borderWidth: 1, borderColor: COLORS.error + '50', borderRadius: 16 },
});
