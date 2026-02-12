import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../../contexts/SnackbarContext';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAdminsApi } from '../../lib/api/admin';
import { ADMIN_ROLES, ADMIN_ROLE_LABELS } from '../../constants/adminRoles';
import MainCard from '../../components/MainCard';

const AdminCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone_number: '',
    role: 'SUPER_ADMIN',
  });
  const [errors, setErrors] = useState({});

  const createAdminMutation = useMutation({
    mutationFn: (data) => adminAdminsApi.createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      showSnackbar('관리자가 성공적으로 등록되었습니다.', 'success');
      navigate('/admins');
    },
    onError: (error) => {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'object' && detail) {
        setErrors(detail);
      } else {
        showSnackbar(detail || '관리자 등록에 실패했습니다.', 'error');
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email?.trim()) newErrors.email = '이메일을 입력해주세요.';
    if (!formData.password?.trim()) newErrors.password = '비밀번호를 입력해주세요.';
    else if (formData.password.length < 6) newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    if (!formData.name?.trim()) newErrors.name = '이름을 입력해주세요.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    createAdminMutation.mutate(formData);
  };

  return (
    <Box>
      <MainCard>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Button startIcon={<ArrowLeft />} onClick={() => navigate('/admins')} variant="outlined">
            목록으로
          </Button>
          <Typography variant="h4">관리자 추가</Typography>
        </Stack>

        {createAdminMutation.isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {createAdminMutation.error?.response?.data?.detail || '등록에 실패했습니다.'}
          </Alert>
        )}

        <Card variant="outlined">
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3} sx={{ maxWidth: 400 }}>
                <TextField
                  fullWidth
                  label="이메일"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                />
                <TextField
                  fullWidth
                  label="비밀번호"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  error={!!errors.password}
                  helperText={errors.password}
                  required
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
                  <Button type="submit" variant="contained" disabled={createAdminMutation.isPending}>
                    {createAdminMutation.isPending ? <CircularProgress size={24} /> : '등록'}
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/admins')}>
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

export default AdminCreatePage;
