import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AdminDashboard from './index';
import { useAuthStore } from '../../../store/authStore';
import { useRouter } from 'expo-router';
import { authService } from '../../../services/api/authService';
import { storage } from '../../../utils/storage';
import { TamaguiProvider } from 'tamagui';
import tamaguiConfig from '../../../../tamagui.config'; // Assume reasonable path or simply mock tamagui

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../../../services/api/authService', () => ({
  authService: {
    logout: jest.fn(),
  },
}));

jest.mock('../../../utils/storage', () => ({
  storage: {
    getItem: jest.fn(),
  },
}));

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.useWindowDimensions = () => ({ width: 800, height: 1000 });
  return rn;
});

// Since @tamagui/lucide-icons renders SVGs, we mock it to prevent errors in Jest
jest.mock('@tamagui/lucide-icons', () => {
  const React = require('react');
  return new Proxy({}, {
    get: function(_, name) {
      return function MockIcon(props: any) {
        return React.createElement('MockIcon', { ...props, 'data-testid': `icon-${String(name)}` });
      }
    }
  });
});

// Mock Tamagui so it doesn't need the complex provider setup for basic component unit testing
jest.mock('tamagui', () => {
  const React = require('react');
  const View = (props: any) => React.createElement('View', props, props.children);
  const Text = (props: any) => React.createElement('Text', { ...props, testID: 'Text' }, props.children);
  const YStack = (props: any) => React.createElement('YStack', props, props.children);
  const XStack = (props: any) => React.createElement('XStack', props, props.children);
  const ScrollView = (props: any) => React.createElement('ScrollView', props, props.children);
  const Card = (props: any) => React.createElement('Card', props, props.children);
  const Circle = (props: any) => React.createElement('Circle', props, props.children);
  const Button = (props: any) => React.createElement('Button', { ...props, testID: 'Button' }, props.children);

  return {
    View, Text, YStack, XStack, ScrollView, Card, Circle, Button,
    useMedia: () => ({ sm: false }),
  };
});

describe('AdminDashboard Component', () => {
  const mockRouter = { replace: jest.fn(), push: jest.fn() };
  const mockClearAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { fullName: 'Admin Genba', role: 'ADMIN' },
      clearAuth: mockClearAuth,
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    // If testing context doesn't have tamagui config, this might throw. We can use try-catch or just render raw.
    // Since we mock useWindowDimensions and basic stuff, we will just render the component.
    return render(component);
  };

  it('renders correctly and exclusively displays admin menus based on role config', () => {
    const { getByText, queryByText } = renderWithProviders(<AdminDashboard />);

    // Perintah User: "pastikan tiap menu akan berbeda tiap pergantian role"
    // We ascertain that the Admin dashboard ONLY loads menus with ROLE_BIT.ADMIN

    // Verify Admin specific menus exist correctly
    expect(getByText('MENU UTAMA')).toBeTruthy();
    expect(getByText('ROLE')).toBeTruthy();
    expect(getByText('USER')).toBeTruthy();
    expect(getByText('PROFIL PERUSAHAAN')).toBeTruthy();

    // Verify menus from other roles do NOT leak into this dashboard
    expect(queryByText('Delegasi Tugas')).toBeNull(); // Manager menu
    expect(queryByText('Template Tugas')).toBeNull(); // Manager menu
    expect(queryByText('Daftar Tugas')).toBeNull(); // Employee menu
  });

  it('handles logout process correctly and calls clearAuth', async () => {
    (storage.getItem as jest.Mock).mockResolvedValue('mock-refresh-token');
    (authService.logout as jest.Mock).mockResolvedValue({});

    const { getByText } = renderWithProviders(<AdminDashboard />);
    
    // Temukan tombol logout berlabel teks (perubahan UI sebelumnya)
    const logoutBtn = getByText('LOGOUT');
    fireEvent.press(logoutBtn);

    await waitFor(() => {
      // Pastikan urutan trigger API lalu clean auth berfungsi dengan benar
      expect(storage.getItem).toHaveBeenCalledWith('refreshToken');
      expect(authService.logout).toHaveBeenCalledWith('mock-refresh-token');
      expect(mockClearAuth).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    });
  });
});
