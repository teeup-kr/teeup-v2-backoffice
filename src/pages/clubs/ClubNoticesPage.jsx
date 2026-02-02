import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import { clubsApi } from '../../lib/api/clubs';
import { useSnackbar } from '../../contexts/SnackbarContext';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import { MdArrowBack as ArrowLeft, MdAdd as Plus, MdEdit as Edit, MdDelete as Delete, MdVisibility as Eye } from 'react-icons/md';

const ClubNoticesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);

  const { data: club, isLoading: clubLoading } = useQuery({
    queryKey: ['admin-club', id],
    queryFn: () => clubsApi.getClub(id),
    enabled: !!id,
  });

  const { data: noticesData, isLoading: noticesLoading } = useQuery({
    queryKey: ['admin-club-notices', id, page, rowsPerPage],
    queryFn: () => clubsApi.getClubNotices(id, { page: page + 1, limit: rowsPerPage }),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => clubsApi.deleteClubNotice(id, noticeToDelete.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-notices', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-club', id] });
      setDeleteDialogOpen(false);
      setNoticeToDelete(null);
      showSnackbar('공지사항이 삭제되었습니다.', 'success');
    },
    onError: (err) => {
      showSnackbar(err.response?.data?.detail || '삭제에 실패했습니다.', 'error');
    },
  });

  const notices = noticesData?.data || [];
  const total = noticesData?.total || 0;

  if (clubLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate(`/clubs/${id}`)} size="small">
            <ArrowLeft />
          </IconButton>
          <Box>
            <Typography variant="h4">
              {club?.name} 공지사항
            </Typography>
            <Typography variant="body2" color="text.secondary">
              클럽 공지사항 관리
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => navigate(`/clubs/${id}/notices/create`)}
        >
          공지 추가
        </Button>
      </Stack>

      <MainCard>
        {noticesLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : notices.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography color="text.secondary">등록된 공지사항이 없습니다.</Typography>
            <Button
              variant="outlined"
              startIcon={<Plus />}
              onClick={() => navigate(`/clubs/${id}/notices/create`)}
              sx={{ mt: 2 }}
            >
              첫 공지 작성
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>제목</TableCell>
                    <TableCell width="100">중요</TableCell>
                    <TableCell width="100">비공개</TableCell>
                    <TableCell width="120">작성자</TableCell>
                    <TableCell width="100">조회수</TableCell>
                    <TableCell width="100">등록일</TableCell>
                    <TableCell width="120" align="right">액션</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notices.map((n) => (
                    <TableRow key={n.id} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                          onClick={() => navigate(`/clubs/${id}/notices/${n.id}/edit`)}
                        >
                          {(n.is_important ? '📌 ' : '') + n.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {n.is_important ? <Chip label="중요" color="error" size="small" /> : '-'}
                      </TableCell>
                      <TableCell>
                        {n.is_private ? <Chip label="비공개" size="small" /> : '-'}
                      </TableCell>
                      <TableCell>{n.author_name || '-'}</TableCell>
                      <TableCell>{n.view_count ?? 0}</TableCell>
                      <TableCell>
                        {n.created_at ? new Date(n.created_at).toLocaleDateString('ko-KR') : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="수정">
                          <IconButton size="small" onClick={() => navigate(`/clubs/${id}/notices/${n.id}/edit`)}>
                            <Edit size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setNoticeToDelete(n);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Delete size={18} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
      </MainCard>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="공지사항 삭제"
        content={
          noticeToDelete ? (
            <>정말로 &quot;{noticeToDelete.title}&quot; 공지사항을 삭제하시겠습니까?</>
          ) : null
        }
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setNoticeToDelete(null);
        }}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default ClubNoticesPage;
