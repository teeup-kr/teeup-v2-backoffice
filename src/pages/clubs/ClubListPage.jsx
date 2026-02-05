import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Box,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
  IconButton,
  Tooltip,
  Grid,
  Paper,
  TableContainer,
  TablePagination,
  InputAdornment,
  Divider
} from '@mui/material';
import { clubsApi } from '../../lib/api/clubs';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';
import { 
  MdAdd as Plus, 
  MdSearch as Search, 
  MdVisibility as Eye, 
  MdEdit as Edit, 
  MdDelete as Trash2, 
  MdClose as X,
  MdCheckCircle as CheckCircle,
  MdSchedule as Clock,
  MdCancel as XCircle,
  MdWarning as AlertCircle,
  MdFilterList as FilterIcon,
  MdRefresh as RefreshIcon,
  MdGroup as GroupIcon,
  MdLocationOn as LocationIcon
} from 'react-icons/md';

const ClubListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 검색어 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 클럽 목록 조회
  const {
    data: clubsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-clubs', currentPage, statusFilter, debouncedSearchTerm],
    queryFn: () => {
      console.log('Fetching clubs with params:', {
        page: currentPage,
        limit: 10,
        status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearchTerm || undefined
      });
      return clubsApi.getClubs({
        page: currentPage,
        limit: 10,
        status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearchTerm || undefined
      }).then(data => {
        console.log('Clubs response:', data);
        console.log('Clubs response structure:', {
          hasData: !!data.data,
          dataLength: data.data?.length,
          total: data.total,
          page: data.page,
          limit: data.limit,
          totalPages: data.total_pages
        });
        // 각 클럽의 멤버 수 확인
        if (Array.isArray(data.data) && data.data.length > 0) {
          console.log('Club member counts:', data.data.map(c => ({
            name: c.name,
            member_count: c.member_count,
            id: c.id
          })));
        }
        return data;
      }).catch(error => {
        console.error('Clubs API error:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        throw error;
      });
    },
    keepPreviousData: true
  });

  // 클럽 승인 뮤테이션
  const approveClubMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/admin/clubs/${id}/approve`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      setSelectedClub(null);
    },
  });

  // 클럽 거부 뮤테이션
  const rejectClubMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const response = await fetch(`/api/admin/clubs/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      setRejectDialogOpen(false);
      setSelectedClub(null);
      setRejectionReason('');
    },
  });

  // 클럽 삭제 뮤테이션
  const deleteClubMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/admin/clubs/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      setDeleteDialogOpen(false);
      setSelectedClub(null);
    },
  });

  // 상태별 색상 매핑
  const getStatusColor = (status, deletedAt) => {
    // deleted_at이 있으면 삭제됨으로 표시
    if (deletedAt) {
      return 'default';
    }
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      case 'INACTIVE':
        return 'warning';
      case 'CANCELED':
        return 'default';
      default:
        return 'default';
    }
  };

  // 상태별 텍스트 표시
  const getStatusLabel = (status, deletedAt) => {
    // deleted_at이 있으면 무조건 삭제됨 반환
    if (deletedAt) {
      return '삭제됨';
    }
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return '활성';
      case 'PENDING':
        return '대기중';
      case 'REJECTED':
        return '거부됨';
      case 'INACTIVE':
        return '비공개';
      case 'CANCELED':
        return '취소됨';
      default:
        return status || '알 수 없음';
    }
  };

  // 클럽 타입 한글 변환
  const getTypeLabel = (type) => {
    switch (type) {
      case 'REGULAR':
        return '정기';
      case 'IRREGULAR':
        return '비정기';
      default:
        return type || '알 수 없음';
    }
  };

  // 클럽 상세보기
  const handleViewClub = (club) => {
    navigate(`/clubs/${club.id}`);
  };

  // 클럽 수정
  const handleEditClub = (club) => {
    navigate(`/clubs/${club.id}/edit`);
  };

  // 클럽 승인
  const handleApproveClub = (club) => {
    setSelectedClub(club);
    approveClubMutation.mutate(club.id);
  };

  // 클럽 거부
  const handleRejectClub = (club) => {
    setSelectedClub(club);
    setRejectDialogOpen(true);
  };

  // 클럽 삭제
  const handleDeleteClub = (club) => {
    setSelectedClub(club);
    setDeleteDialogOpen(true);
  };

  // 거부 확인
  const handleConfirmReject = () => {
    if (selectedClub && rejectionReason.trim()) {
      rejectClubMutation.mutate({
        id: selectedClub.id,
        reason: rejectionReason
      });
    }
  };

  // 삭제 확인
  const handleConfirmDelete = () => {
    if (selectedClub) {
      deleteClubMutation.mutate(selectedClub.id);
    }
  };

  // 페이지 변경
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  // 새로고침
  const handleRefresh = () => {
    // 캐시 무효화 후 다시 조회
    queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
    refetch();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    console.error('ClubListPage error:', error);
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          클럽 목록을 불러오는데 실패했습니다.
          {error.response?.data?.message && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="error">
                에러 상세: {error.response.data.message}
              </Typography>
            </Box>
          )}
          {error.response?.status && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="error">
                상태 코드: {error.response.status}
              </Typography>
            </Box>
          )}
        </Alert>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Button variant="contained" onClick={() => refetch()}>
            다시 시도
          </Button>
        </Box>
      </Box>
    );
  }

  const clubs = Array.isArray(clubsData?.data) ? clubsData.data : [];
  const totalPages = clubsData?.total_pages || 0;

  return (
    <Box>
      {/* 헤더 */}
      <MainCard sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              클럽 관리
            </Typography>
            <Typography variant="body1" color="textSecondary">
              클럽 목록 및 승인 관리
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <AnimateButton>
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={() => navigate('/clubs/create')}
                size="large"
              >
                클럽 생성
              </Button>
            </AnimateButton>
          </Stack>
        </Stack>
      </MainCard>

      {/* 검색 및 필터 */}
      <MainCard sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="클럽명이나 설명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth>
                <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                  label="상태"
              >
                  <MenuItem value="ALL">모든 상태</MenuItem>
                  <MenuItem value="APPROVED">승인됨</MenuItem>
                  <MenuItem value="PENDING">대기중</MenuItem>
                  <MenuItem value="REJECTED">거부됨</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <AnimateButton>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                fullWidth
              >
                새로고침
              </Button>
            </AnimateButton>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <AnimateButton>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setStatusFilter('ALL');
                  setSearchTerm('');
                }}
                fullWidth
              >
                필터 초기화
              </Button>
            </AnimateButton>
          </Grid>
        </Grid>
      </MainCard>

      {/* 클럽 테이블 */}
      <MainCard>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>클럽</TableCell>
                <TableCell>설명</TableCell>
                <TableCell>리더</TableCell>
                <TableCell>멤버 수</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>생성일</TableCell>
                <TableCell align="center">액션</TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {clubs.length === 0 ? (
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
                      <GroupIcon size={32} style={{ color: 'rgba(0, 0, 0, 0.6)' }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary">
                      {(debouncedSearchTerm || statusFilter !== 'ALL')
                        ? '해당하는 클럽이 없습니다'
                        : '등록된 클럽이 없습니다'}
                    </Typography>
                    {(debouncedSearchTerm || statusFilter !== 'ALL') && (
                      <Typography variant="body2" color="text.disabled">
                        검색 조건을 변경하거나 필터를 초기화해보세요
                      </Typography>
                    )}
                    {!debouncedSearchTerm && statusFilter === 'ALL' && (
                      <Button
                        variant="contained"
                        startIcon={<Plus />}
                        onClick={() => navigate('/clubs/create')}
                        sx={{ mt: 2 }}
                      >
                        첫 번째 클럽 생성하기
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              clubs.map((club) => (
              <TableRow key={club.id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ExtendedAvatar
                      alt={club.name}
                      src={club.logo_url}
                      color="primary"
                      size="sm"
                    >
                      <GroupIcon />
                    </ExtendedAvatar>
                    <Box>
                      <Typography 
                        variant="subtitle2" 
                        fontWeight="600"
                        onClick={() => handleViewClub(club)}
                        sx={{
                          cursor: 'pointer',
                          color: 'primary.main',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {club.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {getTypeLabel(club.type)}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {club.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {club.leader_name || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="primary.main" fontWeight="600">
                    {club.member_count || 0}명
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(club.status, club.deleted_at)}
                    color={getStatusColor(club.status, club.deleted_at)}
                    size="small"
                    variant="filled"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(club.created_at).toLocaleDateString('ko-KR')}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="상세보기">
                      <IconButton
                        size="small"
                        onClick={() => handleViewClub(club)}
                        color="primary"
                      >
                        <Eye size={20} />
                      </IconButton>
                    </Tooltip>
                            <Tooltip title="수정">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClub(club)}
                        color="info"
                      >
                        <Edit size={20} />
                      </IconButton>
                    </Tooltip>
                    {club.status === 'PENDING' && (
                      <>
                                <Tooltip title="승인">
                          <IconButton
                            size="small"
                            onClick={() => handleApproveClub(club)}
                            color="success"
                          >
                            <CheckCircle size={20} />
                          </IconButton>
                        </Tooltip>
                                <Tooltip title="거부">
                          <IconButton
                            size="small"
                            onClick={() => handleRejectClub(club)}
                            color="error"
                          >
                            <XCircle size={20} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                            <Tooltip title="삭제">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClub(club)}
                        color="error"
                      >
                        <Trash2 size={20} />
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
        <Divider />
        <Box sx={{ p: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage + 1}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      </MainCard>

      {/* 거부 확인 다이얼로그 */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>클럽 거부</DialogTitle>
        <DialogContent>
          <DialogContentText>
            클럽 "{selectedClub?.name}"을 거부하시겠습니까?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="거부 사유"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleConfirmReject}
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim() || rejectClubMutation.isPending}
          >
            {rejectClubMutation.isPending ? '거부 중...' : '거부'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>클럽 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 클럽 "{selectedClub?.name}"을 삭제하시겠습니까?<br />
            삭제된 클럽은 복구할 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteClubMutation.isPending}
          >
            {deleteClubMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClubListPage;
