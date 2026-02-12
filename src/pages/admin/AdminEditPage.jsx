import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { useAuth } from '@/hooks/useAuth';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { MdArrowBack as ArrowLeft } from 'react-icons/md';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAdminsApi } from '../../lib/api/admin';
import { ADMIN_ROLE_LABELS } from '../../constants/adminRoles';
import MainCard from '../../components/MainCard';

const AdminEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const { admin: currentAdmin } = useAuth();

  useEffect(() => {
    if (currentAdmin && currentAdmin.role !== 'SUPER_ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [currentAdmin, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    status: 'ACTIVE',
    role: 'SUPER_ADMIN',
  });
  const [errors, setErrors] = useState({});

  const { data: admin, isLoading, error } = useQuery({
    queryKey: ['admin', id],
    queryFn: () => adminAdminsApi.getAdmin(parseInt(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || '',
        phone_number: admin.phone_number || '',
        status: admin.status || 'ACTIVE',
        role: admin.role || 'SUPER_ADMIN',
      });
    }
  }, [admin]);

  const updateAdminMutation = useMutation({
    mutationFn: (data) => adminAdminsApi.updateAdmin(parseInt(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', id] });
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      showSnackbar('관리자 정보가 수정되었습니다.', 'success');
      navigate(`/admins/${id}`);
    },
    onError: (error) => {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'object' && detail) {
        setErrors(detail);
      } else {
        showSnackbar(detail || '수정에 실패했습니다.', 'error');
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name?.trim()) newErrors.name = '이름을 입력해주세요.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    updateAdminMutation.mutate({
      name: formData.name,
      phone_number: formData.phone_number || null,
      status: formData.status,
      role: formData.role,
    });
  };

  if (currentAdmin && currentAdmin.role !== 'SUPER_ADMIN') {
    return null;
  }

  if (isLoading || !admin) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        관리자 정보를 불러오는데 실패했습니다.
        <Button startIcon={<ArrowLeft />} onClick={() => navigate('/admins')} sx={{ ml: 2 }}>
          목록으로
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <MainCard>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/admins/${id}`)} variant="outlined">
            상세보기
          </Button>
          <Typography variant="h4">관리자 수정</Typography>
        </Stack>

        {updateAdminMutation.isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {updateAdminMutation.error?.response?.data?.detail || '수정에 실패했습니다.'}
          </Alert>
        )}

        <Card variant="outlined">
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3} sx={{ maxWidth: 400 }}>
                <TextField
                  fullWidth
                  label="이메일"
                  value={admin.email}
                  disabled
                  helperText="이메일은 변경할 수 없습니다."
                />
                <TextField
                  fullWidth
                  label="이름"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
                <TextField
                  fullWidth
                  label="전화번호"
                  value={formData.phone_number}
                  onChange={(e) => setFormData((p) => ({ ...p, phone_number: e.target.value }))}
                  error={!!errors.phone_number}
                  helperText={errors.phone_number}
                />
                <FormControl fullWidth>
                  <InputLabel>상태</InputLabel>
                  <Select
                    value={formData.status}
                    label="상태"
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                  >
                    <MenuItem value="ACTIVE">활성</MenuItem>
                    <MenuItem value="DEACTIVATED">비활성</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>역할</InputLabel>
                  <Select
                    value={formData.role}
                    label="역할"
                    onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                  >
                    {Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={2}>
                  <Button type="submit" variant="contained" disabled={updateAdminMutation.isPending}>
                    {updateAdminMutation.isPending ? <CircularProgress size={24} /> : '저장'}
                  </Button>
                  <Button variant="outlined" onClick={() => navigate(`/admins/${id}`)}>
                    취소
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </MainCard>
    </Box>
  );
};

export default AdminEditPage;
