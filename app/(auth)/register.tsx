import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../services/authApi';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/config';
import { registerFcmToken } from '../../services/notificationHelper';

const GENDERS = [
  { label: 'Nam', value: 1 },
  { label: 'Nữ', value: 2 },
  { label: 'Khác', value: 0 },
];

export default function RegisterScreen() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', gender: 1, birthYear: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.email.trim() || !form.password || !form.fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        gender: form.gender,
        birthYear: form.birthYear ? parseInt(form.birthYear) : undefined,
      });
      await setAuth(
        { userId: res.userId, fullName: res.fullName, onboardingDone: false },
        res.accessToken, res.refreshToken
      );
      // Đăng ký FCM token sau khi đăng ký — fire & forget, không block navigation
      registerFcmToken();
      router.replace('/(onboarding)');
    } catch (err: any) {
      Alert.alert('Đăng ký thất bại', err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F0F1A', '#1A1A2E']} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>Tham gia cộng đồng SportMate ngay! 🏃</Text>

          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
            <TextInput style={styles.input} placeholder="Họ và tên" placeholderTextColor={COLORS.textMuted}
              value={form.fullName} onChangeText={v => update('fullName', v)} />
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.textMuted}
              value={form.email} onChangeText={v => update('email', v)}
              keyboardType="email-address" autoCapitalize="none" />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Mật khẩu (ít nhất 6 ký tự)"
              placeholderTextColor={COLORS.textMuted} value={form.password}
              onChangeText={v => update('password', v)} secureTextEntry={!showPass} />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Birth Year */}
          <View style={styles.inputWrapper}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.textMuted} style={styles.icon} />
            <TextInput style={styles.input} placeholder="Năm sinh (vd: 2000)"
              placeholderTextColor={COLORS.textMuted} value={form.birthYear}
              onChangeText={v => update('birthYear', v)} keyboardType="number-pad" />
          </View>

          {/* Gender */}
          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.genderRow}>
            {GENDERS.map(g => (
              <TouchableOpacity key={g.value} style={[styles.genderBtn,
                form.gender === g.value && styles.genderBtnActive]}
                onPress={() => update('gender', g.value)}>
                <Text style={[styles.genderText, form.gender === g.value && { color: '#fff' }]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity onPress={handleRegister} disabled={loading} style={{ marginTop: 8 }}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.btn}>
              {loading ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Đăng ký</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={{ color: COLORS.textSecondary }}>Đã có tài khoản? </Text>
            <Link href="/(auth)/login">
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Đăng nhập</Text>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  back: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 28 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 14,
    marginBottom: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, height: 52, color: COLORS.text, fontSize: 16 },
  label: { color: COLORS.textSecondary, marginBottom: 10, fontSize: 14 },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  genderBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  genderBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  genderText: { color: COLORS.textSecondary, fontWeight: '600' },
  btn: { borderRadius: 14, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
});
