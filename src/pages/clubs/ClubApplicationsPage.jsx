import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Divider,
  IconButton,
  Tooltip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { clubsApi } from '../../lib/api/clubs.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';
import { MdArrowBack as ArrowLeft, MdVisibility, MdCheckCircle, MdCancel, MdGroup as GroupIcon, MdPerson as PersonIcon, MdSearch as SearchIcon, MdFilterList as FilterIcon, MdRefresh as RefreshIcon, MdAssignment as AssignmentIcon } from 'react-icons/md';

const ClubApplicationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [clubFilter, setClubFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { showSnackbar } = useSnackbar();
  
  // 거부 모달 상태
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 클럽 신청 목록 조회
  const {
    data: applications,
    isLoading: applicationsLoading,
    error: applicationsError
  } = useQuery({
    queryKey: ['admin-club-applications', page, statusFilter, search],
    queryFn: () => clubsApi.getClubApplications({
      page,
      status_filter: statusFilter,
      search: search?.trim() ? search.trim() : undefined,
    }),
  });

  // 클럽 목록 조회 제거: 현재 화면에서는 미사용

  // 신청 승인/거부 mutation
  const updateApplicationMutation = useMutation({
    mutationFn: ({ applicationId, action, reason }) => 
      clubsApi.approveClubApplication(applicationId, { action, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-applications'] });
      showSnackbar(`${variables.action === 'approve' ? '승인' : '거절'} 처리되었습니다.`, 'success');
    },
    onError: (error) => {
      console.error('클럽 신청 처리 실패:', error);
      showSnackbar('처리 중 오류가 발생했습니다.', 'error');
    }
  });

  const handleApplicationAction = (applicationId, action, reason = '') => {
    if (action === 'reject') {
      // 거부는 모달 열기
      setSelectedApplicationId(applicationId);
      setRejectionReason('');
      setRejectDialogOpen(true);
    } else {
      // 승인은 바로 처리
      updateApplicationMutation.mutate({ applicationId, action, reason });
    }
  };

  // 거부 확인
  const handleConfirmReject = () => {
    if (selectedApplicationId && rejectionReason.trim()) {
      updateApplicationMutation.mutate({ 
        applicationId: selectedApplicationId, 
        action: 'reject', 
        reason: rejectionReason.trim() 
      });
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedApplicationId(null);
    }
  };

  // 거부 모달 닫기
  const handleRejectDialogClose = () => {
    setRejectDialogOpen(false);
    setRejectionReason('');
    setSelectedApplicationId(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'CANCELED': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return '대기중';
      case 'APPROVED': return '승인됨';
      case 'REJECTED': return '거절됨';
      case 'CANCELED': return '취소됨';
      default: return status || '알 수 없음';
    }
  };

  if (applicationsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (applicationsError) {
    return (
      <Box sx={{ py: 3, px: 0 }}>
        <Alert severity="error">
          클럽 신청 목록을 불러오는데 실패했습니다.
        </Alert>
        <Button
          onClick={() => navigate('/clubs')}
          sx={{ mt: 2 }}
        >
          클럽 목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* 헤더 */}
      <MainCard sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AnimateButton>
              <Button
                startIcon={<ArrowLeft />}
                onClick={() => navigate('/clubs')}
                variant="outlined"
              >
                돌아가기
              </Button>
            </AnimateButton>
            <Stack direction="row" alignItems="center" spacing={2}>
              <ExtendedAvatar color="primary" size="lg">
                <AssignmentIcon />
              </ExtendedAvatar>
              <Box>
                <Typography variant="h4" component="h1">
                  클럽 신청 관리
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  클럽 가입 신청을 승인/거부하세요
                </Typography>
              </Box>
            </Stack>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <AnimateButton>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
              >
                새로고침
              </Button>
            </AnimateButton>
          </Stack>
        </Stack>
      </MainCard>

      {/* 필터 */}
      <MainCard sx={{ mb: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <FilterIcon style={{ color: '#1976d2' }} />
            <Typography variant="h6">필터 및 검색</Typography>
          </Stack>
          <Divider />
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant={statusFilter === 'PENDING' ? 'contained' : 'outlined'}
                  onClick={() => { setPage(1); setStatusFilter('PENDING'); }}
                >
                  처리대기
                </Button>
                <Button
                  variant={statusFilter === 'COMPLETED' ? 'contained' : 'outlined'}
                  onClick={() => { setPage(1); setStatusFilter('COMPLETED'); }}
                >
                  처리완료
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder="클럽명 또는 신청자 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                총 {applications?.total || 0}건의 신청
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </MainCard>

      {/* 신청 목록 */}
      <MainCard>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <GroupIcon style={{ color: '#1976d2' }} />
            <Typography variant="h6">클럽 신청 목록</Typography>
          </Stack>
          <Divider />
          {applications?.data?.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                신청이 없습니다
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>클럽명</TableCell>
                      <TableCell>신청일</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell align="center">액션</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications?.data?.map((application) => (
                      <TableRow key={application.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography 
                              variant="body2" 
                              fontWeight="600"
                              sx={{
                                cursor: 'pointer',
                                color: 'primary.main',
                                '&:hover': {
                                  textDecoration: 'underline'
                                }
                              }}
                              onClick={() => navigate(`/clubs/applications/${application.id}`)}
                            >
                              {application.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(application.created_at).toLocaleDateString('ko-KR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(application.status)}
                            color={getStatusColor(application.status)}
                            size="small"
                            variant="filled"
                          />
                        </TableCell>
                        
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="상세보기">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/clubs/applications/${application.id}`)}
                                color="primary"
                              >
                                <MdVisibility size={20} />
                              </IconButton>
                            </Tooltip>
                            {application.status === 'PENDING' && (
                              <>
                                <Tooltip title="승인">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleApplicationAction(application.id, 'approve')}
                                    disabled={updateApplicationMutation.isPending}
                                  >
                                    <MdCheckCircle size={20} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="거절">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleApplicationAction(application.id, 'reject')}
                                    disabled={updateApplicationMutation.isPending}
                                  >
                                    <MdCancel size={20} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 페이지네이션 */}
              {applications?.total_pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={applications.total_pages}
                    page={page}
                    onChange={(event, value) => setPage(value)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </Stack>
      </MainCard>

      {/* 거부 사유 입력 다이얼로그 */}
      <Dialog 
        open={rejectDialogOpen} 
        onClose={handleRejectDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>클럽 신청 거부</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            클럽 신청을 거부하시겠습니까?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="거부 사유"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            variant="outlined"
            placeholder="거부 사유를 입력해주세요"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectDialogClose}>
            취소
          </Button>
          <Button
            onClick={handleConfirmReject}
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim() || updateApplicationMutation.isPending}
          >
            {updateApplicationMutation.isPending ? '거부 중...' : '거부'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClubApplicationsPage;
