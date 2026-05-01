import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { matchApi, MatchResult } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SKILL_LEVELS } from '../../constants/config';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [suggestions, setSuggestions] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSuggestions = async () => {
    try {
      const data = await matchApi.getSuggestions({ radius_km: 15, size: 20 });
      setSuggestions(data);
    } catch { setSuggestions([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadSuggestions(); }, []);

  const renderCard = ({ item }: { item: MatchResult }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/user/${item.userId}`)}>
      {/* Score badge */}
      <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.scoreBadge}>
        <Text style={styles.scoreText}>{Math.round(item.matchScore * 100)}%</Text>
        <Text style={styles.scoreLabel}>phù hợp</Text>
      </LinearGradient>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{item.fullName[0]}</Text>
          </LinearGradient>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{item.fullName}</Text>

        <View style={styles.tags}>
          <View style={styles.tag}>
            <Ionicons name="fitness" size={12} color={COLORS.primary} />
            <Text style={styles.tagText}>{item.sport}</Text>
          </View>
          <View style={styles.tag}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={styles.tagText}>{SKILL_LEVELS[item.skillLevel]}</Text>
          </View>
          <View style={styles.tag}>
            <Ionicons name="location" size={12} color={COLORS.accent} />
            <Text style={styles.tagText}>{item.distanceKm} km</Text>
          </View>
        </View>

        <Text style={styles.explanation} numberOfLines={2}>✨ {item.explanation}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.msgBtn}
          onPress={() => router.push(`/user/${item.userId}`)}>
          <Ionicons name="chatbubble" size={18} color={COLORS.primary} />
          <Text style={styles.msgText}>Nhắn tin</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewBtn}
          onPress={() => router.push(`/user/${item.userId}`)}>
          <Text style={styles.viewText}>Xem hồ sơ</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0F0F1A', '#1A1A2E']} style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào, {user?.fullName?.split(' ').pop()} 👋</Text>
          <Text style={styles.subGreeting}>Tìm bạn tập phù hợp với bạn</Text>
        </View>
        <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.headerIcon}>
          <Ionicons name="flash" size={22} color="#fff" />
        </LinearGradient>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>AI đang tìm bạn phù hợp...</Text>
        </View>
      ) : suggestions.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={60} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Chưa có gợi ý nào</Text>
          <Text style={styles.emptySubText}>Hãy hoàn thiện hồ sơ để AI tìm bạn tập cho bạn</Text>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={item => item.userId.toString()}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} tintColor={COLORS.primary}
              onRefresh={() => { setRefreshing(true); loadSuggestions(); }} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  subGreeting: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  loadingText: { color: COLORS.textSecondary, marginTop: 12, fontSize: 15 },
  emptyText: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  emptySubText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  scoreBadge: {
    position: 'absolute', top: 16, right: 16, zIndex: 1,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    alignItems: 'center',
  },
  scoreText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  scoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
  avatarContainer: { alignItems: 'center', paddingTop: 24, paddingBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: COLORS.primary },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 34, fontWeight: '800' },
  info: { paddingHorizontal: 16, paddingBottom: 12 },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 10 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surfaceLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  tagText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  explanation: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border },
  msgBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 14, borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  msgText: { color: COLORS.primary, fontWeight: '700' },
  viewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14 },
  viewText: { color: COLORS.text, fontWeight: '700' },
});
