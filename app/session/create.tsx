import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { sessionApi, sportsApi } from '../../services/apiServices';
import { COLORS } from '../../constants/config';

export default function CreateSessionScreen() {
  const [form, setForm] = useState({
    sportId: 0, title: '', description: '', locationName: '',
    maxMembers: '10', lat: 0, lng: 0,
  });
  const [sports, setSports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => { sportsApi.getAll().then(setSports).catch(() => {}); }, []);

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const getLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      update('lat', loc.coords.latitude);
      update('lng', loc.coords.longitude);
    } catch { } finally { setLocLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.sportId || !form.title || !form.lat) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ và lấy vị trí GPS');
      return;
    }
    setLoading(true);
    try {
      await sessionApi.create({
        sportId: form.sportId, title: form.title,
        description: form.description, locationName: form.locationName,
        maxMembers: parseInt(form.maxMembers),
        lat: form.lat, lng: form.lng,
      });
      Alert.alert('Tạo thành công! 🎉', '', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.error || 'Không thể tạo buổi tập');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo buổi tập mới</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>

          {/* Sport selection */}
          <Text style={styles.label}>Môn thể thao *</Text>
          <View style={styles.chips}>
            {sports.map((sp: any) => (
              <TouchableOpacity key={sp.id} style={[styles.chip, form.sportId === sp.id && styles.chipActive]}
                onPress={() => update('sportId', sp.id)}>
                <Text style={[styles.chipText, form.sportId === sp.id && { color: '#fff' }]}>{sp.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Tiêu đề buổi tập *</Text>
          <TextInput style={styles.input} placeholder="Ví dụ: Đánh cầu lông tối thứ 5"
            placeholderTextColor={COLORS.textMuted} value={form.title} onChangeText={v => update('title', v)} />

          <Text style={styles.label}>Mô tả (tùy chọn)</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Thêm chi tiết về buổi tập..."
            placeholderTextColor={COLORS.textMuted} value={form.description}
            onChangeText={v => update('description', v)} multiline numberOfLines={3} />

          <Text style={styles.label}>Tên địa điểm</Text>
          <TextInput style={styles.input} placeholder="Ví dụ: Sân cầu lông Quận 1"
            placeholderTextColor={COLORS.textMuted} value={form.locationName}
            onChangeText={v => update('locationName', v)} />

          <Text style={styles.label}>Số người tối đa</Text>
          <TextInput style={styles.input} placeholder="10"
            placeholderTextColor={COLORS.textMuted} value={form.maxMembers}
            onChangeText={v => update('maxMembers', v)} keyboardType="number-pad" />

          {/* Location */}
          <Text style={styles.label}>Vị trí GPS *</Text>
          <TouchableOpacity onPress={getLocation} disabled={locLoading}>
            <View style={[styles.locBtn, form.lat !== 0 && styles.locBtnSuccess]}>
              {locLoading ? <ActivityIndicator color={COLORS.primary} />
                : <Ionicons name={form.lat !== 0 ? 'location' : 'location-outline'} size={20}
                    color={form.lat !== 0 ? COLORS.success : COLORS.primary} />}
              <Text style={{ color: form.lat !== 0 ? COLORS.success : COLORS.primary, fontWeight: '600', marginLeft: 8 }}>
                {form.lat !== 0 ? `Đã lấy vị trí (${form.lat.toFixed(3)}, ${form.lng.toFixed(3)})` : 'Lấy vị trí GPS hiện tại'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSubmit} disabled={loading} style={{ marginTop: 16 }}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.submitBtn}>
              {loading ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Tạo buổi tập 🚀</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 20, gap: 4 },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontWeight: '600' },
  input: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border },
  textArea: { height: 90, textAlignVertical: 'top' },
  locBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.primary + '60', backgroundColor: COLORS.surface },
  locBtnSuccess: { borderColor: COLORS.success + '60' },
  submitBtn: { borderRadius: 16, padding: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
