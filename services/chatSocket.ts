import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../constants/config';

let stompClient: Client | null = null;

export const chatSocket = {
  connect: async (onMessage: (msg: any) => void, conversationId: number) => {
    const token = await SecureStore.getItemAsync('accessToken');

    stompClient = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient?.subscribe(
          `/topic/conversation/${conversationId}`,
          (message: IMessage) => {
            const body = JSON.parse(message.body);
            onMessage(body);
          }
        );
      },
    });

    stompClient.activate();
  },

  sendMessage: (conversationId: number, content: string) => {
    stompClient?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ conversationId, content }),
    });
  },

  disconnect: () => {
    stompClient?.deactivate();
    stompClient = null;
  },
};
