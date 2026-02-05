import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { adminFAQApi } from '../../lib/api/admin';
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
  MdCategory as CategoryIcon,
} from 'react-icons/md';
import CategoryModal from './CategoryModal';

const FAQListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 페이지네이션 상태
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '0', 10));
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 검색 및 필터 상태
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  
  // 삭제 다이얼로그 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);

  // FAQ 목록 조회
  const {
    data: faqsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-faqs', page, rowsPerPage, searchText, selectedCategory],
    queryFn: () => {
      const params = {
        page: page + 1,
        limit: rowsPerPage
      };
      if (searchText) {
        params.search = searchText;
      }
      if (selectedCategory) {
        params.category_id = selectedCategory;
      }
      return adminFAQApi.getFaqs(params);
    },
  });

  // 카테고리 목록 조회
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-faq-categories'],
    queryFn: () => adminFAQApi.getCategories(),
  });

  const faqs = faqsData?.items || [];
  const total = faqsData?.total || 0;

  // URL 파라미터 업데이트
  const updateURL = (params) => {
    const newParams = new URLSearchParams();
    if (params.search !== undefined) {
      if (params.search) newParams.set('search', params.search);
    } else if (searchText) {
      newParams.set('search', searchText);
    }
    if (params.category_id !== undefined) {
      if (params.category_id) newParams.set('category_id', params.category_id);
    } else if (selectedCategory) {
      newParams.set('category_id', selectedCategory);
    }
    if (params.page !== undefined && params.page > 0) {
      newParams.set('page', String(params.page));
    } else if (page > 0) {
      newParams.set('page', String(page));
    }
    setSearchParams(newParams, { replace: true });
  };

  // 페이지 변경 핸들러
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    updateURL({ page: newPage });
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    updateURL({ page: 0 });
  };

  // 검색 핸들러
  const handleSearch = () => {
    setPage(0);
    updateURL({ search: searchText, category_id: selectedCategory, page: 0 });
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchText('');
    setSelectedCategory('');
    setPage(0);
    updateURL({ search: '', category_id: '', page: 0 });
  };

  // 삭제 핸들러
  const handleDelete = (faq) => {
    setSelectedFaq(faq);
    setDeleteDialogOpen(true);
  };

  // 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (faqId) => adminFAQApi.deleteFaq(faqId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-faqs']);
      setDeleteDialogOpen(false);
      setSelectedFaq(null);
    },
  });

  const handleConfirmDelete = () => {
    if (selectedFaq) {
      deleteMutation.mutate(selectedFaq.id);
    }
  };

  // 상태 토글 mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (faqId) => adminFAQApi.toggleActive(faqId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-faqs']);
    },
  });

  const handleToggleActive = (faqId) => {
    toggleActiveMutation.mutate(faqId);
  };

  // 날짜 포맷팅
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  };

  // 새로고침
  const handleRefresh = () => {
    queryClient.invalidateQueries(['admin-faqs']);
    queryClient.invalidateQueries(['admin-faq-categories']);
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
        FAQ 목록을 불러오는데 실패했습니다.
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
              FAQ 관리
            </Typography>
            <Typography variant="body1" color="textSecondary">
              자주 묻는 질문 관리
              {total > 0 && (
                <span> (총 {total.toLocaleString()}개)</span>
              )}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <AnimateButton>
              <Button
                variant="outlined"
                startIcon={<CategoryIcon />}
                onClick={() => setCategoryModalOpen(true)}
                size="large"
              >
                카테고리 관리
              </Button>
            </AnimateButton>
            <AnimateButton>
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={() => navigate('/faq/new')}
                size="large"
              >
                FAQ 등록
              </Button>
            </AnimateButton>
          </Stack>
        </Stack>
      </MainCard>

      {/* 검색 및 필터 */}
      <MainCard sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="질문, 답변 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
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
          <Grid item xs={12} sm={6} md={5}>
            <FormControl fullWidth>
              <InputLabel>카테고리</InputLabel>
              <Select
                value={selectedCategory}
                label="카테고리"
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={{ minWidth: 250 }}
              >
                <MenuItem value="">전체 카테고리</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={String(cat.id)}>
                    {cat.title ?? cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Stack direction="row" spacing={1}>
              <AnimateButton>
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                >
                  검색
                </Button>
              </AnimateButton>
              <AnimateButton>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                >
                  새로고침
                </Button>
              </AnimateButton>
              {(searchText || selectedCategory) && (
                <AnimateButton>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={handleResetFilters}
                  >
                    초기화
                  </Button>
                </AnimateButton>
              )}
            </Stack>
          </Grid>
        </Grid>
      </MainCard>

      {/* FAQ 테이블 */}
      <MainCard>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>번호</TableCell>
                <TableCell>카테고리</TableCell>
                <TableCell>질문</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>생성일</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {faqs.length === 0 ? (
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
                        <SearchIcon size={32} style={{ color: 'rgba(0, 0, 0, 0.6)' }} />
                      </Box>
                      <Typography variant="h6" color="text.secondary">
                        {(searchText || selectedCategory)
                          ? '해당하는 FAQ가 없습니다'
                          : '등록된 FAQ가 없습니다'}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                faqs.map((faq, idx) => (
                  <TableRow key={faq.id} hover>
                    <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell>
                      {(faq.category_title ?? faq.category_name) ? (
                        <Chip
                          label={faq.category_title ?? faq.category_name}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          maxWidth: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/faq/${faq.id}`)}
                      >
                        {faq.question}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={faq.is_active ? '공개' : '비공개'}
                        size="small"
                        color={faq.is_active ? 'success' : 'default'}
                        variant="filled"
                        onClick={() => handleToggleActive(faq.id)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(faq.created_at)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="상세보기">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/faq/${faq.id}`)}
                            color="primary"
                          >
                            <Eye size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="수정">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/faq/${faq.id}/edit`)}
                            color="primary"
                          >
                            <Edit size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(faq)}
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
        <DialogTitle>FAQ 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 "{selectedFaq?.question}" FAQ를 삭제하시겠습니까?
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

      {/* 카테고리 관리 모달 */}
      {categoryModalOpen && (
        <CategoryModal
          open={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          onCategoryChanged={() => {
            queryClient.invalidateQueries(['admin-faq-categories']);
            queryClient.invalidateQueries(['admin-faqs']);
          }}
        />
      )}
    </Box>
  );
};

export default FAQListPage;

