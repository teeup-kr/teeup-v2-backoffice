import axios from 'axios';
import { setupResponseInterceptor } from './errorHandler.js';

// API 클라이언트 기본 설정
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF 토큰 가져오기 (일회성)
const getCsrfToken = async () => {
  try {
    const res = await fetch('/api/v1/auth/csrf-token');
    const data = await res.json();
    return data.csrf_token;
  } catch (e) {
    console.error('CSRF 토큰 가져오기 실패:', e);
    return null;
  }
};

// 요청 인터셉터 - JWT + CSRF 토큰 추가
apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const method = config.method?.toUpperCase();
    if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrf = await getCsrfToken();
      if (csrf) {
        config.headers['X-CSRF-Token'] = csrf;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 설정
setupResponseInterceptor(apiClient);

// API 클라이언트 유틸리티 함수들
export const apiUtils = {
  // 에러 메시지 추출
  getErrorMessage: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return '알 수 없는 오류가 발생했습니다.';
  },
  
  // 응답 데이터 추출
  getResponseData: (response) => {
    return response.data;
  },
  
  // 성공 응답 확인
  isSuccessResponse: (response) => {
    return response.status >= 200 && response.status < 300;
  },
  
  // 에러 응답 확인
  isErrorResponse: (response) => {
    return response.status >= 400;
  },
};

export default apiClient;
