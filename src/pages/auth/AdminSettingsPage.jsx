import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
  Card,
  CardContent,
  InputAdornment,
  IconButton
} from '@mui/material';
import { MdSave as SaveIcon, MdSecurity, MdNotifications, MdLanguage, MdPalette, MdAdminPanelSettings, MdPassword, MdEmail, MdPhone, MdTrendingUp as TrendingUpIcon, MdVisibility, MdVisibilityOff, MdCheckCircle, MdCancel } from 'react-icons/md';
import { authApi } from '../../lib/api/auth';
import { useSnackbar } from '../../contexts/SnackbarContext';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';

const AdminSettingsPage = () => {
  const { showSnackbar } = useSnackbar();
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
    },
    appearance: {
      theme: 'light',
      language: 'ko',
    },
  });
  
  const [profileSettings, setProfileSettings] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // 닉네임 관련 상태
  const [nickname, setNickname] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  
  // 비밀번호 관련 상태
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    complexity: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 설정 데이터 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const admin = await authApi.getCurrentAdmin();
        setProfileSettings({
          name: admin.name || '',
          email: admin.email || '',
          phone: admin.phone || '',
        });
        
        // 현재로는 별도 API에서 설정을 가져오지 않음
        // const settingsData = await adminAuthApi.getSettings();
        // setSettings(settingsData);
      } catch (error) {
        setError('설정을 불러오는데 실패했습니다.');
        console.error('Load settings error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 설정 변경 핸들러
  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  // 프로필 설정 변경 핸들러
  const handleProfileChange = (field, value) => {
    setProfileSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 닉네임 핸들러 (RegisterPage.jsx와 동일)
  const handleNicknameChange = (e) => {
    const value = e.target.value;
    setNickname(value);
    setNicknameChecked(false);
    setNicknameMessage('');
    
    if (!value) {
      setNicknameError('닉네임을 입력해주세요.');
    } else if (value.length < 2 || value.length > 20) {
      setNicknameError('닉네임은 2-20자여야 합니다.');
    } else if (!/^[a-zA-Z가-힣0-9]+$/.test(value)) {
      setNicknameError('닉네임은 영문, 한글, 숫자만 사용 가능합니다.');
    } else {
      setNicknameError('');
    }
  };

  // 닉네임 중복 확인 (RegisterPage.jsx와 동일)
  const checkNicknameDuplicate = async () => {
    if (!nickname) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }

    if (nickname.length < 2 || nickname.length > 20) {
      setNicknameError('닉네임은 2-20자여야 합니다.');
      setNicknameChecked(false);
      setNicknameMessage('');
      return;
    }

    if (!/^[a-zA-Z가-힣0-9]+$/.test(nickname)) {
      setNicknameError('닉네임은 영문, 한글, 숫자만 사용 가능합니다.');
      setNicknameChecked(false);
      setNicknameMessage('');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/v1/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.is_available && data.is_valid) {
        setNicknameError('');
        setNicknameChecked(true);
        setNicknameMessage('사용 가능한 닉네임입니다.');
      } else {
        setNicknameError(data.message);
        setNicknameChecked(false);
        setNicknameMessage('');
      }
    } catch (error) {
      console.error('Nickname check error:', error);
      setNicknameError('닉네임 확인 중 오류가 발생했습니다.');
      setNicknameChecked(false);
      setNicknameMessage('');
    }
  };

  // 비밀번호 검증 함수 (RegisterPage.jsx와 동일)
  const checkPasswordConditions = (password) => {
    const lengthCheck = password.length >= 6 && password.length <= 32;
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const complexityCheck = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length >= 2;
    
    setPasswordChecks({
      length: lengthCheck,
      complexity: complexityCheck
    });
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    checkPasswordConditions(value);
    
    if (!value) {
      setPasswordError('');
    } else if (value.length < 6 || value.length > 32) {
      setPasswordError('비밀번호는 6자 이상 32자 이하여야 합니다.');
    } else {
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasDigit = /[0-9]/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const strength = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
      
      if (strength < 2) {
        setPasswordError('영문 대문자, 소문자, 숫자 중 2개 이상을 포함해야 합니다.');
      } else {
        setPasswordError('');
      }
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    if (!value) {
      setConfirmPasswordError('');
    } else if (value !== newPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
    } else {
      setConfirmPasswordError('');
    }
  };

  // 설정 저장
  const handleSaveSettings = async () => {
    // 닉네임 유효성 검사
    if (nickname && !nicknameChecked) {
      setNicknameError('닉네임 중복확인을 해주세요.');
      showSnackbar('닉네임 중복확인을 해주세요.', 'error');
      return;
    }
    
    // 비밀번호 유효성 검사
    if (newPassword) {
      if (!passwordChecks.length) {
        setPasswordError('비밀번호는 6자 이상 32자 이하여야 합니다.');
        showSnackbar('비밀번호는 6자 이상 32자 이하여야 합니다.', 'error');
        return;
      }
      if (!passwordChecks.complexity) {
        setPasswordError('영문 대문자, 소문자, 숫자 중 2개 이상을 포함해야 합니다.');
        showSnackbar('비밀번호 조건을 충족해주세요.', 'error');
        return;
      }
      if (confirmPassword !== newPassword) {
        setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
        showSnackbar('비밀번호가 일치하지 않습니다.', 'error');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // 프로필 정보 업데이트
      const updateData = { ...profileSettings };
      if (nickname && nicknameChecked) {
        updateData.nickname = nickname;
      }
      if (newPassword) {
        updateData.password = newPassword;
      }
      
      await authApi.updateProfile(updateData);
      
      // 설정 정보 업데이트 (현재로는 별도 API 호출)
      // await adminAuthApi.updateSettings(settings);
      
      setSuccess('설정이 성공적으로 저장되었습니다.');
      showSnackbar('프로필이 성공적으로 업데이트되었습니다.', 'success');
      
      // 비밀번호 필드 초기화
      setNewPassword('');
      setConfirmPassword('');
      setPasswordChecks({ length: false, complexity: false });
      setNicknameChecked(false);
      
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      setError(error.response?.data?.message || '설정 저장에 실패했습니다.');
      showSnackbar('프로필 업데이트에 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        관리자 설정
      </Typography>

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

      <Grid container spacing={3}>
        {/* 프로필 설정 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AdminPanelSettings color="primary" style={{ marginRight: 8 }} />
                <Typography variant="h6">
                  프로필 설정
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="이름"
                    value={profileSettings.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="이메일"
                    type="email"
                    value={profileSettings.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="전화번호"
                    value={profileSettings.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="닉네임"
                    value={nickname}
                    onChange={handleNicknameChange}
                    error={!!nicknameError}
                    helperText={nicknameError || nicknameMessage}
                    disabled={isLoading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button 
                            onClick={checkNicknameDuplicate} 
                            disabled={!nickname || nicknameChecked || isLoading}
                            variant="outlined"
                            size="small"
                          >
                            {nicknameChecked ? '확인완료' : '중복확인'}
                          </Button>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    비밀번호 변경
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="새 비밀번호"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordError}
                    helperText={passwordError}
                    disabled={isLoading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="비밀번호 확인"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    error={!!confirmPasswordError}
                    helperText={confirmPasswordError}
                    disabled={isLoading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                {newPassword && (
                  <Grid item xs={12}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          {passwordChecks.length ? <CheckCircle color="success" /> : <Cancel color="error" />}
                        </ListItemIcon>
                        <ListItemText primary="6자 이상 32자 이하" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          {passwordChecks.complexity ? <CheckCircle color="success" /> : <Cancel color="error" />}
                        </ListItemIcon>
                        <ListItemText primary="영문 대문자, 소문자, 숫자 중 2개 이상 포함" />
                      </ListItem>
                    </List>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 알림 설정 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Notifications color="primary" style={{ marginRight: 8 }} />
                <Typography variant="h6">
                  알림 설정
                </Typography>
              </Box>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary="이메일 알림"
                    secondary="중요한 업데이트를 이메일로 받습니다"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.email}
                        onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                        disabled={isLoading}
                      />
                    }
                    label=""
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText
                    primary="푸시 알림"
                    secondary="브라우저 푸시 알림을 받습니다"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.push}
                        onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                        disabled={isLoading}
                      />
                    }
                    label=""
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Phone />
                  </ListItemIcon>
                  <ListItemText
                    primary="SMS 알림"
                    secondary="긴급한 알림을 SMS로 받습니다"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.sms}
                        onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                        disabled={isLoading}
                      />
                    }
                    label=""
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 보안 설정 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Security color="primary" style={{ marginRight: 8 }} />
                <Typography variant="h6">
                  보안 설정
                </Typography>
              </Box>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary="2단계 인증"
                    secondary="추가 보안을 위해 2단계 인증을 활성화합니다"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.twoFactor}
                        onChange={(e) => handleSettingChange('security', 'twoFactor', e.target.checked)}
                        disabled={isLoading}
                      />
                    }
                    label=""
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="세션 타임아웃"
                    secondary={`${settings.security.sessionTimeout}분 후 자동 로그아웃`}
                  />
                  <TextField
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    disabled={isLoading}
                    sx={{ width: 80 }}
                    inputProps={{ min: 5, max: 480 }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 기타 설정 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Palette color="primary" style={{ marginRight: 8 }} />
                <Typography variant="h6">
                  외관 설정
                </Typography>
              </Box>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <Palette />
                  </ListItemIcon>
                  <ListItemText
                    primary="테마"
                    secondary={settings.appearance.theme === 'light' ? '라이트 모드' : '다크 모드'}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.appearance.theme === 'dark'}
                        onChange={(e) => handleSettingChange('appearance', 'theme', e.target.checked ? 'dark' : 'light')}
                        disabled={isLoading}
                      />
                    }
                    label=""
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Language />
                  </ListItemIcon>
                  <ListItemText
                    primary="언어"
                    secondary={settings.appearance.language === 'ko' ? '한국어' : 'English'}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.appearance.language === 'en'}
                        onChange={(e) => handleSettingChange('appearance', 'language', e.target.checked ? 'en' : 'ko')}
                        disabled={isLoading}
                      />
                    }
                    label=""
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 저장 버튼 */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSaveSettings}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          size="large"
        >
          {isLoading ? '저장 중...' : '설정 저장'}
        </Button>
      </Box>
    </Box>
  );
};

export default AdminSettingsPage;
