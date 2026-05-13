import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ratingApi } from '../../services/apiServices';
import { COLORS } from '../../constants/config';

/**
 * Route: /session/rate?sessionId=X&ratedId=Y&ratedName=Z
 * Params được truyền qua query string khi navigate.
 */
export default function RateSessionScreen() {
  const { sessionId, ratedId, ratedName } = useLocalSearchParams<{
    sessionId: string;
    ratedId: string;
    ratedName: string;
  }>();

  const [score, setScore] = useState(0);       // 0 = chưa chọn, 1-5
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) {
      Alert.alert('Chưa chọn sao', 'Vui lòng chọn số sao đánh giá.');
      return;
    }
    setLoading(true);
    try {
      await ratingApi.rate({
        sessionId: parseInt(sessionId),
        ratedId: parseInt(ratedId),
        score,
        comment: comment.trim() || undefined,
      });
      Alert.alert('Thành công 🎉', 'Cảm ơn bạn đã đánh giá!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Không thể gửi đánh giá. Thử lại sau.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  const STAR_LABELS: Record<number, string> = {
    1: 'Tệ 😞',
    2: 'Tạm được 😐',
    3: 'Ổn 🙂',
    4: 'Tốt 😊',
    5: 'Xuất sắc 🤩',
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá đồng đội</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Target user card */}
          <View style={styles.targetCard}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.targetAvatar}>
              <Text style={styles.targetInitial}>{ratedName?.[0] ?? '?'}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.targetLabel}>Đánh giá</Text>
              <Text style={styles.targetName}>{ratedName ?? 'Người chơi'}</Text>
            </View>
            <View style={styles.starBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.starBadgeText}>Sau buổi tập</Text>
            </View>
          </View>

          {/* Star selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn số sao *</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setScore(s)}
                  style={styles.starBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={s <= score ? 'star' : 'star-outline'}
                    size={40}
                    color={s <= score ? '#FFD700' : COLORS.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {score > 0 && (
              <Text style={styles.scoreLabel}>{STAR_LABELS[score]}</Text>
            )}
          </View>

          {/* Comment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nhận xét (tuỳ chọn)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Viết nhận xét về đồng đội này..."
              placeholderTextColor={COLORS.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              maxLength={300}
            />
            <Text style={styles.charCount}>{comment.length}/300</Text>
          </View>

          {/* Tips */}
          <View style={styles.tips}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.tipsText}>
              Đánh giá trung thực giúp cộng đồng SportMate ngày càng tốt hơn.
              Bạn chỉ có thể đánh giá mỗi người một lần cho mỗi buổi tập.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity onPress={handleSubmit} disabled={loading || score === 0}>
            <LinearGradient
              colors={score > 0 ? [COLORS.primary, COLORS.accent] : ['#333', '#333']}
              style={[styles.submitBtn, (loading || score === 0) && styles.submitBtnDisabled]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Ionicons name="star" size={18} color="#FFD700" />
                    <Text style={styles.submitText}>Gửi đánh giá</Text>
                  </>
                )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  content: { padding: 16, gap: 16 },

  targetCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  targetAvatar: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  targetInitial: { color: '#fff', fontSize: 22, fontWeight: '800' },
  targetLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  targetName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  starBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFD70020', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  starBadgeText: { color: '#FFD700', fontSize: 11, fontWeight: '700' },

  section: {
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16,
  },

  starRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12,
  },
  starBtn: { padding: 4 },
  scoreLabel: {
    textAlign: 'center', fontSize: 16, fontWeight: '700', color: COLORS.text,
  },

  commentInput: {
    backgroundColor: COLORS.surfaceLight, borderRadius: 12,
    padding: 14, color: COLORS.text, fontSize: 15,
    minHeight: 100, textAlignVertical: 'top',
    borderWidth: 1, borderColor: COLORS.border,
  },
  charCount: {
    textAlign: 'right', color: COLORS.textMuted, fontSize: 12, marginTop: 6,
  },

  tips: {
    flexDirection: 'row', gap: 8,
    backgroundColor: COLORS.surfaceLight, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  tipsText: {
    flex: 1, color: COLORS.textMuted, fontSize: 13, lineHeight: 19,
  },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 16, padding: 17, marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
