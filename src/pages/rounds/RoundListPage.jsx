import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
  Divider,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import { MdVisibility as ViewIcon, MdEdit as EditIcon, MdDelete as DeleteIcon, MdAdd as AddIcon, MdFilterList as FilterIcon, MdSearch as SearchIcon, MdRefresh as RefreshIcon, MdNote as NoteIcon } from 'react-icons/md';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { adminRoundsApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';

const RoundListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roundToDelete, setRoundToDelete] = useState(null);

  // 라운딩 목록 조회
  const { data: roundsData, isLoading, error: queryError } = useQuery({
    queryKey: ['admin-rounds', page, rowsPerPage, statusFilter, searchTerm],
    queryFn: () => adminRoundsApi.getRounds({
      page: page + 1,
      limit: rowsPerPage,
      status: statusFilter || undefined,
      search: searchTerm || undefined
    }),
    keepPreviousData: true
  });

  const rounds = Array.isArray(roundsData?.data) ? roundsData.data : [];
  const totalCount = roundsData?.total || 0;

  // 라운딩 삭제 뮤테이션
  const deleteRoundMutation = useMutation({
    mutationFn: (roundId) => adminRoundsApi.deleteRound(roundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rounds'] });
      setDeleteDialogOpen(false);
      setRoundToDelete(null);
      showSnackbar('라운딩이 삭제되었습니다.', 'success');
    },
    onError: (error) => {
      const message = error.response?.data?.detail || error.response?.data?.message || '라운딩 삭제에 실패했습니다.';
      showSnackbar(message, 'error');
    },
  });

  const handleOpenDeleteDialog = (round) => {
    setRoundToDelete(round);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (roundToDelete) {
      deleteRoundMutation.mutate(roundToDelete.id);
    }
  };

  // 상태별 색상 매핑
  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return 'info';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELED':
        return 'error';
      default:
        return 'default';
    }
  };

  // 상태별 표시
  const getStatusLabel = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return '예정';
      case 'IN_PROGRESS':
        return '진행중';
      case 'COMPLETED':
        return '완료';
      case 'CANCELED':
        return '취소';
      default:
        return status || '알 수 없음';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    try {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd HH:mm', { locale: ko });
    } catch (err) {
      return dateString;
    }
  };

  // 모임 상세보기
  const handleViewRound = (roundId) => {
    navigate(`/rounds/${roundId}`);
  };

  // 메모 모달 열기
  const handleOpenMemo = (memo) => {
    setSelectedMemo(memo || '메모가 없습니다.');
    setMemoDialogOpen(true);
  };

  // 메모 모달 닫기
  const handleCloseMemo = () => {
    setMemoDialogOpen(false);
    setSelectedMemo('');
  };

  // 페이지 변경
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 페이지당 행수 변경
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 검색
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setStatusFilter('');
    setSearchTerm('');
    setPage(0);
  };

  // 새로고침
  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (queryError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        라운딩 목록을 불러오는데 실패했습니다.
      </Alert>
    );
  }

  return (
    <Box>
      {/* 헤더 */}
      <MainCard sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              라운딩 관리
            </Typography>
            <Typography variant="body1" color="textSecondary">
              라운딩 모임 목록 및 관리
            </Typography>
          </Box>
          <AnimateButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/rounds/create')}
            >
              라운딩 생성
            </Button>
          </AnimateButton>
        </Stack>
      </MainCard>

      {/* 검색 및 필터 */}
      <MainCard sx={{ mb: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <FilterIcon style={{ color: '#1976d2' }} />
            <Typography variant="h6">검색 및 필터</Typography>
          </Stack>
          <Divider />
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="모임명이나 설명으로 검색..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={5} md={4}>
              <FormControl fullWidth sx={{ minWidth: 200 }}>
                <InputLabel>상태</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  label="상태"
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="">모든 상태</MenuItem>
                  <MenuItem value="SCHEDULED">예정</MenuItem>
                  <MenuItem value="IN_PROGRESS">진행중</MenuItem>
                  <MenuItem value="COMPLETED">완료</MenuItem>
                  <MenuItem value="CANCELED">취소</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
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
            <Grid item xs={12} sm={6} md={2}>
              <AnimateButton>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={handleResetFilters}
                  fullWidth
                >
                  필터 초기화
                </Button>
              </AnimateButton>
            </Grid>
          </Grid>
        </Stack>
      </MainCard>

      {/* 라운딩 테이블 */}
      <MainCard>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">라운딩 목록</Typography>
          </Stack>
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>번호</TableCell>
                  <TableCell>모임명</TableCell>
                  <TableCell>클럽명</TableCell>
                  <TableCell>개설자명</TableCell>
                  <TableCell>모임일시</TableCell>
                  <TableCell>참가자수</TableCell>
                  <TableCell align="center">메모</TableCell>
                  <TableCell align="center">액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rounds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                        라운딩 모임이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rounds.map((round, index) => (
                    <TableRow key={round.id} hover>
                      <TableCell>
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          fontWeight="600"
                          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={() => handleViewRound(round.id)}
                        >
                          {round.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {round.club_name || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {round.creator?.realname || round.creator?.nickname || round.organizer?.realname || round.organizer?.nickname || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(round.meeting_time)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {round.participant_count || 0}/{round.max_participants || '-'}명
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="메모 보기">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenMemo(round.description || round.additional_info)}
                          >
                            <NoteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="상세보기">
                            <IconButton size="small" onClick={() => handleViewRound(round.id)}>
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="수정">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/rounds/${round.id}/edit`)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="삭제">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDeleteDialog(round)}
                            >
                              <DeleteIcon />
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

          {/* 페이지네이션 */}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="페이지당 행수"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
            }
            showFirstButton
            showLastButton
          />
        </Stack>
      </MainCard>

      {/* 메모 모달 */}
      <Dialog open={memoDialogOpen} onClose={handleCloseMemo} maxWidth="sm" fullWidth>
        <DialogTitle>메모</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {selectedMemo}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMemo}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>라운딩 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 라운딩 &quot;{roundToDelete?.name}&quot;을(를) 삭제하시겠습니까?<br />
            삭제된 라운딩은 복구할 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteRoundMutation.isPending}
          >
            {deleteRoundMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoundListPage;

