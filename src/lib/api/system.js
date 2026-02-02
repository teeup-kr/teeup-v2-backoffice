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

// 시스템 관리 API
export const systemApi = {
  // 대시보드 통계 조회
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  // 약관 관리
  getTerms: (type) => api.get(`/admin/terms/${type}`),
  updateTerms: (type, data) => api.put(`/admin/terms/${type}`, data),
  
  // 알림 관리
  getNotifications: (params) => api.get('/admin/notifications', { params }),
  createNotification: (data) => api.post('/admin/notifications', data),
  updateNotification: (id, data) => api.put(`/admin/notifications/${id}`, data),
  deleteNotification: (id) => api.delete(`/admin/notifications/${id}`),
  sendNotification: (id) => api.post(`/admin/notifications/${id}/send`),
  
  // 시스템 설정
  getSystemSettings: () => api.get('/admin/settings'),
  updateSystemSettings: (data) => api.put('/admin/settings', data),
  
  // 파일 업로드
  uploadFile: (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // 시스템 로그 조회
  getSystemLogs: (params) => api.get('/admin/logs', { params }),
  
  // 시스템 상태 확인
  getSystemHealth: () => api.get('/admin/health'),
};

export default systemApi;
