import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Grid,
  Stack
} from '@mui/material';
import { MdSave as SaveIcon, MdEdit as EditIcon, MdAdminPanelSettings, MdEmail, MdPerson, MdSecurity, MdHistory, MdTrendingUp as TrendingUpIcon } from 'react-icons/md';
import { authApi } from '../../lib/api/auth';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';

const AdminProfilePage = () => {
  const [adminData, setAdminData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 관리자 정보 로드
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setIsLoading(true);
        const admin = await authApi.getCurrentAdmin();
        setAdminData(admin);
        setFormData({
          name: admin.name,
          email: admin.email,
        });
      } catch (error) {
        setError('관리자 정보를 불러오는데 실패했습니다.');
        console.error('Load admin data error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, []);

  // 입력값 변경 핸들러
  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (error) setError(null);
  };

  // 편집 모드 토글
  const toggleEdit = () => {
    setIsEditing(prev => !prev);
    if (!isEditing && adminData) {
      // 편집 모드 진입 시 현재 정보로 초기화
      setFormData({
        name: adminData.name,
        email: adminData.email,
      });
    }
  };

  // 프로필 저장
  const handleSaveProfile = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('이름과 이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedAdmin = await authApi.updateProfile({
        name: formData.name,
        email: formData.email,
      });

      setAdminData(updatedAdmin);
      setIsEditing(false);
      setSuccess('프로필이 성공적으로 업데이트되었습니다.');
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      setError(error.response?.data?.message || '프로필 업데이트에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (adminData) {
      setFormData({
        name: adminData.name,
        email: adminData.email,
      });
    }
    setError(null);
  };

  if (isLoading && !adminData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        관리자 프로필
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
        {/* 프로필 정보 카드 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  기본 정보
                </Typography>
                <Button
                  variant={isEditing ? "outlined" : "contained"}
                  startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                  onClick={isEditing ? handleSaveProfile : toggleEdit}
                  disabled={isLoading}
                >
                  {isEditing ? '저장' : '편집'}
                </Button>
              </Box>

              {isEditing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="이름"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    disabled={isLoading}
                  />
                  <TextField
                    fullWidth
                    label="이메일"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    disabled={isLoading}
                  />
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      {isLoading ? '저장 중...' : '저장'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                    >
                      취소
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Person color="primary" />
                    <Typography variant="body1">
                      <strong>이름:</strong> {adminData?.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Email color="primary" />
                    <Typography variant="body1">
                      <strong>이메일:</strong> {adminData?.email}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 프로필 아바타 및 상태 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                }}
              >
                <AdminPanelSettings style={{ fontSize: 40 }} />
              </Avatar>
              
              <Typography variant="h6" gutterBottom>
                {adminData?.name}
              </Typography>
              
              <Chip
                label="관리자"
                color="primary"
                icon={<AdminPanelSettings />}
                sx={{ mb: 2 }}
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Security color="action" />
                  <Typography variant="body2" color="text.secondary">
                    관리자 권한
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <History color="action" />
                  <Typography variant="body2" color="text.secondary">
                    가입일: {adminData?.created_at ? new Date(adminData.created_at).toLocaleDateString('ko-KR') : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminProfilePage;
