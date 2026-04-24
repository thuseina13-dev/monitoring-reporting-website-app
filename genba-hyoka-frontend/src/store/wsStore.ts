import { create } from 'zustand';

export type WSStatus = 'CONNECTING' | 'OPEN' | 'CLOSED';

interface WSState {
  status: WSStatus;
  channels: string[];
  lastMessage: any | null;
  setStatus: (status: WSStatus) => void;
  setChannels: (channels: string[]) => void;
  setLastMessage: (message: any) => void;
  clearWS: () => void;
}

export const useWSStore = create<WSState>((set) => ({
  status: 'CLOSED',
  channels: [],
  lastMessage: null,
  setStatus: (status) => set({ status }),
  setChannels: (channels) => set({ channels }),
  setLastMessage: (lastMessage) => set({ lastMessage }),
  clearWS: () => set({ status: 'CLOSED', channels: [], lastMessage: null }),
}));
