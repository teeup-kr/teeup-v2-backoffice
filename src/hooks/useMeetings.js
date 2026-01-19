import useSWR from 'swr';
import { meetingsApi } from '../lib/api/meetings';

// 모임 목록 조회 훅
export const useMeetings = (params = {}) => {
  const { data, error, isLoading, mutate } = useSWR(
    ['admin/meetings', params],
    () => meetingsApi.getMeetings(params).then(res => res.data),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    meetings: data?.data || [],
    totalCount: data?.total_count || 0,
    totalPages: data?.total_pages || 0,
    isLoading,
    error,
    mutate,
  };
};

// 모임 상세 조회 훅
export const useMeeting = (id) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `admin/meetings/${id}` : null,
    () => meetingsApi.getMeeting(id).then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    meeting: data,
    isLoading,
    error,
    mutate,
  };
};

// 모임 통계 조회 훅
export const useMeetingStats = (id) => {
  const { data, error, isLoading } = useSWR(
    id ? `admin/meetings/${id}/stats` : null,
    () => meetingsApi.getMeetingStats(id).then(res => res.data),
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

// 모임 참가자 조회 훅
export const useMeetingParticipants = (id) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `admin/meetings/${id}/participants` : null,
    () => meetingsApi.getMeetingParticipants(id).then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    participants: data?.participants || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error,
    mutate,
  };
};

// 모임 비용 조회 훅
export const useMeetingExpenses = (id) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `admin/meetings/${id}/expenses` : null,
    () => meetingsApi.getMeetingExpenses(id).then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    expenses: data?.expenses || [],
    totalAmount: data?.total_amount || 0,
    isLoading,
    error,
    mutate,
  };
};

// 모임 점수 조회 훅
export const useMeetingScores = (id) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `admin/meetings/${id}/scores` : null,
    () => meetingsApi.getMeetingScores(id).then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    scores: data?.scores || [],
    isLoading,
    error,
    mutate,
  };
};

// 모임 팀 조회 훅
export const useMeetingTeams = (id) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `admin/meetings/${id}/teams` : null,
    () => meetingsApi.getMeetingTeams(id).then(res => res.data),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    teams: data?.teams || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error,
    mutate,
  };
};

// 모임 생성 훅
export const useCreateMeeting = () => {
  const createMeeting = async (data) => {
    try {
      const response = await meetingsApi.createMeeting(data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { createMeeting };
};

// 모임 수정 훅
export const useUpdateMeeting = () => {
  const updateMeeting = async (id, data) => {
    try {
      const response = await meetingsApi.updateMeeting(id, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { updateMeeting };
};

// 모임 삭제 훅
export const useDeleteMeeting = () => {
  const deleteMeeting = async (id) => {
    try {
      const response = await meetingsApi.deleteMeeting(id);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return { deleteMeeting };
};
