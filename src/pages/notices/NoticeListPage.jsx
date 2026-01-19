import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
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
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Grid,
  InputAdornment,
} from '@mui/material';
import { adminNoticesApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import { 
  MdAdd as Plus, 
  MdSearch as SearchIcon, 
  MdVisibility as Eye, 
  MdEdit as Edit, 
  MdDelete as Trash2,
  MdRefresh as RefreshIcon,
  MdFilterList as FilterIcon,
} from 'react-icons/md';

const NoticeListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 필터 상태 (UI용)
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [publishedFilter, setPublishedFilter] = useState('ALL');
  
  // 실제 검색에 사용되는 상태 (검색버튼 클릭 시에만 업데이트)
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState('ALL');
  const [activePublishedFilter, setActivePublishedFilter] = useState('ALL');
  
  // 다이얼로그 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  // 공지사항 목록 조회
  const {
    data: noticesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-notices', page, rowsPerPage, activeSearchTerm, activeTypeFilter, activePublishedFilter],
    queryFn: () => {
      const params = {
        page: page + 1,
        size: rowsPerPage
      };
      if (activeTypeFilter !== 'ALL') {
        params.type = activeTypeFilter;
      }
      if (activePublishedFilter !== 'ALL') {
        params.is_published = activePublishedFilter === 'PUBLISHED';
      }
      if (activeSearchTerm) {
        params.search = activeSearchTerm;
      }
      return adminNoticesApi.getNotices(params);
    },
    staleTime: 0,
    cacheTime: 0
  });

  // 컴포넌트 마운트 시 기존 캐시 무효화
  React.useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
  }, []);

  // 공지사항 삭제
  const deleteMutation = useMutation({
    mutationFn: (id) => adminNoticesApi.deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
      setDeleteDialogOpen(false);
      setSelectedNotice(null);
    }
  });

  const notices = Array.isArray(noticesData?.notices) ? noticesData.notices : [];
  const total = noticesData?.total || 0;

  // 카테고리 한글 변환
  const getCategoryName = (type) => {
    const categoryMap = {
      'GENERAL': '일반',
      'SYSTEM': '시스템',
      'EVENT': '이벤트',
      'MAINTENANCE': '점검'
    };
    return categoryMap[type] || type || '알 수 없음';
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleDelete = (notice) => {
    setSelectedNotice(notice);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedNotice) {
      deleteMutation.mutate(selectedNotice.id);
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
    setActiveTypeFilter(typeFilter);
    setActivePublishedFilter(publishedFilter);
    setPage(0);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
  };

  const handlePublishedFilterChange = (e) => {
    setPublishedFilter(e.target.value);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setPublishedFilter('ALL');
    setActiveSearchTerm('');
    setActiveTypeFilter('ALL');
    setActivePublishedFilter('ALL');
    setPage(0);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
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
        공지사항 목록을 불러오는데 실패했습니다.
      </Alert>
    );
  }

  return (
    <Box>
      {/* 헤더 */}
      <MainCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              공지사항 관리
            </Typography>
            <Typography variant="body1" color="textSecondary">
              공지사항 목록 및 관리
              {total > 0 && (
                <span> (총{total.toLocaleString()}개)</span>
              )}
            </Typography>
          </Box>
          <AnimateButton>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={() => navigate('/notices/create')}
              size="large"
            >
              공지사항 등록
            </Button>
          </AnimateButton>
        </Stack>
      </MainCard>

      {/* 검색 및 필터 */}
      <MainCard sx={{ mb: 3 }}>
        {/* 적용된 필터 표시 */}
        {(activeSearchTerm || activeTypeFilter !== 'ALL' || activePublishedFilter !== 'ALL') && (
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
                    queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
                  }}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
              {activeTypeFilter !== 'ALL' && (
                <Chip
                  label={`카테고리: ${getCategoryName(activeTypeFilter)}`}
                  onDelete={() => {
                    setTypeFilter('ALL');
                    setActiveTypeFilter('ALL');
                    setPage(0);
                    queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
                  }}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              )}
              {activePublishedFilter !== 'ALL' && (
                <Chip
                  label={`발행 여부: ${activePublishedFilter === 'PUBLISHED' ? '발행됨' : '미발행'}`}
                  onDelete={() => {
                    setPublishedFilter('ALL');
                    setActivePublishedFilter('ALL');
                    setPage(0);
                    queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
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
              placeholder="제목 검색"
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
          
          {/* 카테고리 필터 */}
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>카테고리</InputLabel>
              <Select
                value={typeFilter}
                onChange={handleTypeFilterChange}
                label="카테고리"
                sx={{ minWidth: 200 }}
              >
                      <MenuItem value="ALL">전체</MenuItem>
                      <MenuItem value="GENERAL">일반</MenuItem>
                      <MenuItem value="SYSTEM">시스템</MenuItem>
                      <MenuItem value="EVENT">이벤트</MenuItem>
                      <MenuItem value="MAINTENANCE">점검</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* 발행 여부 필터 */}
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>발행 여부</InputLabel>
              <Select
                value={publishedFilter}
                onChange={handlePublishedFilterChange}
                label="발행 여부"
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="ALL">전체</MenuItem>
                <MenuItem value="PUBLISHED">발행됨</MenuItem>
                <MenuItem value="UNPUBLISHED">미발행</MenuItem>
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

      {/* 공지사항 테이블 */}
      <MainCard>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>카테고리</TableCell>
                <TableCell>제목</TableCell>
                <TableCell>작성자</TableCell>
                <TableCell>등록일</TableCell>
                <TableCell>발행여부</TableCell>
                <TableCell>조회수</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notices.length === 0 ? (
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
                        {(activeSearchTerm || activeTypeFilter !== 'ALL' || activePublishedFilter !== 'ALL')
                          ? '해당하는 공지사항이 없습니다'
                          : '등록된 공지사항이 없습니다'}
                      </Typography>
                      {(activeSearchTerm || activeTypeFilter !== 'ALL' || activePublishedFilter !== 'ALL') && (
                        <Typography variant="body2" color="text.disabled">
                          검색 조건을 변경하거나 필터를 초기화해보세요
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                notices.map((notice) => (
                  <TableRow key={notice.id} hover>
                    <TableCell>
                      <Chip
                        label={getCategoryName(notice.type)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {notice.is_important && (
                          <Chip
                            label="중요"
                            size="small"
                            color="error"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {notice.title}
                      </Typography>
                    </TableCell>
                    <TableCell>관리자</TableCell>
                    <TableCell>{formatDate(notice.published_at || notice.created_at)}</TableCell>
                    <TableCell>
                      <Chip
                        label={notice.is_published ? '발행됨' : '미발행'}
                        size="small"
                        color={notice.is_published ? 'success' : 'default'}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>{notice.view_count || 0}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="상세보기">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/notices/${notice.id}`)}
                            color="primary"
                          >
                            <Eye size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="수정">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/notices/${notice.id}/edit`)}
                            color="primary"
                          >
                            <Edit size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(notice)}
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
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
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
        <DialogTitle>공지사항 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 "{selectedNotice?.title}" 공지사항을 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} /> : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NoticeListPage;
