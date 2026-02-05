import axios from 'axios';
import { setupResponseInterceptor } from './errorHandler.js';

// API 기본 설정
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 요청 인터셉터 - JWT 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
setupResponseInterceptor(api);

// 모임 관리 API (백엔드 /api/v1/admin/meetings)
export const meetingsApi = {
  // 모임 목록 조회 (통합: 라운딩+소셜, meeting_type: ROUND | SOCIAL)
  getMeetings: (params) => api.get('/v1/admin/meetings', { params }),
  
  // 모임 상세 조회
  getMeeting: (id) => api.get(`/v1/admin/meetings/${id}`),
  
  // 라운딩 모임 생성
  createRoundingMeeting: (data) => api.post('/v1/admin/meetings/rounding', data),
  
  // 소셜(이벤트) 모임 생성
  createEventMeeting: (data) => api.post('/v1/admin/meetings/event', data),
  
  // 모임 수정
  updateMeeting: (id, data) => api.put(`/v1/admin/meetings/${id}`, data),
  
  // 모임 삭제
  deleteMeeting: (id) => api.delete(`/v1/admin/meetings/${id}`),
  
  // 모임 상태 변경
  updateMeetingStatus: (id, data) => api.put(`/v1/admin/meetings/${id}/status`, data),
  
  // 모임 통계 조회
  getMeetingStats: (id) => api.get(`/v1/admin/meetings/${id}/stats`),
  
  // 모임 참가자 조회
  getMeetingParticipants: (id) => api.get(`/v1/admin/meetings/${id}/participants`),
  
  // 모임 참가자 추가/제거
  addParticipant: (id, data) => api.post(`/v1/admin/meetings/${id}/participants`, data),
  removeParticipant: (id, participantId) => api.delete(`/v1/admin/meetings/${id}/participants/${participantId}`),
  
  // 모임 비용 관리
  getMeetingExpenses: (id) => api.get(`/v1/admin/meetings/${id}/expenses`),
  createExpense: (id, data) => api.post(`/v1/admin/meetings/${id}/expenses`, data),
  updateExpense: (id, expenseId, data) => api.put(`/v1/admin/meetings/${id}/expenses/${expenseId}`, data),
  deleteExpense: (id, expenseId) => api.delete(`/v1/admin/meetings/${id}/expenses/${expenseId}`),
  
  // 모임 점수 관리
  getMeetingScores: (id) => api.get(`/v1/admin/meetings/${id}/scores`),
  updateScore: (id, participantId, data) => api.put(`/v1/admin/meetings/${id}/scores/${participantId}`, data),
  
  // 모임 팀 관리
  getMeetingTeams: (id) => api.get(`/v1/admin/meetings/${id}/teams`),
  createTeam: (id, data) => api.post(`/v1/admin/meetings/${id}/teams`, data),
  updateTeam: (id, teamId, data) => api.put(`/v1/admin/meetings/${id}/teams/${teamId}`, data),
  deleteTeam: (id, teamId) => api.delete(`/v1/admin/meetings/${id}/teams/${teamId}`),
};

export default meetingsApi;
