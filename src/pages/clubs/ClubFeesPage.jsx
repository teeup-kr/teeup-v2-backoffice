import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { clubsApi } from '../../lib/api/clubs';
import { useSnackbar } from '../../contexts/SnackbarContext';
import MainCard from '../../components/MainCard';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import { MdArrowBack as ArrowLeft, MdAdd as Plus, MdEdit as Edit, MdDelete as Delete } from 'react-icons/md';

const CYCLE_OPTIONS = [
  { value: 'MONTHLY', label: '월' },
  { value: 'QUARTERLY', label: '분기' },
  { value: 'YEARLY', label: '년' },
  { value: 'ONE_TIME', label: '1회' },
];

const ClubFeesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    cycle: '',
    description: '',
    is_active: true,
  });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: club, isLoading: clubLoading } = useQuery({
    queryKey: ['admin-club', id],
    queryFn: () => clubsApi.getClub(id),
    enabled: !!id,
  });

  const { data: fees = [], isLoading: feesLoading } = useQuery({
    queryKey: ['admin-club-fees', id],
    queryFn: () => clubsApi.getClubFees(id),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => clubsApi.createClubFee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-fees', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-club', id] });
      setModalOpen(false);
      resetForm();
      showSnackbar('회비 항목이 추가되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.detail || '추가 실패', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => clubsApi.updateClubFee(id, editingFee.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-fees', id] });
      setModalOpen(false);
      setEditingFee(null);
      resetForm();
      showSnackbar('회비 항목이 수정되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.detail || '수정 실패', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (feeId) => clubsApi.deleteClubFee(id, feeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-fees', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-club', id] });
      setDeleteTarget(null);
      showSnackbar('회비 항목이 삭제되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.detail || '삭제 실패', 'error'),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      cycle: '',
      description: '',
      is_active: true,
    });
  };

  const handleOpenAdd = () => {
    setEditingFee(null);
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (fee) => {
    setEditingFee(fee);
    setFormData({
      name: fee.name,
      amount: String(fee.amount || ''),
      cycle: fee.cycle || '',
      description: fee.description || '',
      is_active: fee.is_active !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0) {
      showSnackbar('올바른 금액을 입력해주세요.', 'error');
      return;
    }
    const data = {
      name: formData.name.trim(),
      amount,
      cycle: formData.cycle || null,
      description: formData.description?.trim() || null,
      is_active: formData.is_active,
    };
    if (editingFee) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const getCycleLabel = (val) => CYCLE_OPTIONS.find((o) => o.value === val)?.label || val;

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
            <Typography variant="h4">{club?.name} 회비</Typography>
            <Typography variant="body2" color="text.secondary">
              회비 항목 관리
            </Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<Plus />} onClick={handleOpenAdd}>
          회비 추가
        </Button>
      </Stack>

      <MainCard>
        {feesLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : fees.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography color="text.secondary">등록된 회비 항목이 없습니다.</Typography>
            <Button variant="outlined" startIcon={<Plus />} onClick={handleOpenAdd} sx={{ mt: 2 }}>
              회비 항목 추가
            </Button>
          </Box>
        ) : (
          <Stack spacing={0}>
            {fees.map((f) => (
              <Stack
                key={f.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  py: 2,
                  px: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 0 },
                }}
              >
                <Box>
                  <Typography variant="subtitle1">{f.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Number(f.amount)?.toLocaleString()}원
                    {f.cycle ? ` / ${getCycleLabel(f.cycle)}` : ''}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" startIcon={<Edit />} onClick={() => handleOpenEdit(f)}>
                    수정
                  </Button>
                  <IconButton size="small" color="error" onClick={() => setDeleteTarget(f)}>
                    <Delete size={18} />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </MainCard>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingFee ? '회비 수정' : '회비 추가'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="항목명"
                required
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
              <TextField
                fullWidth
                label="금액 (원)"
                type="number"
                required
                inputProps={{ min: 0 }}
                value={formData.amount}
                onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
              />
              <FormControl fullWidth>
                <InputLabel>주기</InputLabel>
                <Select
                  value={formData.cycle}
                  label="주기"
                  onChange={(e) => setFormData((p) => ({ ...p, cycle: e.target.value }))}
                >
                  <MenuItem value="">선택 안함</MenuItem>
                  {CYCLE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="설명"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                  />
                }
                label="활성"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>취소</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingFee ? '수정' : '추가'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="회비 삭제"
        content={deleteTarget ? `"${deleteTarget.name}" 항목을 삭제하시겠습니까?` : ''}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default ClubFeesPage;
