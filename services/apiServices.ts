import api from './api';

export interface MatchResult {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  sport: string;
  skillLevel: number;
  distanceKm: number;
  matchScore: number;
  explanation: string;
}

export const matchApi = {
  getSuggestions: async (params?: {
    sport_id?: number; radius_km?: number; page?: number; size?: number;
  }): Promise<MatchResult[]> => {
    const res = await api.get('/api/match/suggestions', { params });
    return res.data.data;
  },

  getDetail: async (userId: number): Promise<MatchResult> => {
    const res = await api.get(`/api/match/suggestions/${userId}/detail`);
    return res.data.data;
  },
};

export const userApi = {
  getMe: async () => {
    const res = await api.get('/api/users/me');
    return res.data.data;
  },

  updateMe: async (data: any) => {
    const res = await api.put('/api/users/me', data);
    return res.data.data;
  },

  getUserById: async (id: number) => {
    const res = await api.get(`/api/users/${id}`);
    return res.data.data;
  },

  uploadAvatar: async (formData: FormData) => {
    const res = await api.post('/api/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  completeOnboarding: async (data: any) => {
    const res = await api.post('/api/users/onboarding', data);
    return res.data;
  },

  getRatings: async (userId: number) => {
    const res = await api.get(`/api/users/${userId}/ratings`);
    return res.data.data;
  },
};

export const sportsApi = {
  getAll: async () => {
    const res = await api.get('/api/sports');
    return res.data.data;
  },
};

export const privacyApi = {
  hide: async (targetId: number) => api.post(`/api/privacy/hide/${targetId}`),
  block: async (targetId: number) => api.post(`/api/privacy/block/${targetId}`),
  remove: async (targetId: number) => api.delete(`/api/privacy/${targetId}`),
  list: async (type: number) => {
    const res = await api.get('/api/privacy/list', { params: { type } });
    return res.data.data;
  },
};

export const sessionApi = {
  create: async (data: any) => {
    const res = await api.post('/api/sessions', data);
    return res.data.data;
  },

  getNearby: async (params?: any) => {
    const res = await api.get('/api/sessions/nearby', { params });
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await api.get(`/api/sessions/${id}`);
    return res.data.data;
  },

  join: async (id: number) => api.post(`/api/sessions/${id}/join`),

  cancel: async (id: number) => api.delete(`/api/sessions/${id}`),
};

export const chatApi = {
  getConversations: async () => {
    const res = await api.get('/api/conversations');
    return res.data.data;
  },

  createOrOpen: async (targetUserId: number) => {
    const res = await api.post('/api/conversations', { targetUserId });
    return res.data.data;
  },

  getMessages: async (id: number, beforeId?: number) => {
    const res = await api.get(`/api/conversations/${id}/messages`, {
      params: { beforeId, size: 30 },
    });
    return res.data.data;
  },

  markRead: async (id: number) => api.patch(`/api/conversations/${id}/read`),
};

export const ratingApi = {
  rate: async (data: { sessionId: number; ratedId: number; score: number; comment?: string }) => {
    return api.post('/api/ratings', data);
  },
};

export const reportApi = {
  report: async (data: { targetUserId: number; reason: string; detail?: string }) => {
    return api.post('/api/reports', data);
  },
};

export const notificationApi = {
  registerToken: async (fcmToken: string) => {
    return api.post('/api/notifications/token', { fcmToken });
  },
};
