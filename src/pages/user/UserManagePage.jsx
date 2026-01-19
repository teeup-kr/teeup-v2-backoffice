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
  Grid,
  Tooltip,
  InputAdornment,
  Stack,
} from '@mui/material';
import { MdAdd as AddIcon, MdDelete as DeleteIcon, MdRefresh as RefreshIcon, MdVisibility as VisibilityIcon, MdSearch as SearchIcon, MdFilterList as FilterIcon, MdBlock as BlockIcon, MdCheckCircle as CheckIcon, MdPerson as PersonIcon } from 'react-icons/md';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';

// 사용자 상태별 색상 매핑
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

// 역할별 색상 매핑
const getRoleColor = (role) => {
  switch (role) {
    case 'ADMIN':
      return 'error';
    case 'USER':
      return 'primary';
    default:
      return 'default';
  }
};

// 역할별 텍스트 표시
const getRoleLabel = (role) => {
  switch (role) {
    case 'ADMIN':
      return '관리자';
    case 'USER':
      return '일반 사용자';
    default:
      return role || '알 수 없음';
  }
};

// 상태별 텍스트 표시
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

// 사용자 관리 메인 컴포넌트
const UserManagePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const { admin: currentAdmin } = useAuth();
  
  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 필터 상태 (UI용)
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  
  // 실제 검색에 사용되는 상태 (검색버튼 클릭 시에만 업데이트)
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [activeRole, setActiveRole] = useState('');
  
  // 다이얼로그 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // 사용자 목록 조회
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', page, rowsPerPage, activeSearchTerm, activeStatus, activeRole, 'recent'],
    queryFn: () => {
      console.log('API 호출 파라미터:', {
        page: page + 1,
        limit: rowsPerPage,
        search: activeSearchTerm,
        role_filter: activeRole,
        status_filter: activeStatus,
        sort_order: 'recent'
      });
      return adminUsersApi.getUsers({
        page: page + 1,
        limit: rowsPerPage,
        search: activeSearchTerm,
        role_filter: activeRole,
        status_filter: activeStatus,
        sort_order: 'recent'
      });
    },
    staleTime: 0,
    cacheTime: 0
  });

  // 컴포넌트 마운트 시 기존 캐시 무효화
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }, []);

  // 사용자 삭제 뮤테이션
  const deleteUserMutation = useMutation({
    mutationFn: async (id) => {
      return adminUsersApi.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialogOpen(false);
      showSnackbar('사용자가 성공적으로 삭제되었습니다.', 'success');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || '사용자 삭제에 실패했습니다.';
      showSnackbar(errorMessage, 'error');
    },
  });

  // 사용자 상태 변경 뮤테이션
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }) => {
      return adminUsersApi.updateUser(userId, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const statusLabel = variables.status === 'DEACTIVATED' ? '비활성화' : '활성화';
      showSnackbar(`사용자가 성공적으로 ${statusLabel}되었습니다.`, 'success');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || '사용자 상태 변경에 실패했습니다.';
      showSnackbar(errorMessage, 'error');
    },
  });

  // 이벤트 핸들러들
  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleViewUser = (user) => {
    navigate(`/users/${user.id}`);
  };

  const handleToggleStatus = (user) => {
    // 본인인지 확인 (관리자 계정은 users 테이블에 저장되므로 이메일로 비교)
    if (currentAdmin && currentAdmin.email === user.email) {
      showSnackbar('본인 계정은 비활성화할 수 없습니다.', 'error');
      return;
    }
    
    const newStatus = user.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    updateUserStatusMutation.mutate({ userId: user.id, status: newStatus });
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 검색 필터 핸들러들
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setActiveStatus(status);
    setActiveRole(role);
    setPage(0);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatus('');
    setRole('');
    setActiveSearchTerm('');
    setActiveStatus('');
    setActiveRole('');
    setPage(0);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
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
        사용자 목록을 불러오는데 실패했습니다.
      </Alert>
    );
  }

  // 백엔드 API 응답 구조: { data: [...], total: ..., page: ..., limit: ..., total_pages: ... }
  // axios response.data 구조: { data: [...], total: ..., page: ..., limit: ..., total_pages: ... }
  const users = Array.isArray(usersData?.data) ? usersData.data : [];
  const totalCount = usersData?.total || 0;

  return (
    <Box>
      {/* 헤더 */}
      <MainCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              사용자 관리
            </Typography>
            <Typography variant="body1" color="textSecondary">
              시스템 사용자 목록 및 관리
              {totalCount > 0 && (
                <span> (총{totalCount.toLocaleString()}명)</span>
              )}
            </Typography>
          </Box>
          <AnimateButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/users/create')}
              size="large"
            >
              사용자 생성
            </Button>
          </AnimateButton>
        </Stack>
      </MainCard>

      {/* 검색 및 필터 */}
      <MainCard sx={{ mb: 3 }}>
        {/* 적용된 필터 표시 */}
        {(activeSearchTerm || activeStatus || activeRole) && (
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
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                  }}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
              {activeStatus && (
                <Chip
                  label={`상태: ${getStatusLabel(activeStatus)}`}
                  onDelete={() => {
                    setStatus('');
                    setActiveStatus('');
                    setPage(0);
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                  }}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              )}
              {activeRole && (
                <Chip
                  label={`역할: ${getRoleLabel(activeRole)}`}
                  onDelete={() => {
                    setRole('');
                    setActiveRole('');
                    setPage(0);
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                  }}
                  color="info"
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
          </Box>
        )}
        
        <Grid container spacing={2} alignItems="center">
          {/* 검색 필드 */}
          <Grid item xs={12} sm={3} md={2}>
            <TextField
              fullWidth
              placeholder="이메일, 닉네임, 실명, 전화번호 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          {/* 상태 필터 */}
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>상태</InputLabel>
              <Select
                value={status}
                onChange={handleStatusChange}
                label="상태"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">모든 상태</MenuItem>
                <MenuItem value="ACTIVE">활성</MenuItem>
                <MenuItem value="DEACTIVATED">비활성</MenuItem>
                <MenuItem value="DELETED">삭제됨</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* 역할 필터 */}
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>역할</InputLabel>
              <Select
                value={role}
                onChange={handleRoleChange}
                label="역할"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">모든 역할</MenuItem>
                <MenuItem value="USER">일반 사용자</MenuItem>
                <MenuItem value="ADMIN">관리자</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* 검색버튼 */}
          <Grid item xs={12} sm={2} md={1}>
            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              sx={{ height: '56px' }}
            >
              검색
            </Button>
          </Grid>
          
          {/* 액션 버튼들 */}
          <Grid item xs={12} sm={12} md={2}>
            <Stack direction="row" spacing={1}>
              <AnimateButton>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                >
                  새로고침
                </Button>
              </AnimateButton>
              <AnimateButton>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={handleResetFilters}
                >
                  초기화
                </Button>
              </AnimateButton>
            </Stack>
          </Grid>
        </Grid>
      </MainCard>

      {/* 사용자 테이블 */}
      <MainCard>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="60" align="center">번호</TableCell>
                <TableCell>사용자</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>역할</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>가입일</TableCell>
                <TableCell align="center">액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
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
                        <SearchIcon size={32} style={{ color: 'rgba(0, 0, 0, 0.6)' }} />
                      </Box>
                      <Typography variant="h6" color="text.secondary">
                        {(activeSearchTerm || activeStatus || activeRole)
                          ? '해당하는 사용자 정보가 없습니다'
                          : '등록된 사용자가 없습니다'}
                      </Typography>
                      {(activeSearchTerm || activeStatus || activeRole) && (
                        <Typography variant="body2" color="text.disabled">
                          검색 조건을 변경하거나 필터를 초기화해보세요
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow key={user.id} hover>
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
                        onClick={() => handleViewUser(user)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.7
                          }
                        }}
                      >
                        <ExtendedAvatar
                          alt={user.realname || user.nickname}
                          color="primary"
                          size="sm"
                        >
                          <PersonIcon />
                        </ExtendedAvatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="600">
                            {user.realname || user.nickname}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            @{user.nickname}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(user.status)}
                        color={getStatusColor(user.status)}
                        size="small"
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="상세보기">
                          <IconButton
                            size="small"
                            onClick={() => handleViewUser(user)}
                            color="primary"
                          >
                            <VisibilityIcon size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip 
                          title={
                            currentAdmin && currentAdmin.email === user.email
                              ? '본인 계정은 비활성화할 수 없습니다'
                              : user.status === 'ACTIVE' ? '비활성화' : '활성화'
                          }
                          disableHoverListener={
                            updateUserStatusMutation.isPending ||
                            (currentAdmin && currentAdmin.email === user.email)
                          }
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(user)}
                            color={user.status === 'ACTIVE' ? 'warning' : 'success'}
                            disabled={
                              updateUserStatusMutation.isPending ||
                              (currentAdmin && currentAdmin.email === user.email)
                            }
                          >
                            {user.status === 'ACTIVE' ? (
                              <BlockIcon size={20} />
                            ) : (
                              <CheckIcon size={20} />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteUser(user)}
                            color="error"
                          >
                            <DeleteIcon size={20} />
                          </IconButton>
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

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>사용자 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 <strong>{userToDelete?.realname || userToDelete?.nickname}</strong> 사용자를 삭제하시겠습니까?
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
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? <CircularProgress size={20} /> : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagePage;
