import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack
} from '@mui/material';
import { MdArrowBack as ArrowLeft, MdAdd as PlusIcon, MdEdit as EditIcon, MdDelete as DeleteIcon } from 'react-icons/md';
import { meetingsApi } from '../../lib/api/meetings';
import { adminSocialsApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import { useSnackbar } from '../../contexts/SnackbarContext';

const SocialExpenseManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({ description: '', amount: '', category: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: social, isLoading: socialLoading, error: socialError } = useQuery({
    queryKey: ['admin-social', id],
    queryFn: () => adminSocialsApi.getSocial(id),
    enabled: !!id,
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['admin-social-expenses', id],
    queryFn: () => meetingsApi.getMeetingExpenses(id),
    enabled: !!id && !!social,
  });

  const createMutation = useMutation({
    mutationFn: (data) => meetingsApi.createExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-expenses', id] });
      setDialogOpen(false);
      setFormData({ description: '', amount: '', category: '' });
      showSnackbar('비용이 추가되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || err.response?.data?.detail || '추가 실패', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => meetingsApi.updateExpense(id, editingExpense.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-expenses', id] });
      setDialogOpen(false);
      setEditingExpense(null);
      setFormData({ description: '', amount: '', category: '' });
      showSnackbar('비용이 수정되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || '수정 실패', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId) => meetingsApi.deleteExpense(id, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-expenses', id] });
      setDeleteTarget(null);
      showSnackbar('비용이 삭제되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || '삭제 실패', 'error'),
  });

  const expenses = (() => {
    const d = expensesData;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.data)) return d.data;
    if (d && Array.isArray(d.expenses)) return d.expenses;
    if (d?.data && Array.isArray(d.data.expenses)) return d.data.expenses;
    return [];
  })();

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({ description: '', amount: '', category: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditingExpense(row);
    setFormData({
      description: row.description ?? row.name ?? '',
      amount: String(row.amount ?? ''),
      category: row.category ?? '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      description: formData.description.trim() || undefined,
      amount: Number(formData.amount) || 0,
      category: formData.category.trim() || undefined,
    };
    if (editingExpense) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (socialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (socialError || !social) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">소셜 모임 정보를 불러올 수 없습니다.</Alert>
        <Button onClick={() => navigate('/socials')} sx={{ mt: 2 }}>소셜 모임 목록으로</Button>
      </Box>
    );
  }

  const socialData = social.data || social;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/socials/${id}`)} sx={{ mr: 2 }}>
          돌아가기
        </Button>
        <Typography variant="h4">비용 관리</Typography>
        <Button variant="contained" startIcon={<PlusIcon />} onClick={handleOpenAdd}>
          비용 추가
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {socialData.name}
      </Typography>

      <MainCard>
        {expensesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>구분/설명</TableCell>
                  <TableCell>카테고리</TableCell>
                  <TableCell align="right">금액</TableCell>
                  <TableCell align="center" width={120}>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      등록된 비용이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.description ?? row.name ?? '-'}</TableCell>
                      <TableCell>{row.category ?? '-'}</TableCell>
                      <TableCell align="right">
                        {Number(row.amount ?? 0).toLocaleString()}원
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpenEdit(row)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </MainCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingExpense ? '비용 수정' : '비용 추가'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="설명"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            />
            <TextField
              fullWidth
              label="카테고리"
              value={formData.category}
              onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
            />
            <TextField
              fullWidth
              type="number"
              label="금액 (원)"
              value={formData.amount}
              onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
              inputProps={{ min: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingExpense ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="비용 삭제"
        message="이 비용 항목을 삭제하시겠습니까?"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
};

export default SocialExpenseManagementPage;
