// 에러 처리 유틸리티 함수들

// API 에러 메시지 추출
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return '알 수 없는 오류가 발생했습니다.';
};

// HTTP 상태 코드별 에러 메시지
export const getHttpErrorMessage = (status) => {
  const messages = {
    400: '잘못된 요청입니다.',
    401: '인증이 필요합니다.',
    403: '접근 권한이 없습니다.',
    404: '요청한 리소스를 찾을 수 없습니다.',
    409: '이미 존재하는 데이터입니다.',
    422: '입력 데이터가 올바르지 않습니다.',
    500: '서버 내부 오류가 발생했습니다.',
    502: '게이트웨이 오류가 발생했습니다.',
    503: '서비스를 사용할 수 없습니다.',
  };
  
  return messages[status] || '알 수 없는 오류가 발생했습니다.';
};

// 에러 타입 확인
export const isNetworkError = (error) => {
  return !error.response;
};

export const isTimeoutError = (error) => {
  return error.code === 'ECONNABORTED';
};

export const isAuthError = (error) => {
  return error.response?.status === 401;
};

export const isPermissionError = (error) => {
  return error.response?.status === 403;
};

export const isNotFoundError = (error) => {
  return error.response?.status === 404;
};

export const isValidationError = (error) => {
  return error.response?.status === 422;
};

export const isServerError = (error) => {
  return error.response?.status >= 500;
};

// 에러 로깅
export const logError = (error, context = '') => {
  console.error(`[${context}] Error:`, {
    message: getErrorMessage(error),
    status: error.response?.status,
    data: error.response?.data,
    stack: error.stack,
  });
};

// 에러 알림 메시지 생성
export const createErrorNotification = (error) => {
  const message = getErrorMessage(error);
  const status = error.response?.status;
  
  if (status) {
    return `${getHttpErrorMessage(status)}: ${message}`;
  }
  
  return message;
};

// 재시도 가능한 에러인지 확인
export const isRetryableError = (error) => {
  if (isNetworkError(error) || isTimeoutError(error)) {
    return true;
  }
  
  if (error.response?.status >= 500) {
    return true;
  }
  
  return false;
};

// 에러 복구 제안
export const getErrorRecoverySuggestion = (error) => {
  if (isAuthError(error)) {
    return '다시 로그인해주세요.';
  }
  
  if (isPermissionError(error)) {
    return '관리자에게 권한을 요청해주세요.';
  }
  
  if (isNotFoundError(error)) {
    return '요청한 데이터가 존재하지 않습니다.';
  }
  
  if (isValidationError(error)) {
    return '입력한 정보를 다시 확인해주세요.';
  }
  
  if (isServerError(error)) {
    return '잠시 후 다시 시도해주세요.';
  }
  
  if (isNetworkError(error)) {
    return '네트워크 연결을 확인해주세요.';
  }
  
  return '문제가 지속되면 관리자에게 문의해주세요.';
};
