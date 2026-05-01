import { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '../../services/apiServices';
import { chatSocket } from '../../services/chatSocket';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../constants/config';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const convId = parseInt(id);
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [otherUser, setOtherUser] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    chatApi.getMessages(convId).then(msgs => {
      setMessages(msgs.reverse());
    }).catch(() => {});

    chatApi.markRead(convId).catch(() => {});

    chatSocket.connect((msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, convId);

    return () => chatSocket.disconnect();
  }, [convId]);

  const send = () => {
    if (!text.trim()) return;
    chatSocket.sendMessage(convId, text.trim());
    setText('');
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.senderId === user?.userId;
    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        {!isMine && (
          <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.msgAvatar}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
              {item.senderName?.[0]}
            </Text>
          </LinearGradient>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMine && { color: '#fff' }]}>{item.content}</Text>
          <Text style={styles.timeText}>
            {item.sentAt ? new Date(item.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUser || 'Chat'}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, i) => item.id?.toString() ?? i.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Nhắn tin..."
            placeholderTextColor={COLORS.textMuted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity onPress={send} disabled={!text.trim()}>
            <LinearGradient
              colors={text.trim() ? [COLORS.primary, COLORS.accent] : [COLORS.surfaceLight, COLORS.surfaceLight]}
              style={styles.sendBtn}>
              <Ionicons name="send" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  msgList: { padding: 16, gap: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  msgRowMine: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 18 },
  bubbleMine: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { color: COLORS.text, fontSize: 15, lineHeight: 20 },
  timeText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  input: { flex: 1, backgroundColor: COLORS.surfaceLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: COLORS.text, maxHeight: 120, fontSize: 15, borderWidth: 1, borderColor: COLORS.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});
