import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useWSStore } from '../store/wsStore';
import { wsService } from '../services/api/wsService';

const PING_INTERVAL = 30000; // 30 seconds
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

/**
 * Custom Hook to handle WebSocket lifecycle
 */
export const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectDelay = useRef(INITIAL_RECONNECT_DELAY);
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { setStatus, setChannels, setLastMessage, clearWS } = useWSStore();

  const connect = useCallback(async () => {
    // Only connect if authenticated and not already connecting/open
    if (!isAuthenticated) return;
    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) return;

    setStatus('CONNECTING');
    
    try {
      // 1. Get One-Time Ticket (OTT)
      const { ticket_id } = await wsService.getTicket();
      
      // 2. Build WS URL (Swap http with ws)
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
      const wsBaseUrl = apiUrl.replace(/^http/, 'ws');
      const wsUrl = `${wsBaseUrl}/v1/ws/connect?ticket=${ticket_id}`;
      
      console.log('[WS] Attempting connection...');
      
      // 3. Initialize WebSocket
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        console.log('[WS] Connection Established');
        setStatus('OPEN');
        reconnectDelay.current = INITIAL_RECONNECT_DELAY;
        
        // 4. Start Heartbeat (Ping every 30s)
        if (pingInterval.current) clearInterval(pingInterval.current);
        pingInterval.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            console.log('[WS] Sending ping...');
            socket.send('ping');
          }
        }, PING_INTERVAL);
      };

      socket.onmessage = (event) => {
        // Handle Heartbeat Pong
        if (event.data === 'pong') {
          console.log('[WS] Received pong');
          return;
        }

        try {
          const message = JSON.parse(event.data);
          
          // Handle Welcome Message (Initial Channel Sync)
          if (message.type === 'WELCOME') {
            console.log('[WS] Welcome received. Channels:', message.data.channels);
            setChannels(message.data.channels);
          }
          
          setLastMessage(message);
        } catch (e) {
          console.log('[WS] Received non-JSON message:', event.data);
        }
      };

      socket.onclose = (event) => {
        console.log(`[WS] Connection Closed: ${event.code} ${event.reason}`);
        setStatus('CLOSED');
        
        // Stop heartbeat
        if (pingInterval.current) clearInterval(pingInterval.current);

        // 5. Auto-Reconnect with Exponential Backoff
        if (isAuthenticated && event.code !== 1000) { // 1000 is normal closure
          console.log(`[WS] Scheduling reconnect in ${reconnectDelay.current}ms...`);
          reconnectTimeout.current = setTimeout(() => {
            connect();
            reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY);
          }, reconnectDelay.current);
        }
      };

      socket.onerror = (error) => {
        console.error('[WS] Connection Error:', error);
      };

    } catch (error) {
      console.error('[WS] Initialization Error:', error);
      setStatus('CLOSED');
      
      // Retry connection after delay
      if (isAuthenticated) {
        reconnectTimeout.current = setTimeout(connect, reconnectDelay.current);
      }
    }
  }, [isAuthenticated, setStatus, setChannels, setLastMessage]);

  const disconnect = useCallback(() => {
    console.log('[WS] Manually disconnecting...');
    if (pingInterval.current) clearInterval(pingInterval.current);
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    
    if (ws.current) {
      // Remove listeners before closing to avoid trigger onclose logic
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        ws.current.close(1000, 'User Disconnected');
      }
      ws.current = null;
    }
    
    clearWS();
  }, [clearWS]);

  // Handle connection based on auth status
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      // Don't disconnect on every re-render, only on unmount or auth change
      // Handled by the dependencies
    };
  }, [isAuthenticated, connect, disconnect]);

  // Also disconnect on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    status: useWSStore((state) => state.status),
    lastMessage: useWSStore((state) => state.lastMessage),
    connect,
    disconnect
  };
};
