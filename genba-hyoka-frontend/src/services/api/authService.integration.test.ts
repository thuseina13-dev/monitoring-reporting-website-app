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

const { authService } = require('./authService');
const axiosClient = require('./axiosClient').default;

describe('authService Full Lifecycle Integration Test', () => {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  let cookieHeader: string = '';
  let csrfToken: string = '';

  it('should successfully login and receive cookies and csrf_token', async () => {
    const response = await axios.post(`${apiUrl}/auth/login`, {
      email,
      password,
    });

    expect(response.data.success).toBe(true);
    expect(response.data.data.csrf_token).toBeDefined();
    
    // Extract cookies
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      cookieHeader = setCookie.map(c => c.split(';')[0]).join('; ');
    }
    csrfToken = response.data.data.csrf_token;
    
    console.log('✅ Login: OK');
  });

  it('should successfully refresh the access token', async () => {
    try {
      const response = await axios.post(`${apiUrl}/auth/refresh-token`, {}, {
        headers: {
          Cookie: cookieHeader
        }
      });

      expect(response.data.success).toBe(true);
      expect(response.data.data.csrf_token).toBeDefined();
      
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        cookieHeader = setCookie.map(c => c.split(';')[0]).join('; ');
      }
      csrfToken = response.data.data.csrf_token;
      
      console.log('✅ Refresh Token: OK');
    } catch (error: any) {
      console.error('❌ Refresh Token failed:', error.response?.data || error.message);
      throw error;
    }
  });

  it('should successfully get user profile with the new cookie', async () => {
    try {
      const response = await axios.get(`${apiUrl}/auth/me`, {
        headers: {
          Cookie: cookieHeader
        }
      });
      
      expect(response.data.success).toBe(true);
      expect(response.data.data.sub).toBeDefined();
      
      console.log('✅ Get Me: OK');
    } catch (error: any) {
      console.error('❌ Get Me failed:', error.response?.data || error.message);
      throw error;
    }
  });

  it('should successfully logout', async () => {
    try {
      const response = await axios.post(`${apiUrl}/auth/logout`, {}, {
        headers: {
          Cookie: cookieHeader,
          'X-CSRF-TOKEN': csrfToken
        }
      });
      
      expect(response.data.success).toBe(true);
      console.log('✅ Logout: OK');
    } catch (error: any) {
      console.error('❌ Logout failed:', error.response?.data || error.message);
      throw error;
    }
  });
});
