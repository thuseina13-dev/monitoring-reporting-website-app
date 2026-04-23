import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb && typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    if (!isWeb) {
      return await SecureStore.getItemAsync(key);
    }
    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isWeb && typeof window !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
    if (!isWeb) {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (isWeb && typeof window !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
    if (!isWeb) {
      await SecureStore.deleteItemAsync(key);
    }
  }
};
