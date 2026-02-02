import axios from 'axios';

// 응답 인터셉터 설정 (axios 인스턴스 파라미터로 받을 수 있음)
export const setupResponseInterceptor = (axiosInstance = axios) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      // 에러 상세 정보 로깅
      console.error('[errorHandler] API 에러 발생:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        fullURL: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
        responseData: error.response?.data
      });
      
      if (error.response) {
        // 서버에서 응답을 받았지만 에러 상태
        const { status, data } = error.response;
        
        switch (status) {
          case 401:
            // 인증 실패 - 로그인 페이지로 리다이렉트
            handleAuthError('세션이 만료되었습니다. 다시 로그인해주세요.');
            break;
          case 403:
            // 권한 없음 또는 세션 만료 - 인증 관련 403인 경우 로그인 페이지로 리다이렉트
            const errorMessage = (data?.message || data?.detail || '').toLowerCase();
            // 인증 관련 403 에러인 경우 (토큰 만료, 세션 만료 등)
            if (errorMessage.includes('인증') || 
                errorMessage.includes('세션') || 
                errorMessage.includes('토큰') ||
                errorMessage.includes('로그인') ||
                errorMessage.includes('authentication') ||
                errorMessage.includes('not authenticated') ||
                errorMessage.includes('session') ||
                errorMessage.includes('token') ||
                errorMessage.includes('unauthorized') ||
                errorMessage.includes('expired')) {
              handleAuthError('세션이 만료되었습니다. 다시 로그인해주세요.');
            } else {
              // 일반적인 권한 없음 에러
              console.error('권한이 없습니다:', data?.message || data?.detail);
              if (window.showSnackbar) {
                window.showSnackbar('접근 권한이 없습니다.', 'error');
              }
            }
            break;
          case 404:
            // 리소스 없음
            console.error('리소스를 찾을 수 없습니다:', data?.message || data?.detail || '리소스를 찾을 수 없습니다');
            break;
          case 405:
            // Method Not Allowed - 요청 메서드가 허용되지 않음
            const methodErrorMsg = data?.message || data?.detail || '요청한 메서드가 허용되지 않습니다. 서버 설정을 확인해주세요.';
            console.error('Method Not Allowed (405):', methodErrorMsg);
            if (window.showSnackbar) {
              window.showSnackbar('요청 방법이 올바르지 않습니다. 관리자에게 문의해주세요.', 'error');
            }
            break;
          case 500:
            // 서버 에러
            const errorMsg = data?.message || data?.detail || '서버 내부 오류가 발생했습니다';
            console.error('서버 에러:', errorMsg);
            if (window.showSnackbar) {
              window.showSnackbar(errorMsg, 'error');
            }
            break;
          default:
            console.error('알 수 없는 에러:', data?.message || data?.detail || '알 수 없는 에러가 발생했습니다');
        }
      } else if (error.request) {
        // 요청을 보냈지만 응답을 받지 못함
        console.error('네트워크 에러:', error.message);
        if (window.showSnackbar) {
          window.showSnackbar('네트워크 연결을 확인해주세요.', 'error');
        }
      } else {
        // 요청 설정 중 에러
        console.error('요청 설정 에러:', error.message);
      }
      
      return Promise.reject(error);
    }
  );
};

// 인증 에러 처리 공통 함수
const handleAuthError = (message) => {
  // 로그인 페이지가 아닌 경우에만 리다이렉트
  if (window.location.pathname !== '/auth/login') {
    // 스낵바 알림 표시 (가능한 경우)
    if (window.showSnackbar) {
      window.showSnackbar(message, 'warning');
    } else {
      // 스낵바가 아직 준비되지 않은 경우 alert 사용
      alert(message);
    }
    
    // 로컬 스토리지 정리
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    
    // 짧은 딜레이 후 리다이렉트 (메시지 확인 시간 제공)
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, window.showSnackbar ? 2000 : 100);
  }
};

// 통합 에러 핸들러
export const handleApiError = (error) => {
  if (error.response) {
    const data = error.response.data;
    return data?.message || data?.detail || '서버 에러가 발생했습니다.';
  } else if (error.request) {
    return '네트워크 연결을 확인해주세요.';
  } else {
    return '알 수 없는 에러가 발생했습니다.';
  }
};
