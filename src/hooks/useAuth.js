import useSWR from 'swr';
import { authApi } from '../lib/api/auth';

// 인증 관리 커스텀 훅
export const useAuth = () => {
  // 현재 관리자 정보 조회
  const { data: admin, error, isLoading, mutate } = useSWR(
    'admin/me',
    () => authApi.getCurrentAdmin().then(res => res.data),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // 관리자 설정 조회
  const { data: settings, error: settingsError, isLoading: settingsLoading } = useSWR(
    admin ? 'admin/settings' : null,
    () => authApi.getSettings().then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    admin,
    settings,
    isLoading: isLoading || settingsLoading,
    error: error || settingsError,
    mutate,
  };
};

// 로그인 훅?
export const useLogin = () => {
  const login = async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      const { access_token, refresh_token } = response.data;
      
      localStorage.setItem('admin_access_token', access_token);
      localStorage.setItem('admin_refresh_token', refresh_token);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { login };
};

// 로그아웃 훅
export const useLogout = () => {
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
    } finally {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      window.location.href = '/auth/login';
    }
  };

  return { logout };
};

// 비밀번호 변경 훅
export const useChangePassword = () => {
  const changePassword = async (data) => {
    try {
      const response = await authApi.changePassword(data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { changePassword };
};

// 프로필 업데이트 훅
export const useUpdateProfile = () => {
  const updateProfile = async (data) => {
    try {
      const response = await authApi.updateProfile(data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { updateProfile };
};
