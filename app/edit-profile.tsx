import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { userApi } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/config';

const PLAY_STYLES = ['Công', 'Thủ', 'Tổng hợp', 'Giải trí', 'Thi đấu'];
const PERSONALITIES = ['Hoà đồng', 'Nghiêm túc', 'Hài hước', 'Điềm tĩnh', 'Nhiệt huyết'];
const GOALS = ['Luyện tập sức khoẻ', 'Tìm bạn tập', 'Thi đấu chuyên nghiệp', 'Giải trí cuối tuần'];
const GENDERS = [{ label: 'Nam', value: 1 }, { label: 'Nữ', value: 2 }, { label: 'Khác', value: 0 }];

export default function EditProfileScreen() {
  const { user, setAuth, accessToken } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form state
  const [form, setForm] = useState({
    fullName: '',
    gender: 1,
    birthYear: '',
    playStyle: '',
    personality: '',
    goal: '',
  });

  useEffect(() => {
    userApi.getMe().then(p => {
      setProfile(p);
      setForm({
        fullName: p.fullName ?? '',
        gender: p.gender ?? 1,
        birthYear: p.birthYear ? String(p.birthYear) : '',
        playStyle: p.playStyle ?? '',
        personality: p.personality ?? '',
        goal: p.goal ?? '',
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      Alert.alert('Lỗi', 'Họ và tên không được để trống');
      return;
    }
    setSaving(true);
    try {
      const updated = await userApi.updateMe({
        fullName: form.fullName.trim(),
        gender: form.gender,
        birthYear: form.birthYear ? parseInt(form.birthYear) : undefined,
        playStyle: form.playStyle || undefined,
        personality: form.personality || undefined,
        goal: form.goal || undefined,
      });
      setProfile(updated);
      // Sync auth store name
      if (user) {
        await setAuth(
          { ...user, fullName: updated.fullName },
          accessToken ?? '',
          (await import('expo-secure-store').then(s => s.getItemAsync('refreshToken'))) ?? ''
        );
      }
      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!');
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.error ?? 'Không thể lưu. Thử lại sau.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingAvatar(true);
      try {
        const asset = result.assets[0];
        const form = new FormData();
        form.append('file', { uri: asset.uri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
        const updated = await userApi.uploadAvatar(form);
        setProfile((prev: any) => ({ ...prev, avatarUrl: updated.avatarUrl }));
        Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật!');
      } catch {
        Alert.alert('Lỗi', 'Không thể upload ảnh. Thử lại sau.');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtn}>Lưu</Text>}
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handleAvatarPick} disabled={uploadingAvatar} style={styles.avatarWrap}>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.avatar}>
                  <Text style={styles.avatarInitial}>{form.fullName?.[0] ?? '?'}</Text>
                </LinearGradient>
              )}
              <View style={styles.editAvatarBadge}>
                {uploadingAvatar
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="camera" size={16} color="#fff" />}
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>
              {uploadingAvatar ? 'Đang upload lên Cloudinary...' : 'Nhấn để đổi ảnh đại diện'}
            </Text>
          </View>

          {/* Basic info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

            <InputField
              label="Họ và tên *"
              icon="person-outline"
              value={form.fullName}
              onChangeText={v => update('fullName', v)}
              placeholder="Nhập họ và tên"
            />

            <InputField
              label="Năm sinh"
              icon="calendar-outline"
              value={form.birthYear}
              onChangeText={v => update('birthYear', v)}
              placeholder="Vd: 2000"
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>Giới tính</Text>
            <View style={styles.genderRow}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.genderBtn, form.gender === g.value && styles.genderBtnActive]}
                  onPress={() => update('gender', g.value)}
                >
                  <Text style={[styles.genderText, form.gender === g.value && { color: '#fff' }]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Play style */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phong cách & Tính cách</Text>

            <Text style={styles.fieldLabel}>Lối chơi</Text>
            <View style={styles.chipRow}>
              {PLAY_STYLES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, form.playStyle === s && styles.chipActive]}
                  onPress={() => update('playStyle', form.playStyle === s ? '' : s)}
                >
                  <Text style={[styles.chipText, form.playStyle === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Tính cách</Text>
            <View style={styles.chipRow}>
              {PERSONALITIES.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, form.personality === p && styles.chipActive]}
                  onPress={() => update('personality', form.personality === p ? '' : p)}
                >
                  <Text style={[styles.chipText, form.personality === p && styles.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Goal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mục tiêu</Text>
            <View style={styles.chipRow}>
              {GOALS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, form.goal === g && styles.chipActive]}
                  onPress={() => update('goal', form.goal === g ? '' : g)}
                >
                  <Text style={[styles.chipText, form.goal === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save button */}
          <TouchableOpacity onPress={handleSave} disabled={saving} style={{ marginBottom: 32 }}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.submitBtn}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.submitText}>Lưu thay đổi</Text>
                  </>
                )}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function InputField({ label, icon, value, onChangeText, placeholder, keyboardType }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  saveBtn: { color: '#fff', fontSize: 16, fontWeight: '700', width: 40, textAlign: 'right' },

  content: { padding: 16, gap: 14 },

  avatarSection: { alignItems: 'center', paddingVertical: 8 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: COLORS.primary,
  },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: '#fff' },
  editAvatarBadge: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 5,
    borderWidth: 2, borderColor: COLORS.background,
  },
  avatarHint: { color: COLORS.textMuted, fontSize: 13, marginTop: 8 },

  section: {
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16,
  },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceLight, borderRadius: 12,
    paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  input: { flex: 1, height: 48, color: COLORS.text, fontSize: 15 },

  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border,
  },
  genderBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  genderText: { color: COLORS.textSecondary, fontWeight: '600' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 16, padding: 17,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
