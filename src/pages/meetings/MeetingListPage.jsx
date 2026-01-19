import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
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
  TablePagination,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
  Divider,
  InputAdornment
} from '@mui/material';
import { MdAdd as AddIcon, MdEdit as EditIcon, MdDelete as DeleteIcon, MdVisibility as ViewIcon, MdSchedule as ScheduleIcon, MdPeople as PeopleIcon, MdLocationOn as LocationIcon, MdFilterList as FilterIcon, MdSearch as SearchIcon, MdRefresh as RefreshIcon, MdGolfCourse as GolfIcon, MdEvent as EventIcon } from 'react-icons/md';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { meetingsApi } from '../../lib/api/meetings';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';

const MeetingListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // 모임 목록 조회
  const { data: meetingsData, isLoading, error: queryError } = useQuery({
    queryKey: ['admin-meetings', page, rowsPerPage, statusFilter, typeFilter, searchTerm],
    queryFn: () => adminApi.getMeetings({
      page: page + 1,
      limit: rowsPerPage,
      status: statusFilter || undefined,
      meeting_type: typeFilter || undefined,
      search: searchTerm || undefined
    }),
    keepPreviousData: true
  });

  // 모임 삭제 뮤테이션
  const deleteMeetingMutation = useMutation({
    mutationFn: adminApi.deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
      setDeleteDialogOpen(false);
      setSelectedMeeting(null);
    },
  });

  useEffect(() => {
    if (meetingsData) {
      setMeetings(meetingsData.data || []);
      setTotalCount(meetingsData.total_count || 0);
      setLoading(false);
    }
  }, [meetingsData]);

  useEffect(() => {
    if (queryError) {
      setError('모임 목록을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  }, [queryError]);

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

  // 모임 유형별 색상 매핑
  const getTypeColor = (type) => {
    switch (type) {
      case 'ROUND':
        return 'primary';
      case 'SOCIAL':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // 모임 유형별 텍스트 표시
  const getTypeLabel = (type) => {
    switch (type) {
      case 'ROUND':
        return '라운딩';
      case 'SOCIAL':
        return '소셜';
      default:
        return type || '알 수 없음';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd HH:mm', { locale: ko });
    } catch (err) {
      return dateString;
    }
  };

  // 모임 상세보기
  const handleViewMeeting = (meeting) => {
    navigate(`/meetings/${meeting.id}`);
  };

  // 모임 수정
  const handleEditMeeting = (meeting) => {
    navigate(`/meetings/${meeting.id}/edit`);
  };

  // 모임 삭제
  const handleDeleteMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setDeleteDialogOpen(true);
  };

  // 삭제 확인
  const handleConfirmDelete = () => {
    if (selectedMeeting) {
      deleteMeetingMutation.mutate(selectedMeeting.id);
    }
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
    setTypeFilter('');
    setSearchTerm('');
    setPage(0);
  };

  // 새로고침
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
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
              모임 관리
            </Typography>
            <Typography variant="body1" color="textSecondary">
              모임 목록 및 관리
            </Typography>
          </Box>
          <AnimateButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/meetings/create')}
            >
              모임 생성
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
            <Grid item xs={12} sm={3} md={2}>
              <FormControl fullWidth>
                <InputLabel>상태</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="상태"
                >
                  <MenuItem value="">모든 상태</MenuItem>
                  <MenuItem value="SCHEDULED">예정</MenuItem>
                  <MenuItem value="IN_PROGRESS">진행중</MenuItem>
                  <MenuItem value="COMPLETED">완료</MenuItem>
                  <MenuItem value="CANCELED">취소</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <FormControl fullWidth>
                <InputLabel>유형</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="유형"
                >
                  <MenuItem value="">모든 유형</MenuItem>
                  <MenuItem value="ROUND">라운딩</MenuItem>
                  <MenuItem value="SOCIAL">소셜</MenuItem>
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

      {/* 모임 테이블 */}
      <MainCard>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <ScheduleIcon style={{ color: '#1976d2' }} />
            <Typography variant="h6">모임 목록</Typography>
          </Stack>
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>모임명</TableCell>
                  <TableCell>제목</TableCell>
                  <TableCell>클럽</TableCell>
                  <TableCell>날짜</TableCell>
                  <TableCell>참가자</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell align="center">액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <ExtendedAvatar
                          alt={meeting.name}
                          color="primary"
                          size="sm"
                        >
                          {meeting.meeting_type === 'ROUND' ? <GolfIcon /> : <EventIcon />}
                        </ExtendedAvatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="600">
                            {meeting.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 200 }}>
                            {meeting.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTypeLabel(meeting.meeting_type)}
                        color={getTypeColor(meeting.meeting_type)}
                        size="small"
                        icon={meeting.meeting_type === 'ROUND' ? <GolfIcon /> : <EventIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {meeting.club_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(meeting.meeting_time)}
                      </Typography>
                      {meeting.location && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          <LocationIcon size={20} sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                          {meeting.location}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PeopleIcon size={20} />
                        <Typography variant="body2">
                          {meeting.participant_count}/{meeting.max_participants}명
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(meeting.status)}
                        color={getStatusColor(meeting.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="상세보기">
                          <IconButton
                            size="small"
                            onClick={() => handleViewMeeting(meeting)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="수정">
                          <IconButton
                            size="small"
                            onClick={() => handleEditMeeting(meeting)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMeeting(meeting)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>모임 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 모임 "{selectedMeeting?.name}"을 삭제하시겠습니까?<br />
            삭제된 모임은 복구할 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMeetingMutation.isPending}
          >
            {deleteMeetingMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingListPage;
