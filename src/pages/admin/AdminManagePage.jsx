import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import { MdAdd as AddIcon, MdDelete as DeleteIcon, MdRefresh as RefreshIcon, MdVisibility as VisibilityIcon, MdSearch as SearchIcon, MdFilterList as FilterIcon, MdAdminPanelSettings as AdminIcon } from 'react-icons/md';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAdminsApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';

// 상태별 색상
const getStatusColor = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'DEACTIVATED':
      return 'warning';
    case 'DELETED':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'ACTIVE':
      return '활성';
    case 'DEACTIVATED':
      return '비활성';
    case 'DELETED':
      return '삭제됨';
    default:
      return status || '알 수 없음';
  }
};

const AdminManagePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const { admin: currentAdmin } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  const { data: adminsData, isLoading, error } = useQuery({
    queryKey: ['admins', page, rowsPerPage, activeSearchTerm, activeStatusFilter],
    queryFn: () =>
      adminAdminsApi.getAdmins({
        page: page + 1,
        limit: rowsPerPage,
        search: activeSearchTerm || undefined,
        status_filter: activeStatusFilter || undefined,
      }),
    staleTime: 0,
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['admins'] });
  }, []);

  const deleteAdminMutation = useMutation({
    mutationFn: (id) => adminAdminsApi.deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setDeleteDialogOpen(false);
      showSnackbar('관리자가 성공적으로 삭제되었습니다.', 'success');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || '관리자 삭제에 실패했습니다.';
      showSnackbar(errorMessage, 'error');
    },
  });

  const handleDeleteAdmin = (admin) => {
    setAdminToDelete(admin);
    setDeleteDialogOpen(true);
  };

  const handleViewAdmin = (admin) => {
    navigate(`/admins/${admin.id}`);
  };

  const handleConfirmDelete = () => {
    if (adminToDelete) {
      deleteAdminMutation.mutate(adminToDelete.id);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setActiveStatusFilter(statusFilter);
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setActiveSearchTerm('');
    setActiveStatusFilter('');
    setPage(0);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admins'] });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        관리자 목록을 불러오는데 실패했습니다.
      </Alert>
    );
  }

  // API 응답 구조: { data: [...], total, total_count, total_pages 등 }
  const admins = Array.isArray(adminsData?.data) ? adminsData.data : [];
  const totalCount = adminsData?.total ?? adminsData?.total_count ?? 0;

  return (
    <Box>
      <MainCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              관리자 관리
            </Typography>
            <Typography variant="body1" color="textSecondary">
              백오피스 관리자 계정 목록 및 관리
              {totalCount > 0 && <span> (총 {totalCount.toLocaleString()}명)</span>}
            </Typography>
          </Box>
          <AnimateButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admins/create')}
              size="large"
            >
              관리자 추가
            </Button>
          </AnimateButton>
        </Stack>
      </MainCard>

      <MainCard sx={{ mb: 3 }}>
        {(activeSearchTerm || activeStatusFilter) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              적용된 필터:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {activeSearchTerm && (
                <Chip
                  label={`검색 "${activeSearchTerm}"`}
                  onDelete={() => {
                    setSearchTerm('');
                    setActiveSearchTerm('');
                    setPage(0);
                  }}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
              {activeStatusFilter && (
                <Chip
                  label={`상태: ${getStatusLabel(activeStatusFilter)}`}
                  onDelete={() => {
                    setStatusFilter('');
                    setActiveStatusFilter('');
                    setPage(0);
                  }}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
          </Box>
        )}

        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center" useFlexGap>
          <TextField
            placeholder="이메일, 닉네임 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            size="small"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={20} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>상태</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="상태">
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="ACTIVE">활성</MenuItem>
              <MenuItem value="DEACTIVATED">비활성</MenuItem>
              <MenuItem value="DELETED">삭제됨</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleSearch} startIcon={<SearchIcon />}>
            검색
          </Button>
          <Button variant="outlined" onClick={handleRefresh} startIcon={<RefreshIcon />}>
            새로고침
          </Button>
          <Button variant="outlined" onClick={handleResetFilters} startIcon={<FilterIcon />}>
            초기화
          </Button>
        </Stack>
      </MainCard>

      <MainCard>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="60" align="center">번호</TableCell>
                <TableCell>관리자</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>등록일</TableCell>
                <TableCell align="center" width="120">액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Stack spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          bgcolor: 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AdminIcon size={32} style={{ color: 'rgba(0, 0, 0, 0.6)' }} />
                      </Box>
                      <Typography variant="h6" color="text.secondary">
                        {(activeSearchTerm || activeStatusFilter)
                          ? '해당하는 관리자가 없습니다'
                          : '등록된 관리자가 없습니다'}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin, index) => (
                  <TableRow key={admin.id} hover>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="600">
                        {totalCount - (page * rowsPerPage + index)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        onClick={() => handleViewAdmin(admin)}
                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                      >
                        <ExtendedAvatar alt={admin.name} color="primary" size="sm">
                          <AdminIcon />
                        </ExtendedAvatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="600">
                            {admin.name || admin.email?.split('@')[0]}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {admin.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{admin.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(admin.status)}
                        color={getStatusColor(admin.status)}
                        size="small"
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {admin.created_at
                          ? new Date(admin.created_at).toLocaleDateString('ko-KR')
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="상세보기">
                          <IconButton size="small" onClick={() => handleViewAdmin(admin)} color="primary">
                            <VisibilityIcon size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            currentAdmin?.id === admin.id
                              ? '본인 계정은 삭제할 수 없습니다'
                              : '삭제'
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteAdmin(admin)}
                              color="error"
                              disabled={currentAdmin?.id === admin.id}
                            >
                              <DeleteIcon size={20} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행수:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
          }
        />
      </MainCard>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>관리자 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 <strong>{adminToDelete?.name || adminToDelete?.email}</strong> 관리자를 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteAdminMutation.isPending}
          >
            {deleteAdminMutation.isPending ? <CircularProgress size={20} /> : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminManagePage;
