import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
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
  Stack,
  Card,
  CardContent,
  Avatar,
  Skeleton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import { MdSave as SaveIcon, MdEdit as EditIcon, MdAdminPanelSettings as AdminPanelSettings, MdEmail as Email, MdPerson as Person, MdPhone as PhoneIcon, MdSecurity as Security, MdHistory as History, MdLock as LockIcon, MdSettings as SettingsIcon } from 'react-icons/md';
import { authApi } from '../../lib/api/auth';
import { ADMIN_ROLE_LABELS } from '../../constants/adminRoles';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'N/A';
  }
};

const AdminProfilePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const iconColor = theme.palette.primary.main;
  const [adminData, setAdminData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setIsLoading(true);
        const res = await authApi.getCurrentAdmin();
        const admin = res?.data ?? res;
        setAdminData(admin);
        setFormData({ name: admin?.name ?? '', email: admin?.email ?? '' });
      } catch (err) {
        setError('관리자 정보를 불러오는데 실패했습니다.');
        console.error('Load admin data error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAdminData();
  }, []);

  const handleInputChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (error) setError(null);
  };

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
    if (!isEditing && adminData) {
      const admin = adminData?.data ?? adminData;
      setFormData({ name: admin?.name ?? '', email: admin?.email ?? '' });
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      setError('이름과 이메일을 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.updateProfile({ name: formData.name, email: formData.email });
      const updated = res?.data ?? res;
      setAdminData(updated);
      setIsEditing(false);
      setSuccess('프로필이 성공적으로 업데이트되었습니다.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || '프로필 업데이트에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    const admin = adminData?.data ?? adminData;
    if (admin) setFormData({ name: admin.name ?? '', email: admin.email ?? '' });
    setError(null);
  };

  const data = adminData?.data ?? adminData;
  const name = data?.name ?? '';
  const email = data?.email ?? '';
  const phoneNumber = data?.phone_number ?? '';
  const roleLabel = ADMIN_ROLE_LABELS[data?.role] || data?.role || '관리자';

  if (isLoading && !adminData) {
    return (
      <Box sx={{ py: 3, px: 0 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1, mb: 2 }} />
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Skeleton variant="circular" width={96} height={96} sx={{ mx: 'auto', mb: 2 }} />
                <Skeleton variant="text" width="60%" sx={{ mx: 'auto', mb: 1 }} />
                <Skeleton variant="text" width="40%" sx={{ mx: 'auto' }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, px: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={600}>
          관리자 프로필
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<LockIcon />}
            onClick={() => navigate('/settings')}
          >
            비밀번호 변경
          </Button>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/settings')}
          >
            설정
          </Button>
        </Stack>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Person size={24} style={{ color: iconColor }} />
                  <Typography variant="h6" fontWeight={600}>
                    기본 정보
                  </Typography>
                </Box>
                <Button
                  variant={isEditing ? 'outlined' : 'contained'}
                  startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                  onClick={isEditing ? handleSaveProfile : toggleEdit}
                  disabled={isLoading}
                >
                  {isEditing ? '저장' : '편집'}
                </Button>
              </Box>

              {isEditing ? (
                <Stack spacing={2}>
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
                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      {isLoading ? '저장 중...' : '저장'}
                    </Button>
                    <Button variant="outlined" onClick={handleCancelEdit} disabled={isLoading}>
                      취소
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <List disablePadding>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Person size={20} style={{ color: iconColor }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="이름"
                      secondary={name || '-'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Email size={20} style={{ color: iconColor }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="이메일"
                      secondary={email || '-'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <AdminPanelSettings size={20} style={{ color: iconColor }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="관리자 역할"
                      secondary={roleLabel}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <PhoneIcon size={20} style={{ color: iconColor }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="연락처"
                      secondary={phoneNumber || '-'}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ borderRadius: 2, mt: 3, overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <History size={24} style={{ color: iconColor }} />
                <Typography variant="h6" fontWeight={600}>
                  계정 정보
                </Typography>
              </Box>
              <List disablePadding>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemText
                    primary="가입일"
                    secondary={formatDate(data?.created_at)}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                {data?.updated_at && (
                  <ListItem sx={{ px: 0, py: 1 }}>
                    <ListItemText
                      primary="마지막 수정일"
                      secondary={formatDate(data.updated_at)}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 96,
                  height: 96,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  fontWeight: 600,
                }}
              >
                {getInitials(name)}
              </Avatar>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {name || '관리자'}
              </Typography>
              <Chip
                label={roleLabel}
                color="primary"
                icon={<AdminPanelSettings size={16} />}
                sx={{ mb: 2 }}
              />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'left' }}>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Security size={20} style={{ color: iconColor }} />
                    <Typography variant="body2" color="text.secondary">
                      역할: {roleLabel}
                    </Typography>
                  </Box>
                </Paper>
                {phoneNumber && (
                  <Paper variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon size={20} style={{ color: iconColor }} />
                      <Typography variant="body2" color="text.secondary">
                        {phoneNumber}
                      </Typography>
                    </Box>
                  </Paper>
                )}
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History size={20} style={{ color: iconColor }} />
                    <Typography variant="body2" color="text.secondary">
                      가입: {formatDate(data?.created_at)}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminProfilePage;
