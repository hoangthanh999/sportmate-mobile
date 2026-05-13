import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authApi } from '../../services/authApi';
import { userApi } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SKILL_LEVELS } from '../../constants/config';

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getMe().then(setProfile).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: async () => {
        await authApi.logout();
        await clearAuth();
        router.replace('/(auth)/login');
      }},
    ]);
  };

  const handleAvatarPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const form = new FormData();
      form.append('file', { uri: asset.uri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
      try {
        const updated = await userApi.uploadAvatar(form);
        setProfile(updated);
      } catch { Alert.alert('Lỗi', 'Không thể upload ảnh'); }
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  );

  const p = profile || {};

  return (
    <ScrollView style={styles.container}>
      {/* Header gradient */}
      <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.headerGrad}>
        <TouchableOpacity onPress={handleAvatarPick} style={styles.avatarWrap}>
          {p.avatarUrl ? (
            <Image source={{ uri: p.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{p.fullName?.[0] ?? '?'}</Text>
            </View>
          )}
          <View style={styles.editAvatarBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{p.fullName}</Text>
        <View style={styles.repRow}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.repText}>{(p.reputationScore || 0).toFixed(1)} điểm uy tín</Text>
        </View>
      </LinearGradient>

      {/* Sports */}
      {p.sports?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Môn thể thao</Text>
          {p.sports.map((s: any) => (
            <View key={s.sportId} style={styles.sportRow}>
              <Ionicons name="fitness" size={18} color={COLORS.primary} />
              <Text style={styles.sportName}>{s.sportName}</Text>
              <View style={styles.skillBadge}>
                <Text style={styles.skillBadgeText}>{SKILL_LEVELS[s.skillLevel]}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Bio */}
      {(p.playStyle || p.personality || p.goal) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Về bản thân</Text>
          {p.playStyle && <Text style={styles.bioText}>⚡ Lối chơi: {p.playStyle}</Text>}
          {p.personality && <Text style={styles.bioText}>😊 Tính cách: {p.personality}</Text>}
          {p.goal && <Text style={styles.bioText}>🎯 Mục tiêu: {p.goal}</Text>}
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/edit-profile' as any)}>
          <Ionicons name="create-outline" size={22} color={COLORS.primary} />
          <Text style={styles.menuText}>Chỉnh sửa hồ sơ</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy-list' as any)}>
          <Ionicons name="shield-outline" size={22} color={COLORS.warning} />
          <Text style={styles.menuText}>Danh sách đã ẩn/chặn</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          <Text style={[styles.menuText, { color: COLORS.error }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  headerGrad: { alignItems: 'center', paddingTop: 80, paddingBottom: 32 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 40, fontWeight: '800' },
  editAvatarBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: COLORS.primary, borderRadius: 12, padding: 4, borderWidth: 2, borderColor: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  repRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  repText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  section: { backgroundColor: COLORS.surface, margin: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  sportRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sportName: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '600', marginLeft: 10 },
  skillBadge: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  skillBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  bioText: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 8, lineHeight: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  logoutItem: { borderBottomWidth: 0 },
  menuText: { flex: 1, color: COLORS.text, fontSize: 16 },
});
