import api from './api';
import * as SecureStore from 'expo-secure-store';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  fullName: string;
  onboardingDone: boolean;
}

export const authApi = {
  register: async (data: {
    email: string; password: string; fullName: string; gender: number; birthYear?: number;
  }): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/register', data);
    return res.data.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data.data;
  },

  logout: async () => {
    await api.post('/api/auth/logout');
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },

  saveTokens: async (tokens: Pick<AuthResponse, 'accessToken' | 'refreshToken'>) => {
    await SecureStore.setItemAsync('accessToken', tokens.accessToken);
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
  },
};
