import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function DashboardIndex() {
  const { activeRole } = useAuthStore();
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null;

  if (activeRole === 'admin' || activeRole === 'super_admin') {
    return <Redirect href="/(dashboard)/admin" />;
  }

  if (activeRole === 'manager') {
    return <Redirect href="/(dashboard)/manager" />;
  }

  if (activeRole === 'employee') {
    return <Redirect href="/(dashboard)/employee" />;
  }

  // Default fallback if role is unknown
  return <Redirect href="/(auth)/login" />;
}
