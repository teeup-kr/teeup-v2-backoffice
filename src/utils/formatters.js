// 데이터 포맷팅 유틸리티 함수들

// 날짜 포맷팅
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY-MM-DD HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'HH:mm':
      return `${hours}:${minutes}`;
    case 'HH:mm:ss':
      return `${hours}:${minutes}:${seconds}`;
    default:
      return d.toLocaleDateString('ko-KR');
  }
};

// 상대 시간 포맷팅
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diff = now - target;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  if (weeks < 4) return `${weeks}주 전`;
  if (months < 12) return `${months}개월 전`;
  return `${years}년 전`;
};

// 숫자 포맷팅
export const formatNumber = (number, options = {}) => {
  if (number === null || number === undefined) return '';
  
  const {
    decimals = 0,
    thousandsSeparator = ',',
    decimalSeparator = '.',
    prefix = '',
    suffix = '',
  } = options;
  
  const num = Number(number);
  if (isNaN(num)) return '';
  
  const formatted = num.toFixed(decimals);
  const [integer, decimal] = formatted.split('.');
  
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  const formattedDecimal = decimal ? `${decimalSeparator}${decimal}` : '';
  
  return `${prefix}${formattedInteger}${formattedDecimal}${suffix}`;
};

// 통화 포맷팅
export const formatCurrency = (amount, currency = 'KRW') => {
  if (amount === null || amount === undefined) return '';
  
  const num = Number(amount);
  if (isNaN(num)) return '';
  
  switch (currency) {
    case 'KRW':
      return `${formatNumber(num, { decimals: 0 })}원`;
    case 'USD':
      return `$${formatNumber(num, { decimals: 2 })}`;
    case 'EUR':
      return `€${formatNumber(num, { decimals: 2 })}`;
    default:
      return `${formatNumber(num, { decimals: 2 })} ${currency}`;
  }
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// 퍼센트 포맷팅
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '';
  
  const num = Number(value);
  if (isNaN(num)) return '';
  
  return `${num.toFixed(decimals)}%`;
};

// 전화번호 포맷팅
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  
  return phone;
};

// 이메일 마스킹
export const maskEmail = (email) => {
  if (!email) return '';
  
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  const maskedUsername = username.length > 2 
    ? `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}`
    : username;
  
  return `${maskedUsername}@${domain}`;
};

// 이름 마스킹
export const maskName = (name) => {
  if (!name) return '';
  
  if (name.length <= 2) {
    return `${name[0]}*`;
  }
  
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
};

// 상태 텍스트 포맷팅
export const formatStatus = (status) => {
  const statusMap = {
    ACTIVE: '활성',
    INACTIVE: '비활성',
    PENDING: '대기',
    APPROVED: '승인',
    REJECTED: '거부',
    SUSPENDED: '정지',
    COMPLETED: '완료',
    CANCELLED: '취소',
    SCHEDULED: '예정',
    IN_PROGRESS: '진행중',
  };
  
  return statusMap[status] || status;
};

// 역할 텍스트 포맷팅
export const formatRole = (role) => {
  const roleMap = {
    ADMIN: '관리자',
    USER: '사용자',
    LEADER: '리더',
    MEMBER: '멤버',
    GUEST: '게스트',
  };
  
  return roleMap[role] || role;
};

// 배열을 문자열로 변환
export const formatArray = (array, separator = ', ') => {
  if (!Array.isArray(array)) return '';
  return array.join(separator);
};

// 객체를 쿼리 스트링으로 변환
export const formatQueryString = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  
  return searchParams.toString();
};
