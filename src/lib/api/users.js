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

// 관리자용 사용자 관리 API
export const usersApi = {
  // 사용자 목록 조회
  getUsers: (params) => api.get('/v1/admin/users', { params }),
  
  // 사용자 상세 조회
  getUser: (id) => api.get(`/v1/admin/users/${id}`),
  
  // 사용자 생성
  createUser: (data) => api.post('/v1/admin/users', data),
  
  // 사용자 수정
  updateUser: (id, data) => api.put(`/v1/admin/users/${id}`, data),
  
  // 사용자 삭제
  deleteUser: (id) => api.delete(`/v1/admin/users/${id}`),
  
  // 사용자 상태 변경
  updateUserStatus: (id, status) => api.put(`/v1/admin/users/${id}/status`, { status }),
  
  // 사용자 권한 변경
  updateUserRole: (id, role) => api.put(`/v1/admin/users/${id}/role`, { role }),
  
  // 사용자 통계 조회
  getUserStats: (id) => api.get(`/v1/admin/users/${id}/stats`),
  
  // 사용자 활동 이력 조회
  getUserActivities: (id, params) => api.get(`/v1/admin/users/${id}/activities`, { params }),
};

export default usersApi;
