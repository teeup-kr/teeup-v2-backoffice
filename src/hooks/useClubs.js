import useSWR from 'swr';
import { clubsApi } from '../lib/api/clubs';

// 클럽 목록 조회 훅
export const useClubs = (params = {}) => {
  const { data, error, isLoading, mutate } = useSWR(
    ['admin/clubs', params],
    () => clubsApi.getClubs(params).then(res => res.data),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    clubs: data?.data || [],
    totalCount: data?.total_count || 0,
    totalPages: data?.total_pages || 0,
    isLoading,
    error,
    mutate,
  };
};

// 클럽 상세 조회 훅
export const useClub = (id) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `admin/clubs/${id}` : null,
    () => clubsApi.getClub(id).then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    club: data,
    isLoading,
    error,
    mutate,
  };
};

// 클럽 멤버 조회 훅
export const useClubMembers = (id) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `admin/clubs/${id}/members` : null,
    () => clubsApi.getClubMembers(id).then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    members: data?.members || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error,
    mutate,
  };
};

// 클럽 신청 목록 조회 훅
export const useClubApplications = (params = {}) => {
  const { data, error, isLoading, mutate } = useSWR(
    ['admin/clubs/applications', params],
    () => clubsApi.getClubApplications(params).then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    applications: data?.data || [],
    totalCount: data?.total_count || 0,
    totalPages: data?.total_pages || 0,
    isLoading,
    error,
    mutate,
  };
};

// 클럽 신청 상세 조회 훅
export const useClubApplication = (id) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `admin/clubs/applications/${id}` : null,
    () => clubsApi.getClubApplication(id).then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    application: data,
    isLoading,
    error,
    mutate,
  };
};

// 클럽 통계 조회 훅
export const useClubStats = (id) => {
  const { data, error, isLoading } = useSWR(
    id ? `admin/clubs/${id}/stats` : null,
    () => clubsApi.getClubStats(id).then(res => res.data),
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

// 클럽 생성 훅
export const useCreateClub = () => {
  const createClub = async (data) => {
    try {
      const response = await clubsApi.createClub(data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { createClub };
};

// 클럽 수정 훅
export const useUpdateClub = () => {
  const updateClub = async (id, data) => {
    try {
      const response = await clubsApi.updateClub(id, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { updateClub };
};

// 클럽 삭제 훅
export const useDeleteClub = () => {
  const deleteClub = async (id) => {
    try {
      const response = await clubsApi.deleteClub(id);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { deleteClub };
};

// 클럽 상태 변경 훅
export const useUpdateClubStatus = () => {
  const updateClubStatus = async (id, data) => {
    try {
      const response = await clubsApi.updateClubStatus(id, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { updateClubStatus };
};
