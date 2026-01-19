import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  Stack,
  Divider,
  Card,
  CardContent,
  Paper
} from '@mui/material';
import { MdVisibility, MdVisibilityOff, MdSecurity as Security, MdSave as SaveIcon, MdLock as LockIcon, MdTrendingUp as TrendingUpIcon } from 'react-icons/md';
import { authApi } from '../../lib/api/auth';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';

const AdminChangePasswordPage = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [validationErrors, setValidationErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 비밀번호 변경 핸들러
  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    
    // 유효성 검사 에러 초기화
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // 에러 메시지 초기화
    if (error) {
      setError(null);
    }
  };

  // 비밀번호 표시 토글
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // 유효성 검사
  const validateForm = () => {
    const errors = {};
    
    if (!formData.currentPassword) {
      errors.currentPassword = '현재 비밀번호를 입력해주세요.';
    }
    
    if (!formData.newPassword) {
      errors.newPassword = '새 비밀번호를 입력해주세요.';
    } else if (formData.newPassword.length < 6 || formData.newPassword.length > 32) {
      errors.newPassword = '비밀번호는 6자 이상 32자 이하여야 합니다.';
    } else {
      // 영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상 포함 확인
      const hasUpper = /[A-Z]/.test(formData.newPassword);
      const hasLower = /[a-z]/.test(formData.newPassword);
      const hasDigit = /[0-9]/.test(formData.newPassword);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);
      
      const strength = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
      
      if (strength < 2) {
        errors.newPassword = '영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상을 포함해야 합니다.';
      } else if (formData.newPassword === formData.currentPassword) {
        errors.newPassword = '새 비밀번호는 현재 비밀번호와 달라야 합니다.';
      }
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 비밀번호 변경 핸들러
  const handleChangePassword = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await authApi.changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      });
      
      setSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      setError(error.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        비밀번호 변경
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Security style={{ marginRight: 8, color: '#1976d2' }} />
                <Typography variant="h6">
                  보안 설정
                </Typography>
              </Box>

              {/* 성공/에러 메시지 */}
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* 비밀번호 변경 */}
              <Box component="form" onSubmit={handleChangePassword}>
                <TextField
                  fullWidth
                  label="현재 비밀번호"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={handleInputChange('currentPassword')}
                  margin="normal"
                  required
                  error={!!validationErrors.currentPassword}
                  helperText={validationErrors.currentPassword}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: <LockIcon style={{ marginRight: 8, color: 'rgba(0, 0, 0, 0.54)' }} />,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle current password visibility"
                          onClick={() => togglePasswordVisibility('current')}
                          edge="end"
                        >
                          {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="새 비밀번호"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleInputChange('newPassword')}
                  margin="normal"
                  required
                  error={!!validationErrors.newPassword}
                  helperText={validationErrors.newPassword}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: <LockIcon style={{ marginRight: 8, color: 'rgba(0, 0, 0, 0.54)' }} />,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle new password visibility"
                          onClick={() => togglePasswordVisibility('new')}
                          edge="end"
                        >
                          {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="새 비밀번호 확인"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  margin="normal"
                  required
                  error={!!validationErrors.confirmPassword}
                  helperText={validationErrors.confirmPassword}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: <LockIcon style={{ marginRight: 8, color: 'rgba(0, 0, 0, 0.54)' }} />,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => togglePasswordVisibility('confirm')}
                          edge="end"
                        >
                          {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ mt: 3 }}
                >
                  {isLoading ? '변경 중...' : '비밀번호 변경'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 보안 가이드 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              비밀번호 보안 가드
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                6자 이상 32자 이하
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                영문자, 숫자, 특수문자 포함
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                특수문자 사용 권장
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                개인정보 포함 금지
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                기존 비밀번호 변경 권장
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminChangePasswordPage;
