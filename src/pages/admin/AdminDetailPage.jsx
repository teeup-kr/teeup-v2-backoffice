import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import { MdArrowBack as ArrowLeft, MdEdit as EditIcon } from 'react-icons/md';
import { adminAdminsApi } from '../../lib/api/admin';
import { ADMIN_ROLE_LABELS } from '../../constants/adminRoles';
import MainCard from '../../components/MainCard';
import ExtendedAvatar from '../../components/@extended/Avatar';
import { MdAdminPanelSettings as AdminIcon } from 'react-icons/md';

const getStatusLabel = (status) => {
  switch (status) {
    case 'ACTIVE': return '활성';
    case 'DEACTIVATED': return '비활성';
    case 'DELETED': return '삭제됨';
    default: return status || '-';
  }
};

const AdminDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { admin: currentAdmin } = useAuth();
  const isSuperAdmin = currentAdmin?.role === 'SUPER_ADMIN';

  const { data: admin, isLoading, error } = useQuery({
    queryKey: ['admin', id],
    queryFn: () => adminAdminsApi.getAdmin(parseInt(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !admin) {
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
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Button startIcon={<ArrowLeft />} onClick={() => navigate('/admins')} variant="outlined">
            목록으로
          </Button>
          {isSuperAdmin && (
            <Button
              startIcon={<EditIcon />}
              variant="contained"
              onClick={() => navigate(`/admins/${id}/edit`)}
            >
              수정
            </Button>
          )}
        </Stack>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
              <ExtendedAvatar alt={admin.name} color="primary" size="lg">
                <AdminIcon size={40} />
              </ExtendedAvatar>
              <Box flex={1}>
                <Typography variant="h4" gutterBottom>
                  {admin.name || admin.email?.split('@')[0]}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={getStatusLabel(admin.status)} color="success" size="small" />
                  {admin.role && (
                    <Chip
                      label={ADMIN_ROLE_LABELS[admin.role] || admin.role}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              기본 정보
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="textSecondary">이메일</Typography>
                <Typography variant="body1">{admin.email}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">이름</Typography>
                <Typography variant="body1">{admin.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">상태</Typography>
                <Typography variant="body1">{getStatusLabel(admin.status)}</Typography>
              </Box>
              {admin.role && (
                <Box>
                  <Typography variant="caption" color="textSecondary">역할</Typography>
                  <Typography variant="body1">{ADMIN_ROLE_LABELS[admin.role] || admin.role}</Typography>
                </Box>
              )}
              {admin.phone_number && (
                <Box>
                  <Typography variant="caption" color="textSecondary">전화번호</Typography>
                  <Typography variant="body1">{admin.phone_number}</Typography>
                </Box>
              )}
              {admin.created_at && (
                <Box>
                  <Typography variant="caption" color="textSecondary">등록일</Typography>
                  <Typography variant="body1">
                    {new Date(admin.created_at).toLocaleString('ko-KR')}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </MainCard>
    </Box>
  );
};

export default AdminDetailPage;
