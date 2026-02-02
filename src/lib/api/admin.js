import axios from 'axios';
import { setupResponseInterceptor, handleApiError } from './errorHandler.js';

// API 기본 설정
// mobile-web과 동일한 로직 사용: 프로덕션에서는 상대 경로 사용
const getApiBaseUrl = () => {
  // 프로덕션 환경에서는 상대 경로 사용 (nginx 프록시 활용)
  if (import.meta.env.PROD) {
    return ''; // 빈 문자열 = 현재 도메인 (mobile-web과 동일)
  }
  
  // 개발 환경: 환경 변수 필수
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!apiBaseUrl) {
    console.error('VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다.');
    throw new Error('VITE_API_BASE_URL 환경 변수가 필요합니다.');
  }
  
  // HTTP URL을 HTTPS로 자동 변환
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (apiBaseUrl.startsWith('http://')) {
      return apiBaseUrl.replace('http://', 'https://');
    }
  }
  
  return apiBaseUrl;
};

const API_BASE_URL = getApiBaseUrl();
const API_VERSION = '/api/v1';

// axios 인스턴스 생성
// mobile-web과 동일하게 baseURL에 API_VERSION 포함
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF 토큰 가져오기 (일회성 토큰이므로 매번 새로 가져옴)
const getCsrfToken = async () => {
  try {
    // CSRF 토큰 새로 가져오기 (일회성 토큰)
    // apiClient의 baseURL을 사용하여 상대/절대 경로 모두 처리
    const csrfUrl = `${apiClient.defaults.baseURL}/auth/csrf-token`;
    
    const response = await fetch(csrfUrl);
    
    if (!response.ok) {
      console.error('CSRF 토큰 응답 실패:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.csrf_token;
  } catch (error) {
    console.error('CSRF 토큰 가져오기 실패:', error);
    return null;
  }
};

// 요청 인터셉터 - JWT 토큰 및 CSRF 토큰 추가
apiClient.interceptors.request.use(
  async (config) => {
    // JWT 토큰 추가
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // GET, HEAD, OPTIONS 요청이 아닌 경우에만 CSRF 토큰 추가
    const method = config.method?.toUpperCase();
    if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrf = await getCsrfToken();
      if (csrf) {
        config.headers['X-CSRF-Token'] = csrf;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정 (apiClient 인스턴스에 적용)
setupResponseInterceptor(apiClient);

// 관리자 대시보드 API
export const adminDashboardApi = {
  // 대시보드 통계 조회
  getStats: async () => {
    try {
      const response = await apiClient.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 대시보드 통계 및 활동 조회 (통합)
  getDashboardStats: async () => {
    try {
      const [statsResponse, activitiesResponse] = await Promise.all([
        apiClient.get('/admin/dashboard/stats'),
        apiClient.get('/admin/dashboard/activities?limit=10')
      ]);
      return {
        data: {
          stats: statsResponse.data,
          recent_activities: activitiesResponse.data.data || activitiesResponse.data || []
        }
      };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 대시보드 데이터 조회 (통계 + 최근 활동)
  getDashboardData: async () => {
    try {
      const [statsResponse, activitiesResponse] = await Promise.all([
        apiClient.get('/admin/dashboard/stats'),
        apiClient.get('/admin/dashboard/activities?limit=10')
      ]);
      return {
        stats: statsResponse.data,
        recent_activities: activitiesResponse.data.data || activitiesResponse.data || []
      };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 최근 활동 조회
  getRecentActivities: async (limit = 10) => {
    try {
      const response = await apiClient.get(`/admin/dashboard/activities?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 알림 목록 조회
  getNotifications: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get(`/admin/notifications?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 알림 읽음 처리
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await apiClient.patch(`/admin/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 모든 알림 읽음 처리
  markAllNotificationsAsRead: async () => {
    try {
      const response = await apiClient.patch('/admin/notifications/read-all');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// 관리자 사용자 API
export const adminUsersApi = {
  // 사용자 목록 조회
  getUsers: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 사용자 상세 조회
  getUser: async (userId) => {
    try {
      const response = await apiClient.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 사용자 생성
  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 사용자 수정
  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 사용자 삭제
  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 사용자 클럽 목록 조회
  getUserClubs: async (userId) => {
    try {
      const response = await apiClient.get(`/admin/users/${userId}/clubs`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 클럽 멤버 메모 조회 (리더/매니저용)
  getMemberNote: async (clubId, userId) => {
    try {
      const response = await apiClient.get(`/clubs/${clubId}/members/${userId}/note`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 클럽 멤버 메모 저장 (리더/매니저용)
  updateMemberNote: async (clubId, userId, note) => {
    try {
      const response = await apiClient.put(`/clubs/${clubId}/members/${userId}/note`, { note });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 사용자 생성 페이지 폼 데이터 조회
  getUserCreateFormData: async () => {
    try {
      const response = await apiClient.get('/admin/users/create');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 사용자 생성 페이지 클럽 목록 조회
  getUserCreateClubs: async () => {
    try {
      const response = await apiClient.get('/admin/users/create/clubs');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 사용자별 라운딩/소셜 참가 목록 조회
  getUserMeetings: async (userId, params = {}) => {
    try {
      const response = await apiClient.get(`/admin/users/${userId}/meetings`, { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 사용자별 핸디캡 업데이트 이력 조회
  getUserHandicapHistory: async (userId, params = {}) => {
    try {
      const response = await apiClient.get(`/admin/users/${userId}/handicap-history`, { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// 관리자 설정 API
export const adminSettingsApi = {
  // 설정 조회
  getSettings: async () => {
    try {
      const response = await apiClient.get('/admin/settings');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 설정 업데이트
  updateSettings: async (settings) => {
    try {
      const response = await apiClient.put('/admin/settings', settings);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 약관 조회
  getTerms: async (type) => {
    try {
      const response = await apiClient.get(`/admin/terms/${type}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 약관 저장
  saveTerms: async (type, data) => {
    try {
      const response = await apiClient.put(`/admin/terms/${type}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 비밀번호 변경
  changePassword: async (data) => {
    try {
      const response = await apiClient.put('/admin/password', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// FAQ 관리 API
export const adminFAQApi = {
  // 카테고리 목록 조회
  getCategories: async () => {
    try {
      const response = await apiClient.get('/admin/faq-categories');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 카테고리 생성
  createCategory: async (data) => {
    try {
      const response = await apiClient.post('/admin/faq-categories', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 카테고리 수정
  updateCategory: async (categoryId, data) => {
    try {
      const response = await apiClient.put(`/admin/faq-categories/${categoryId}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 카테고리 삭제
  deleteCategory: async (categoryId) => {
    try {
      const response = await apiClient.delete(`/admin/faq-categories/${categoryId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // FAQ 목록 조회
  getFaqs: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/faq', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // FAQ 상세 조회
  getFaq: async (faqId) => {
    try {
      const response = await apiClient.get(`/admin/faq/${faqId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // FAQ 생성
  createFaq: async (data) => {
    try {
      const response = await apiClient.post('/admin/faq', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // FAQ 수정
  updateFaq: async (faqId, data) => {
    try {
      const response = await apiClient.put(`/admin/faq/${faqId}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // FAQ 삭제
  deleteFaq: async (faqId) => {
    try {
      const response = await apiClient.delete(`/admin/faq/${faqId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // FAQ 공개/비공개 토글
  toggleActive: async (faqId) => {
    try {
      const response = await apiClient.patch(`/admin/faq/${faqId}/toggle-active`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// 파일 업로드 API
export const uploadApi = {
  // 파일 업로드
  uploadFile: async (file, type = 'image') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await apiClient.post('/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// 공지사항 관리 API
export const adminNoticesApi = {
  // 공지사항 목록 조회
  getNotices: async (params = {}) => {
    try {
      const response = await apiClient.get('/notices', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 공지사항 첨부파일 업로드
  uploadFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/notices/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 공지사항 상세 조회
  getNotice: async (id) => {
    try {
      const response = await apiClient.get(`/notices/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 공지사항 생성
  createNotice: async (data) => {
    try {
      const response = await apiClient.post('/notices', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 공지사항 수정
  updateNotice: async (id, data) => {
    try {
      const response = await apiClient.put(`/notices/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 공지사항 삭제
  deleteNotice: async (id) => {
    try {
      const response = await apiClient.delete(`/notices/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 공지사항 타입 목록 조회
  getNoticeTypes: async () => {
    try {
      const response = await apiClient.get('/notices/types/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// 관리자 라운딩 API
export const adminRoundsApi = {
  // 라운딩 목록 조회 (관리자용 - 모든 클럽 조회 가능)
  getRounds: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/meetings/rounding', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 라운딩 상세 조회 (관리자용)
  getRound: async (roundId) => {
    try {
      const response = await apiClient.get(`/admin/meetings/${roundId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 라운딩 참가자 목록 조회
  getRoundParticipants: async (roundId) => {
    try {
      const response = await apiClient.get(`/rounds/${roundId}/participants`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 라운딩 팀 목록 조회
  getRoundTeams: async (roundId) => {
    try {
      const response = await apiClient.get(`/teams/`, { params: { meeting_id: roundId } });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// 관리자 소셜 모임 API
export const adminSocialsApi = {
  // 소셜 모임 목록 조회 (관리자용 - 모든 클럽 조회 가능)
  getSocials: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/meetings/event', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 소셜 모임 상세 조회 (관리자용)
  getSocial: async (socialId) => {
    try {
      const response = await apiClient.get(`/admin/meetings/${socialId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // 소셜 모임 참가자 목록 조회 (범용 API 사용)
  getSocialParticipants: async (socialId) => {
    try {
      const response = await apiClient.get(`/meetings/${socialId}/participants`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// 관리자 모임 정산 API
export const adminMeetingSettlementApi = {
  // 모임 정산 조회
  getMeetingSettlement: async (meetingId) => {
    try {
      const response = await apiClient.get(`/meetings/${meetingId}/settlement`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// 관리자 클라이언트 토큰 API
export const adminClientTokenApi = {
  generateClientToken: async () => {
    try {
      const response = await apiClient.post('/admin/generate-client-token');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// 클라이언트 URL 유틸리티
export const getClientUrl = () => {
  // 환경 변수 필수 (하드코딩된 도메인 제거)
  const clientUrl = import.meta.env.VITE_CLIENT_URL;
  
  if (!clientUrl) {
    console.error('VITE_CLIENT_URL 환경 변수가 설정되지 않았습니다.');
    throw new Error('VITE_CLIENT_URL 환경 변수가 필요합니다.');
  }
  
  return clientUrl;
};


