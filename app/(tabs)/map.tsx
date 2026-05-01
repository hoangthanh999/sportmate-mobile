import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { sessionApi } from '../../services/apiServices';
import { COLORS } from '../../constants/config';

export default function MapScreen() {
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
      try {
        const data = await sessionApi.getNearby({ radius_km: 15 });
        setSessions(data);
      } catch { }
      setLoading(false);
    })();
  }, []);

  const buildLeafletHTML = (lat: number, lng: number, markers: any[]) => {
    const markersJS = markers.map(s => `
      L.marker([${s.lat}, ${s.lng}], {icon: sessionIcon})
        .addTo(map)
        .bindPopup('<b>${s.title}</b><br>${s.sportName} • ${s.currentMembers}/${s.maxMembers} người');
    `).join('\n');

    return `
<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;padding:0;height:100%;width:100%;background:#0F0F1A;}</style>
</head><body>
<div id="map"></div>
<script>
  var map = L.map('map', {zoomControl: true}).setView([${lat}, ${lng}], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 18
  }).addTo(map);

  // User marker
  var userIcon = L.divIcon({
    html: '<div style="width:20px;height:20px;background:#6C63FF;border-radius:50%;border:3px solid white;box-shadow:0 0 10px #6C63FF;"></div>',
    className: '', iconAnchor: [10, 10]
  });
  L.marker([${lat}, ${lng}], {icon: userIcon}).addTo(map).bindPopup('<b>Vị trí của bạn</b>');

  // Session markers
  var sessionIcon = L.divIcon({
    html: '<div style="width:16px;height:16px;background:#FF6584;border-radius:50%;border:2px solid white;"></div>',
    className: '', iconAnchor: [8, 8]
  });
  ${markersJS}
</script>
</body></html>`;
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  if (!userLoc) return (
    <View style={styles.center}>
      <Ionicons name="location-outline" size={48} color={COLORS.textMuted} />
      <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Cần quyền vị trí để hiển thị bản đồ</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Bản đồ buổi tập</Text>
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Bạn</Text>
          <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
          <Text style={styles.legendText}>Buổi tập ({sessions.length})</Text>
        </View>
      </View>

      <WebView
        ref={webviewRef}
        source={{ html: buildLeafletHTML(userLoc.lat, userLoc.lng, sessions) }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { color: COLORS.textSecondary, fontSize: 13 },
  map: { flex: 1 },
});
