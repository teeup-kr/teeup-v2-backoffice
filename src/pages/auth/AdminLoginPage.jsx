import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  MdVisibility,
  MdVisibilityOff,
  MdAdminPanelSettings as AdminPanelSettings,
  MdLogin as LoginIcon,
} from 'react-icons/md';
import { useLogin } from '../../hooks/useAuth';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useLogin();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  // 입력값 변경 핸들러
  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (error) setError(null);
  };

  // 비밀번호 표시 토글
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // 에러 메시지를 한글로 변환하는 함수
  const getErrorMessage = (error) => {
    // 서버에서 응답을 받은 경우
    if (error.response) {
      const { status, data } = error.response;
      
      // 서버에서 제공한 한글 메시지가 있으면 사용
      if (data?.message) {
        return data.message;
      }
      
      // 상태 코드에 따른 한글 메시지
      switch (status) {
        case 401:
          return '이메일 또는 비밀번호가 올바르지 않습니다.';
        case 403:
          return '접근 권한이 없습니다.';
        case 404:
          return '요청한 리소스를 찾을 수 없습니다.';
        case 500:
          return '서버 에러가 발생했습니다. 잠시 후 다시 시도해주세요.';
        default:
          return `로그인에 실패했습니다. (오류 코드: ${status})`;
      }
    }
    
    // 네트워크 에러
    if (error.request) {
      return '네트워크 연결을 확인해주세요.';
    }
    
    // 기타 에러 (axios 기본 메시지 등)
    const errorMessage = error.message || '';
    if (errorMessage.includes('401')) {
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }
    if (errorMessage.includes('403')) {
      return '접근 권한이 없습니다.';
    }
    if (errorMessage.includes('Network Error') || errorMessage.includes('timeout')) {
      return '네트워크 연결을 확인해주세요.';
    }
    
    return '관리자 로그인에 실패했습니다.';
  };

  // 로그인 핸들러
  const handleLogin = async (event) => {
    event.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setError(null);

    try {
      setIsLoading(true);
      console.log('로그인 시도:', formData.email);
      await login({ email: formData.email, password: formData.password });
      console.log('로그인 성공, 대시보드로 이동');
      // 로그인 성공 시 대시보드로 이동
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('로그인 에러:', error);
      console.error('로그인 에러 상세:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        fullURL: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
        requestURL: error.request?.responseURL,
        responseData: typeof error.response?.data === 'string' 
          ? error.response.data.substring(0, 200) 
          : error.response?.data
      });
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #529668 0%, #407D51 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* 헤더 */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ width: 72, height: 72, mx: 'auto', mb: 2 }}>
              <img
                src="/logo.png"
                alt="Teeup 관리자"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom>
              관리자 로그인
            </Typography>
            <Typography variant="body2" color="text.secondary">
              관리자 계정으로 로그인하세요
            </Typography>
          </Box>

          {/* 에러 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* 로그인 폼 */}
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label="이메일"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
              disabled={isLoading}
            />
            
            <TextField
              fullWidth
              label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              margin="normal"
              required
              autoComplete="current-password"
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <LoginIcon />}
              sx={{ 
                mt: 3, 
                mb: 2,
                background: 'linear-gradient(135deg, #529668 0%, #407D51 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5FA874 0%, #4A8B5E 100%)',
                }
              }}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </Box>

          {/* 하단 정보 */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              관리자 권한이 필요합니다
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminLoginPage;
