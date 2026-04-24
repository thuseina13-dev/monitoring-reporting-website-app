import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function DashboardIndex() {
  const { activeRole, roles } = useAuthStore();
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) return null;

  const currentRole = roles.find(r => r.code === activeRole);
  const roleType = currentRole?.type;

  if (roleType === 'admin' || roleType === 'super_admin') {
    return <Redirect href="/(dashboard)/admin" />;
  }

  if (roleType === 'manager') {
    return <Redirect href="/(dashboard)/manager" />;
  }

  if (roleType === 'employee') {
    return <Redirect href="/(dashboard)/employee" />;
  }

  // Default fallback if role is unknown
  return <Redirect href="/(auth)/login" />;
}
