import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useWSStore } from '../store/wsStore';
import { wsService } from '../services/api/wsService';

const PING_INTERVAL = 30000;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectDelay = useRef(INITIAL_RECONNECT_DELAY);
  const isConnecting = useRef(false);
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { setStatus, setChannels, setLastMessage } = useWSStore.getState();

  const disconnect = useCallback((reason: string) => {
    // Kita gunakan console.log biasa sekarang karena sudah stabil
    console.log(`[WS] Disconnecting. Reason: ${reason}`);
    
    if (pingInterval.current) clearInterval(pingInterval.current);
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        ws.current.close(1000, reason);
      }
      ws.current = null;
    }
    
    setStatus('CLOSED');
  }, [setStatus]);

  const connect = useCallback(async () => {
    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
      return;
    }
    
    if (!isAuthenticated || isConnecting.current) return;

    isConnecting.current = true;
    setStatus('CONNECTING');
    
    try {
      console.log('[WS] Requesting ticket...');
      const { ticket_id } = await wsService.getTicket();
      
      if (!useAuthStore.getState().isAuthenticated) {
        isConnecting.current = false;
        return;
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
      const wsBaseUrl = apiUrl.replace(/^http/, 'ws');
      const wsUrl = `${wsBaseUrl}/ws/connect?ticket=${ticket_id}`;
      
      console.log('[WS] Opening WebSocket...');
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        console.log('[WS] === CONNECTION ESTABLISHED ===');
        setStatus('OPEN');
        reconnectDelay.current = INITIAL_RECONNECT_DELAY;
        isConnecting.current = false;
        
        if (pingInterval.current) clearInterval(pingInterval.current);
        pingInterval.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, PING_INTERVAL);
      };

      socket.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'WELCOME') setChannels(message.data.channels);
          setLastMessage(message);
        } catch (e) {}
      };

      socket.onclose = (event) => {
        console.log(`[WS] Socket Closed. Code: ${event.code}, Reason: ${event.reason}`);
        setStatus('CLOSED');
        isConnecting.current = false;
        if (pingInterval.current) clearInterval(pingInterval.current);

        if (useAuthStore.getState().isAuthenticated && event.code !== 1000) {
          console.log(`[WS] Reconnecting...`);
          reconnectTimeout.current = setTimeout(connect, reconnectDelay.current);
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY);
        }
      };

      socket.onerror = (error) => {
        console.error('[WS] Socket Error:', error);
        isConnecting.current = false;
      };

    } catch (error) {
      console.error('[WS] Connection Failed:', error);
      setStatus('CLOSED');
      isConnecting.current = false;
    }
  }, [isAuthenticated, setStatus, setChannels, setLastMessage]);

  // Efek 1: Pantau status Auth (Login/Logout)
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect('Explicit Logout');
    }
  }, [isAuthenticated, connect, disconnect]);

  // Efek 2: Cleanup saat benar-benar Unmount (Pindah halaman/Tutup tab)
  useEffect(() => {
    return () => {
      console.log('[WS] Hook Unmounting...');
      disconnect('Component Unmount');
    };
  }, [disconnect]);

  return {
    status: useWSStore((state) => state.status),
    lastMessage: useWSStore((state) => state.lastMessage)
  };
};
