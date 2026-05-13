// API Configuration
export const BASE_URL = 'http://10.0.2.2:8080'; // Android emulator → localhost
// export const BASE_URL = 'http://192.168.1.x:8080'; // Real device → IP máy tính

export const WS_URL = BASE_URL.replace('http', 'ws') + '/ws';

export const COLORS = {
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  accent: '#FF6584',
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  border: '#2A2A4A',
  text: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#606080',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#FF5252',
  gradient1: '#6C63FF',
  gradient2: '#FF6584',
};

export const SKILL_LEVELS: Record<number, string> = {
  1: 'Mới bắt đầu',
  2: 'Trung bình',
  3: 'Khá',
  4: 'Chuyên nghiệp',
};

export const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const SLOTS = ['Sáng', 'Chiều', 'Tối'];
