import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { sportsApi, userApi } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';
import { COLORS, DAYS_OF_WEEK, SLOTS, SKILL_LEVELS } from '../../constants/config';

const TOTAL_STEPS = 8;

const PLAY_STYLES = ['Giải trí', 'Thi đấu', 'Rèn luyện sức khỏe', 'Giao lưu'];
const PERSONALITIES = ['Vui vẻ hài hước', 'Nghiêm túc', 'Năng động', 'Bình tĩnh', 'Hướng ngoại'];
const GOALS = ['Kết bạn giao lưu', 'Nâng cao kỹ năng', 'Giải trí sau giờ làm', 'Thi đấu chuyên nghiệp'];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [sports, setSports] = useState<any[]>([]);
  const [selectedSports, setSelectedSports] = useState<{ sportId: number; skillLevel: number }[]>([]);
  const [schedules, setSchedules] = useState<{ dayOfWeek: number; slot: number }[]>([]);
  const [playStyle, setPlayStyle] = useState('');
  const [personality, setPersonality] = useState('');
  const [goal, setGoal] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, setAuth, accessToken } = useAuthStore();

  useEffect(() => { sportsApi.getAll().then(setSports).catch(() => {}); }, []);

  const toggleSport = (sportId: number) => {
    setSelectedSports(prev => {
      const exists = prev.find(s => s.sportId === sportId);
      if (exists) return prev.filter(s => s.sportId !== sportId);
      return [...prev, { sportId, skillLevel: 2 }];
    });
  };

  const setSkill = (sportId: number, level: number) => {
    setSelectedSports(prev => prev.map(s => s.sportId === sportId ? { ...s, skillLevel: level } : s));
  };

  const toggleSchedule = (day: number, slot: number) => {
    setSchedules(prev => {
      const key = prev.find(s => s.dayOfWeek === day && s.slot === slot);
      if (key) return prev.filter(s => !(s.dayOfWeek === day && s.slot === slot));
      return [...prev, { dayOfWeek: day, slot }];
    });
  };

  const hasSchedule = (day: number, slot: number) =>
    schedules.some(s => s.dayOfWeek === day && s.slot === slot);

  const getLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Cần quyền vị trí'); setLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch { Alert.alert('Không lấy được vị trí'); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!location) { Alert.alert('Vui lòng lấy vị trí GPS'); return; }
    setLoading(true);
    try {
      await userApi.completeOnboarding({
        sports: selectedSports, schedules,
        playStyle, personality, goal,
        lat: location.lat, lng: location.lng,
      });
      if (user) {
        await setAuth({ ...user, onboardingDone: true }, accessToken!, '');
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.error || 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  };

  const canNext = () => {
    if (step === 1) return selectedSports.length > 0;
    if (step === 3) return schedules.length > 0;
    if (step === 8) return !!location;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <View>
          <Text style={styles.stepTitle}>Bạn chơi môn gì? 🏸</Text>
          <Text style={styles.stepSub}>Chọn một hoặc nhiều môn</Text>
          <View style={styles.grid}>
            {sports.map((sp: any) => {
              const selected = selectedSports.find(s => s.sportId === sp.id);
              return (
                <TouchableOpacity key={sp.id} style={[styles.chip, selected && styles.chipActive]}
                  onPress={() => toggleSport(sp.id)}>
                  <Text style={[styles.chipText, selected && { color: '#fff' }]}>{sp.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
      case 2: return (
        <View>
          <Text style={styles.stepTitle}>Trình độ của bạn? 🎯</Text>
          {selectedSports.map(ss => {
            const sp = sports.find(s => s.id === ss.sportId);
            return (
              <View key={ss.sportId} style={styles.skillRow}>
                <Text style={styles.skillLabel}>{sp?.name}</Text>
                <View style={styles.skillButtons}>
                  {[1,2,3,4].map(l => (
                    <TouchableOpacity key={l} style={[styles.skillBtn, ss.skillLevel === l && styles.skillBtnActive]}
                      onPress={() => setSkill(ss.sportId, l)}>
                      <Text style={[styles.skillBtnText, ss.skillLevel === l && { color: '#fff' }]}>
                        {SKILL_LEVELS[l]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      );
      case 3: return (
        <View>
          <Text style={styles.stepTitle}>Lịch rảnh của bạn? 📅</Text>
          <Text style={styles.stepSub}>Chọn các khung giờ thường rảnh</Text>
          <View style={styles.scheduleGrid}>
            <View style={[styles.scheduleRow, { marginBottom: 8 }]}>
              <View style={{ width: 36 }} />
              {SLOTS.map((sl, i) => (
                <Text key={i} style={styles.slotHeader}>{sl}</Text>
              ))}
            </View>
            {DAYS_OF_WEEK.map((day, di) => (
              <View key={di} style={styles.scheduleRow}>
                <Text style={styles.dayLabel}>{day}</Text>
                {SLOTS.map((_, si) => (
                  <TouchableOpacity key={si} style={[styles.scheduleCell, hasSchedule(di, si) && styles.scheduleCellActive]}
                    onPress={() => toggleSchedule(di, si)}>
                    {hasSchedule(di, si) && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>
      );
      case 4: return renderChoice('Lối chơi của bạn? ⚡', 'Chọn phong cách thi đấu', PLAY_STYLES, playStyle, setPlayStyle);
      case 5: return renderChoice('Tính cách của bạn? 😊', 'Để ghép đôi phù hợp hơn', PERSONALITIES, personality, setPersonality);
      case 6: return renderChoice('Mục tiêu của bạn? 🎖️', 'Bạn muốn đạt được điều gì?', GOALS, goal, setGoal);
      case 7: return (
        <View>
          <Text style={styles.stepTitle}>Thêm mô tả bản thân 📝</Text>
          <Text style={styles.stepSub}>Tùy chọn — giúp AI ghép đôi chính xác hơn</Text>
          <TextInput style={styles.textArea} placeholder="Ví dụ: Mình thích chơi cầu lông vào buổi tối, chơi vui vẻ là chính..."
            placeholderTextColor={COLORS.textMuted} multiline numberOfLines={4}
            value={playStyle} onChangeText={setPlayStyle} />
        </View>
      );
      case 8: return (
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.stepTitle}>Vị trí của bạn? 📍</Text>
          <Text style={styles.stepSub}>Để tìm bạn tập gần bạn nhất</Text>
          {location ? (
            <View style={styles.locationCard}>
              <Ionicons name="location" size={32} color={COLORS.success} />
              <Text style={styles.locationText}>Đã lấy vị trí thành công!</Text>
              <Text style={styles.locationCoords}>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={getLocation} disabled={loading}>
              <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.locationBtn}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="location-outline" size={24} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>Lấy vị trí GPS</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      );
    }
  };

  const renderChoice = (title: string, sub: string, options: string[], value: string, setter: (v: string) => void) => (
    <View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSub}>{sub}</Text>
      {options.map(opt => (
        <TouchableOpacity key={opt} style={[styles.optionBtn, value === opt && styles.optionBtnActive]}
          onPress={() => setter(opt)}>
          <Text style={[styles.optionText, value === opt && { color: '#fff' }]}>{opt}</Text>
          {value === opt && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <LinearGradient colors={['#0F0F1A', '#1A1A2E']} style={{ flex: 1 }}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Bước {step}/{TOTAL_STEPS}</Text>
        <View style={styles.progressBar}>
          <LinearGradient colors={[COLORS.primary, COLORS.accent]}
            style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {renderStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            <Text style={{ color: COLORS.text, marginLeft: 6 }}>Quay lại</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {step < TOTAL_STEPS ? (
          <TouchableOpacity disabled={!canNext()} onPress={() => setStep(s => s + 1)}>
            <LinearGradient colors={canNext() ? [COLORS.primary, COLORS.accent] : ['#333', '#333']}
              style={styles.nextBtn}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Tiếp theo</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity disabled={!canNext() || loading} onPress={handleSubmit}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.nextBtn}>
              {loading ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '700' }}>Hoàn thành 🎉</Text>}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  progressContainer: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  progressText: { color: COLORS.textSecondary, marginBottom: 8, fontSize: 13 },
  progressBar: { height: 6, backgroundColor: COLORS.surface, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  content: { padding: 24, paddingBottom: 40 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  stepSub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontWeight: '600' },
  skillRow: { marginBottom: 20 },
  skillLabel: { color: COLORS.text, fontWeight: '700', marginBottom: 10 },
  skillButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  skillBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  skillBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  skillBtnText: { color: COLORS.textSecondary, fontSize: 13 },
  scheduleGrid: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 12 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  slotHeader: { flex: 1, textAlign: 'center', color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  dayLabel: { width: 36, color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  scheduleCell: {
    flex: 1, height: 36, borderRadius: 8, marginHorizontal: 3,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  scheduleCellActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, marginBottom: 10,
  },
  optionBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
  textArea: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, height: 120,
    color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
    textAlignVertical: 'top', fontSize: 15,
  },
  locationCard: { alignItems: 'center', padding: 24, backgroundColor: COLORS.surface, borderRadius: 20, width: '100%' },
  locationText: { color: COLORS.success, fontWeight: '700', fontSize: 18, marginTop: 12 },
  locationCoords: { color: COLORS.textMuted, marginTop: 6 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16 },
  navRow: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
});
