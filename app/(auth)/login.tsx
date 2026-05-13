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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
      await setAuth(
        { userId: res.userId, fullName: res.fullName, onboardingDone: res.onboardingDone },
        res.accessToken, res.refreshToken
      );
      // Đăng ký FCM token sau khi login — fire & forget, không block navigation
      registerFcmToken();
      if (!res.onboardingDone) router.replace('/(onboarding)');
      else router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Đăng nhập thất bại', err.response?.data?.error || 'Sai email hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F0F1A', '#1A1A2E']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.logoGradient}>
              <Ionicons name="fitness" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.appName}>SportMate</Text>
            <Text style={styles.tagline}>Tìm bạn tập thể thao thông minh</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.title}>Chào mừng trở lại! 👋</Text>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Mật khẩu"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.btn}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Đăng nhập</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.grayText}>Chưa có tài khoản? </Text>
              <Link href="/(auth)/register">
                <Text style={styles.linkText}>Đăng ký ngay</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoGradient: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  appName: { fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
  tagline: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  form: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 24 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceLight, borderRadius: 14, paddingHorizontal: 14,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 52, color: COLORS.text, fontSize: 16 },
  btn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  grayText: { color: COLORS.textSecondary },
  linkText: { color: COLORS.primary, fontWeight: '700' },
});
