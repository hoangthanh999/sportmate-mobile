/**
 * notificationHelper.ts
 * Đăng ký FCM push token với backend sau khi user đăng nhập / đăng ký.
 * - Xin quyền notification (iOS cần, Android 13+ cần)
 * - Lấy Expo/FCM token
 * - Gọi POST /api/notifications/token
 * Toàn bộ thực hiện trong try-catch: KHÔNG bao giờ crash app nếu thất bại.
 */

import { Platform } from 'react-native';
import { notificationApi } from './apiServices';

export async function registerFcmToken(): Promise<void> {
  try {
    // expo-notifications có thể chưa được cài → import động để tránh crash
    const Notifications = await import('expo-notifications').catch(() => null);
    if (!Notifications) {
      // Package chưa được cài, bỏ qua silently
      return;
    }

    // Xin quyền push notification
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      // User từ chối quyền — không đăng ký
      return;
    }

    // Lấy FCM / Expo push token
    // Trên Android cần projectId từ app.json (EAS) — nếu không có thì dùng getDevicePushTokenAsync
    let token: string | null = null;

    try {
      // Thử lấy Expo Push Token (hoạt động tốt trên Expo Go)
      const tokenData = await Notifications.getExpoPushTokenAsync();
      token = tokenData.data;
    } catch {
      // Fallback: lấy FCM native device token
      try {
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        token = deviceToken.data as string;
      } catch {
        // Không lấy được token — bỏ qua
        return;
      }
    }

    if (!token) return;

    // Gửi token lên backend
    await notificationApi.registerToken(token);
  } catch {
    // Bất kỳ lỗi nào cũng bỏ qua — đây là feature phụ, không được ảnh hưởng login flow
  }
}
