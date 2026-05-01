import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { userApi, chatApi, privacyApi, reportApi } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SKILL_LEVELS } from '../../constants/config';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = parseInt(id);
    Promise.all([userApi.getUserById(uid), userApi.getRatings(uid)])
      .then(([p, r]) => { setProfile(p); setRatings(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleChat = async () => {
    try {
      const conv = await chatApi.createOrOpen(parseInt(id));
      router.push(`/chat/${conv.conversationId}`);
    } catch { Alert.alert('Lỗi', 'Không thể mở hội thoại'); }
  };

  const handleBlock = () => {
    Alert.alert('Chặn người dùng', 'Người này sẽ không thể liên hệ với bạn nữa.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Chặn', style: 'destructive', onPress: async () => {
        await privacyApi.block(parseInt(id));
        Alert.alert('Đã chặn');
        router.back();
      }},
    ]);
  };

  const handleHide = async () => {
    await privacyApi.hide(parseInt(id));
    Alert.alert('Đã ẩn', 'Người này sẽ không xuất hiện trong feed của bạn');
    router.back();
  };

  const handleReport = () => {
    Alert.alert('Báo cáo', 'Lý do báo cáo?', [
      { text: 'Nội dung không phù hợp', onPress: () => reportApi.report({ targetUserId: parseInt(id), reason: 'inappropriate_content' }) },
      { text: 'Spam', onPress: () => reportApi.report({ targetUserId: parseInt(id), reason: 'spam' }) },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!profile) return <View style={styles.center}><Text style={{ color: COLORS.text }}>Không tìm thấy người dùng</Text></View>;

  const isMe = profile.id === user?.userId;
  const avgRating = ratings.length > 0
    ? (ratings.reduce((s: number, r: any) => s + r.score, 0) / ratings.length).toFixed(1) : '—';

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          {!isMe && (
            <TouchableOpacity onPress={handleReport}>
              <Ionicons name="flag-outline" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          {profile.avatarUrl
            ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            : (
              <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{profile.fullName?.[0]}</Text>
              </LinearGradient>
            )}
          <Text style={styles.name}>{profile.fullName}</Text>
          <View style={styles.repRow}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.repText}>{avgRating} ({ratings.length} đánh giá)</Text>
          </View>
        </View>

        {/* Sports */}
        {profile.sports?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Môn thể thao</Text>
            <View style={styles.chips}>
              {profile.sports.map((s: any) => (
                <View key={s.sportId} style={styles.chip}>
                  <Text style={styles.chipSport}>{s.sportName}</Text>
                  <Text style={styles.chipSkill}>{SKILL_LEVELS[s.skillLevel]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bio */}
        {(profile.playStyle || profile.goal) && (
          <View style={styles.section}>
            {profile.playStyle && <Text style={styles.bio}>⚡ {profile.playStyle}</Text>}
            {profile.goal && <Text style={styles.bio}>🎯 {profile.goal}</Text>}
          </View>
        )}

        {/* Ratings */}
        {ratings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đánh giá ({ratings.length})</Text>
            {ratings.slice(0, 3).map((r: any) => (
              <View key={r.id} style={styles.ratingItem}>
                <View style={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name={i < r.score ? 'star' : 'star-outline'} size={14} color="#FFD700" />
                  ))}
                </View>
                <Text style={styles.ratingComment}>{r.comment || 'Không có nhận xét'}</Text>
                <Text style={styles.raterName}>— {r.raterName}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      {!isMe && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.hideBtn} onPress={handleHide}>
            <Ionicons name="eye-off-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.blockBtn} onPress={handleBlock}>
            <Ionicons name="ban-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.chatGrad}>
              <Ionicons name="chatbubble" size={20} color="#fff" />
              <Text style={styles.chatText}>Nhắn tin</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 80 },
  backBtn: {},
  avatarSection: { alignItems: 'center', marginTop: -50, marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: COLORS.background },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: COLORS.background },
  avatarInitial: { fontSize: 40, fontWeight: '800', color: '#fff' },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  repRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  repText: { color: COLORS.textSecondary },
  section: { backgroundColor: COLORS.surface, margin: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: COLORS.surfaceLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  chipSport: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  chipSkill: { color: COLORS.primary, fontSize: 12 },
  bio: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 6 },
  ratingItem: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12, marginBottom: 12 },
  stars: { flexDirection: 'row', marginBottom: 4 },
  ratingComment: { color: COLORS.text, fontSize: 14, marginBottom: 2 },
  raterName: { color: COLORS.textMuted, fontSize: 12 },
  actionBar: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  hideBtn: { padding: 12, backgroundColor: COLORS.surfaceLight, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  blockBtn: { padding: 12, backgroundColor: COLORS.surfaceLight, borderRadius: 14, borderWidth: 1, borderColor: COLORS.error + '40' },
  chatBtn: { flex: 1 },
  chatGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14 },
  chatText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
