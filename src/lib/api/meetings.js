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

// 모임 관리 API
export const meetingsApi = {
  // 모임 목록 조회
  getMeetings: (params) => api.get('/admin/meetings', { params }),
  
  // 모임 상세 조회
  getMeeting: (id) => api.get(`/admin/meetings/${id}`),
  
  // 모임 생성
  createMeeting: (data) => api.post('/admin/meetings', data),
  
  // 모임 수정
  updateMeeting: (id, data) => api.put(`/admin/meetings/${id}`, data),
  
  // 모임 삭제
  deleteMeeting: (id) => api.delete(`/admin/meetings/${id}`),
  
  // 모임 상태 변경
  updateMeetingStatus: (id, data) => api.put(`/admin/meetings/${id}/status`, data),
  
  // 모임 통계 조회
  getMeetingStats: (id) => api.get(`/admin/meetings/${id}/stats`),
  
  // 모임 참가자 조회
  getMeetingParticipants: (id) => api.get(`/admin/meetings/${id}/participants`),
  
  // 모임 참가자 추가/제거
  addParticipant: (id, data) => api.post(`/admin/meetings/${id}/participants`, data),
  removeParticipant: (id, participantId) => api.delete(`/admin/meetings/${id}/participants/${participantId}`),
  
  // 모임 비용 관리
  getMeetingExpenses: (id) => api.get(`/admin/meetings/${id}/expenses`),
  createExpense: (id, data) => api.post(`/admin/meetings/${id}/expenses`, data),
  updateExpense: (id, expenseId, data) => api.put(`/admin/meetings/${id}/expenses/${expenseId}`, data),
  deleteExpense: (id, expenseId) => api.delete(`/admin/meetings/${id}/expenses/${expenseId}`),
  
  // 모임 점수 관리
  getMeetingScores: (id) => api.get(`/admin/meetings/${id}/scores`),
  updateScore: (id, participantId, data) => api.put(`/admin/meetings/${id}/scores/${participantId}`, data),
  
  // 모임 팀 관리
  getMeetingTeams: (id) => api.get(`/admin/meetings/${id}/teams`),
  createTeam: (id, data) => api.post(`/admin/meetings/${id}/teams`, data),
  updateTeam: (id, teamId, data) => api.put(`/admin/meetings/${id}/teams/${teamId}`, data),
  deleteTeam: (id, teamId) => api.delete(`/admin/meetings/${id}/teams/${teamId}`),
};

export default meetingsApi;
