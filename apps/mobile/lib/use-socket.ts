import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/auth-context';
import { secureStorage } from './storage';
import { API_BASE_URL, getCachedAccessToken } from './api';

export interface SocketEventHandlers {
  onNewMessage?: (data: { conversationId: string; message: any; tempId?: string }) => void;
  onReadReceipt?: (data: { conversationId: string; messageId: string; readAt: string }) => void;
  onDelivered?: (data: { conversationId: string; messageId: string; deliveredAt: string }) => void;
  onTyping?: (data: { conversationId: string; userId: string; displayName: string }) => void;
  onUserOnline?: (data: { userId: string }) => void;
  onUserOffline?: (data: { userId: string; lastSeen: string }) => void;
  onStateChanged?: (data: {
    userId: string;
    socialEnergy?: string | null;
    calmModeActive?: boolean;
  }) => void;
  onStatusUpdate?: (data: { conversationId: string; messageId: string; status: string }) => void;
  onConversationUnhidden?: (data: { conversationId: string }) => void;
  onModerationNewItem?: (data: { itemType: string; priority: string }) => void;
}

export function useSocket(handlers: SocketEventHandlers) {
  const { accessToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  const refreshAttemptedRef = useRef(false);

  // Keep handlers ref up to date without triggering reconnects
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!accessToken) return;

    const currentToken = getCachedAccessToken() || accessToken;

    const socket = io(API_BASE_URL, {
      auth: { token: currentToken },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;
    refreshAttemptedRef.current = false;

    socket.on('connect', () => {
      setIsConnected(true);
      refreshAttemptedRef.current = false;
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', async () => {
      setIsConnected(false);

      if (refreshAttemptedRef.current) return;
      refreshAttemptedRef.current = true;

      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (res.ok) {
            const data = await res.json();
            await secureStorage.setAccessToken(data.accessToken);
            await secureStorage.setRefreshToken(data.refreshToken);
            socket.auth = { token: data.accessToken };
            socket.connect();
            return;
          }
        } catch {
          // Refresh failed, socket.io will continue its own reconnection
        }
      }
    });

    // Register event listeners
    socket.on('message:new', data => handlersRef.current.onNewMessage?.(data));
    socket.on('message:read_receipt', data => handlersRef.current.onReadReceipt?.(data));
    socket.on('message:delivered', data => handlersRef.current.onDelivered?.(data));
    socket.on('message:typing', data => handlersRef.current.onTyping?.(data));
    socket.on('user:online', data => handlersRef.current.onUserOnline?.(data));
    socket.on('user:offline', data => handlersRef.current.onUserOffline?.(data));
    socket.on('user:state_changed', data => handlersRef.current.onStateChanged?.(data));
    socket.on('message:status_update', data => handlersRef.current.onStatusUpdate?.(data));
    socket.on('conversation:unhidden', data => handlersRef.current.onConversationUnhidden?.(data));
    socket.on('moderation:new_item', data => handlersRef.current.onModerationNewItem?.(data));

    // AppState listener — disconnect on background, reconnect on foreground
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        if (!socket.connected) {
          socket.connect();
        }
      } else if (nextState === 'background' || nextState === 'inactive') {
        socket.disconnect();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription.remove();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [accessToken]);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, isConnected, emit };
}
