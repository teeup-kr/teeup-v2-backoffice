import useSWR from 'swr';
import { usersApi } from '../lib/api/users';

// 사용자 목록 조회 훅
export const useUsers = (params = {}) => {
  const { data, error, isLoading, mutate } = useSWR(
    ['admin/users', params],
    () => usersApi.getUsers(params).then(res => res.data),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    users: data?.data || [],
    totalCount: data?.total_count || 0,
    totalPages: data?.total_pages || 0,
    isLoading,
    error,
    mutate,
  };
};

// 사용자 상세 조회 훅
export const useUser = (id) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `admin/users/${id}` : null,
    () => usersApi.getUser(id).then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    user: data,
    isLoading,
    error,
    mutate,
  };
};

// 사용자 통계 조회 훅
export const useUserStats = (id) => {
  const { data, error, isLoading } = useSWR(
    id ? `admin/users/${id}/stats` : null,
    () => usersApi.getUserStats(id).then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    stats: data,
    isLoading,
    error,
  };
};

// 사용자 활동 이력 조회 훅
export const useUserActivities = (id, params = {}) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ['admin/users/activities', id, params] : null,
    () => usersApi.getUserActivities(id, params).then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    activities: data?.data || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error,
    mutate,
  };
};

// 사용자 생성 훅
export const useCreateUser = () => {
  const createUser = async (data) => {
    try {
      const response = await usersApi.createUser(data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { createUser };
};

// 사용자 수정 훅
export const useUpdateUser = () => {
  const updateUser = async (id, data) => {
    try {
      const response = await usersApi.updateUser(id, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { updateUser };
};

// 사용자 삭제 훅
export const useDeleteUser = () => {
  const deleteUser = async (id) => {
    try {
      const response = await usersApi.deleteUser(id);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { deleteUser };
};

// 사용자 상태 변경 훅
export const useUpdateUserStatus = () => {
  const updateUserStatus = async (id, status) => {
    try {
      const response = await usersApi.updateUserStatus(id, status);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { updateUserStatus };
};
