import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Load .env BEFORE anything else
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Mocking native dependencies
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Use require to ensure environment is set up before axiosClient is initialized
const { authService } = require('./authService');
const axiosClient = require('./axiosClient').default;

describe('authService Full Lifecycle Integration Test', () => {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  let accessToken: string;
  let refreshToken: string;

  it('should successfully login and receive tokens', async () => {
    const response = await authService.login({
      email,
      password,
    });

    expect(response.success).toBe(true);
    expect(response.data.accessToken).toBeDefined();
    expect(response.data.refreshToken).toBeDefined();
    expect(response.data.user.email).toBe(email);
    
    accessToken = response.data.accessToken;
    refreshToken = response.data.refreshToken;
    
    console.log('✅ Login: OK');
  });

  it('should successfully refresh the access token', async () => {
    expect(refreshToken).toBeDefined();

    try {
      const response = await axios.post(`${apiUrl}/auth/refresh-token`, {
        refreshToken,
      });

      expect(response.data.success).toBe(true);
      expect(response.data.data.accessToken).toBeDefined();
      expect(response.data.data.refreshToken).toBeDefined();
      
      accessToken = response.data.data.accessToken;
      refreshToken = response.data.data.refreshToken;
      
      console.log('✅ Refresh Token: OK');
    } catch (error: any) {
      console.error('❌ Refresh Token failed:', error.response?.data || error.message);
      throw error;
    }
  });

  it('should successfully get user profile with the new access token', async () => {
    expect(accessToken).toBeDefined();

    try {
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      const response = await authService.getCurrentUser();
      
      expect(response.success).toBe(true);
      // The backend uses 'name' and 'sub' in the JWT payload (OIDC style)
      // and it doesn't include 'email' in the token payload anymore.
      expect(response.data.name).toBe('Sistem Administrator');
      expect(response.data.sub).toBeDefined();
      
      console.log('✅ Get Me: OK');
    } catch (error: any) {
      console.error('❌ Get Me failed:', error.response?.data || error.message);
      throw error;
    }
  });

  it('should successfully logout', async () => {
    expect(refreshToken).toBeDefined();

    try {
      const response = await authService.logout(refreshToken);
      
      expect(response.success).toBe(true);
      console.log('✅ Logout: OK');
    } catch (error: any) {
      console.error('❌ Logout failed:', error.response?.data || error.message);
      throw error;
    }
  });
});
