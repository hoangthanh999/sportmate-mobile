import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
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
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [reportSending, setReportSending] = useState(false);

  const REPORT_REASONS = [
    { key: 'inappropriate_content', label: '🚫 Nội dung không phù hợp' },
    { key: 'spam', label: '📢 Spam / Quảng cáo' },
    { key: 'harassment', label: '😠 Quấy rối / Bắt nạt' },
    { key: 'fake_account', label: '🎭 Tài khoản giả mạo' },
    { key: 'other', label: '⚠️ Lý do khác' },
  ];

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
    setReportReason('');
    setReportDetail('');
    setReportModalVisible(true);
  };

  const submitReport = async () => {
    if (!reportReason) {
      Alert.alert('Chưa chọn lý do', 'Vui lòng chọn lý do báo cáo.');
      return;
    }
    setReportSending(true);
    try {
      await reportApi.report({
        targetUserId: parseInt(id),
        reason: reportReason,
        detail: reportDetail.trim() || undefined,
      });
      setReportModalVisible(false);
      Alert.alert('Đã gửi báo cáo', 'Cảm ơn bạn. Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.error ?? 'Không thể gửi. Thử lại sau.');
    } finally {
      setReportSending(false);
    }
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

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Báo cáo người dùng</Text>
            <Text style={styles.modalSubtitle}>Chọn lý do vi phạm</Text>

            {REPORT_REASONS.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[styles.reasonBtn, reportReason === r.key && styles.reasonBtnActive]}
                onPress={() => setReportReason(r.key)}
              >
                <Text style={[styles.reasonText, reportReason === r.key && styles.reasonTextActive]}>
                  {r.label}
                </Text>
                {reportReason === r.key && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}

            <Text style={[styles.modalSubtitle, { marginTop: 16 }]}>Chi tiết (tuỳ chọn)</Text>
            <TextInput
              style={styles.detailInput}
              placeholder="Mô tả thêm về vi phạm..."
              placeholderTextColor={COLORS.textMuted}
              value={reportDetail}
              onChangeText={setReportDetail}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setReportModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendReportBtn, !reportReason && { opacity: 0.5 }]}
                onPress={submitReport}
                disabled={!reportReason || reportSending}
              >
                {reportSending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.sendReportText}>Gửi báo cáo</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  // Report Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: COLORS.border,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, fontWeight: '600' },
  reasonBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, marginBottom: 8,
    backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border,
  },
  reasonBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  reasonText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  reasonTextActive: { color: COLORS.text },
  detailInput: {
    backgroundColor: COLORS.surfaceLight, borderRadius: 12, padding: 12,
    color: COLORS.text, fontSize: 14, minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelModalBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border,
  },
  cancelModalText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 15 },
  sendReportBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.error,
  },
  sendReportText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
