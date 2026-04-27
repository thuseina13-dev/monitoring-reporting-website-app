import { authService } from "@/services/api/authService";
import { useAuthStore } from "@/store/authStore";
import { storage } from "@/utils/storage";
import { useRouter } from "expo-router";

export function useLogout() {
    const { user, clearAuth } = useAuthStore()
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await authService.logout();
            const msg = `Sampai jumpa, ${user?.fullName}`;
            await clearAuth();
            router.replace({ pathname: '/(auth)/login', params: { logout: msg } });
        } catch (error) {
            console.error('Logout API failed:', error);
        }
    }

    return handleLogout;
}   
