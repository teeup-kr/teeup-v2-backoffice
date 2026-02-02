import axios from 'axios';
import { setupResponseInterceptor } from './errorHandler.js';

// API 기본 설정
// 프로덕션에서는 상대 경로 사용 (nginx 프록시), 개발에서는 VITE_API_BASE_URL로 직접 요청 (백엔드 CORS 허용 필요)
const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    return ''; // 프로덕션: 상대 경로 (nginx 활용)
  }
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL 환경 변수가 필요합니다.');
  }
  // HTTPS 페이지에서 HTTP API 호출 시 자동 변환
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBaseUrl.startsWith('http://')) {
    return apiBaseUrl.replace('http://', 'https://');
  }
  return apiBaseUrl;
};

const API_BASE_URL = getApiBaseUrl();

// API 버전 경로
const API_VERSION = '/api/v1';

// axios 인스턴스 생성
// mobile-web과 동일하게 baseURL에 API_VERSION 포함
const api = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF 토큰 가져오기 (일회성 토큰이므로 매번 새로 가져옴)
const getCsrfToken = async () => {
  try {
    // CSRF 토큰 새로 가져오기 (일회성 토큰)
    // apiClient의 baseURL을 사용하여 상대/절대 경로 모두 처리
    const csrfUrl = `${api.defaults.baseURL || ''}/auth/csrf-token`;
    const response = await fetch(csrfUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return data.csrf_token;
  } catch (error) {
    console.error('[auth.js] CSRF 토큰 가져오기 실패:', error);
    return null;
  }
};

// CSRF 예외 엔드포인트 목록 (백엔드 예외 목록과 일치)
// baseURL에 /api/v1이 포함되어 있으므로 경로는 /admin/... 또는 /auth/...로 시작
const CSRF_EXEMPT_PATHS = [
  '/admin/login',
  '/admin/logout',
  '/admin/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/oauth/google/callback',
];

// 요청 인터셉터 - JWT 토큰 및 CSRF 토큰 추가
api.interceptors.request.use(
  async (config) => {
    // JWT 토큰 추가
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // GET, HEAD, OPTIONS 요청이 아닌 경우에만 CSRF 토큰 추가
    const method = config.method?.toUpperCase();
    if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      // CSRF 예외 목록에 있는 엔드포인트는 CSRF 토큰을 건너뜀
      const url = config.url || '';
      // URL에서 경로 부분만 추출 (도메인 제외)
      let requestPath = url;
      if (url.startsWith('http')) {
        try {
          const urlObj = new URL(url);
          requestPath = urlObj.pathname;
        } catch (e) {
          // URL 파싱 실패 시 원본 사용
          requestPath = url;
        }
      }
      
      const isExempt = CSRF_EXEMPT_PATHS.some(p => requestPath === p || requestPath.endsWith(p));
      
      if (!isExempt) {
        const csrf = await getCsrfToken();
        if (csrf) config.headers['X-CSRF-Token'] = csrf;
      }
    }
    
    return config;
  },
  (error) => {
    console.error('[auth.js] 요청 인터셉터 에러:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
setupResponseInterceptor(api);

// 인증 API
// baseURL에 /api/v1이 포함되어 있으므로 경로는 /admin/...로 시작
export const authApi = {
  // 관리자 로그인
  login: (credentials) => api.post('/admin/login', credentials),
  
  // 관리자 로그아웃
  logout: () => api.post('/admin/logout'),
  
  // 토큰 갱신
  refreshToken: (refreshToken) => api.post('/admin/refresh', { refresh_token: refreshToken }),
  
  // 현재 관리자 정보 조회
  getCurrentAdmin: () => api.get('/admin/me'),
  
  // 비밀번호 변경
  changePassword: (data) => api.put('/admin/password', data),
  
  // 관리자 프로필 업데이트
  updateProfile: (data) => api.put('/admin/profile', data),
  
  // 관리자 설정 조회
  getSettings: () => api.get('/admin/settings'),
  
  // 관리자 설정 업데이트
  updateSettings: (data) => api.put('/admin/settings', data),
};

export default authApi;
