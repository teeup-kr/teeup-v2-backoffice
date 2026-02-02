import axios from 'axios';
import { setupResponseInterceptor } from './errorHandler.js';

// API 기본 설정
// mobile-web과 동일한 로직 사용: 프로덕션에서는 상대 경로 사용
const getApiBaseUrl = () => {
  // 프로덕션 환경에서는 상대 경로 사용 (nginx 프록시 활용)
  if (import.meta.env.PROD) {
    console.log('[auth.js] 상대 경로 사용: 빈 문자열 (현재 도메인)');
    return ''; // 빈 문자열 = 현재 도메인 (mobile-web과 동일)
  }
  
  // 개발 환경: 환경 변수 필수
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  console.log('[auth.js] 환경 변수:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    PROD: import.meta.env.PROD,
    windowHost: typeof window !== 'undefined' ? window.location.host : 'N/A'
  });
  
  if (!apiBaseUrl) {
    console.error('[auth.js] VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다.');
    throw new Error('VITE_API_BASE_URL 환경 변수가 필요합니다.');
  }
  
  // HTTP URL을 HTTPS로 자동 변환
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (apiBaseUrl.startsWith('http://')) {
      const httpsUrl = apiBaseUrl.replace('http://', 'https://');
      console.log('[auth.js] HTTP를 HTTPS로 변환:', apiBaseUrl, '->', httpsUrl);
      return httpsUrl;
    }
  }
  
  console.log('[auth.js] 최종 API_BASE_URL:', apiBaseUrl);
  return apiBaseUrl;
};

const API_BASE_URL = getApiBaseUrl();
console.log('[auth.js] 최종 결정된 API_BASE_URL:', API_BASE_URL);

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

console.log('[auth.js] axios baseURL:', `${API_BASE_URL}${API_VERSION}`);

// CSRF 토큰 가져오기 (일회성 토큰이므로 매번 새로 가져옴)
const getCsrfToken = async () => {
  try {
    // CSRF 토큰 새로 가져오기 (일회성 토큰)
    // apiClient의 baseURL을 사용하여 상대/절대 경로 모두 처리
    const csrfUrl = `${api.defaults.baseURL}/auth/csrf-token`;
    
    console.log('[auth.js] CSRF 토큰 요청 URL:', csrfUrl);
    
    const response = await fetch(csrfUrl);
    console.log('[auth.js] CSRF 토큰 응답 상태:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('[auth.js] CSRF 토큰 응답 실패:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('[auth.js] CSRF 토큰 응답 데이터:', data);
    
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
    console.log('[auth.js] 요청 인터셉터:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL || ''}${config.url || ''}`
    });
    
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
      
      console.log('[auth.js] CSRF 체크:', {
        requestPath: requestPath,
        exemptPaths: CSRF_EXEMPT_PATHS
      });
      
      // CSRF 예외 목록과 비교 (경로만 비교)
      const isExempt = CSRF_EXEMPT_PATHS.some(path => requestPath === path || requestPath.endsWith(path));
      
      console.log('[auth.js] CSRF 예외 여부:', isExempt);
      
      if (!isExempt) {
        // CSRF 예외가 아닌 경우에만 CSRF 토큰 추가
        console.log('[auth.js] CSRF 토큰 요청 중...');
        const csrf = await getCsrfToken();
        if (csrf) {
          config.headers['X-CSRF-Token'] = csrf;
          console.log('[auth.js] CSRF 토큰 추가됨');
        } else {
          console.log('[auth.js] CSRF 토큰 가져오기 실패');
        }
      } else {
        console.log('[auth.js] CSRF 예외 엔드포인트, 토큰 건너뜀');
      }
    }
    
    // 최종 요청 URL 계산 (axios가 실제로 사용할 URL)
    const finalUrl = config.url?.startsWith('http') 
      ? config.url 
      : `${config.baseURL || ''}${config.url || ''}`;
    
    console.log('[auth.js] 최종 요청 설정:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      finalUrl: finalUrl,
      headers: Object.keys(config.headers),
      hasAuth: !!config.headers.Authorization,
      hasCsrf: !!config.headers['X-CSRF-Token']
    });
    
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
