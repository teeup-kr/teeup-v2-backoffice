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
  Card,
  CardContent,
  CircularProgress,
  Chip,
} from '@mui/material';
import { clubsApi } from '../../lib/api/clubs';
import { useSnackbar } from '../../contexts/SnackbarContext';
import MainCard from '../../components/MainCard';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import { MdArrowBack as ArrowLeft, MdAdd as Plus, MdEdit as Edit, MdDelete as Delete } from 'react-icons/md';

const ClubRegulationsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  const { data: club, isLoading: clubLoading } = useQuery({
    queryKey: ['admin-club', id],
    queryFn: () => clubsApi.getClub(id),
    enabled: !!id,
  });

  const { data: regulationsData, isLoading: regLoading } = useQuery({
    queryKey: ['admin-club-regulations', id],
    queryFn: () => clubsApi.getClubRegulations(id),
    enabled: !!id,
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name) => clubsApi.createClubRegulationCategory(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-regulations', id] });
      setCategoryModalOpen(false);
      setNewCategoryName('');
      showSnackbar('카테고리가 추가되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.detail || '추가 실패', 'error'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId) => clubsApi.deleteClubRegulationCategory(id, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-regulations', id] });
      setDeleteTarget(null);
      setDeleteType(null);
      showSnackbar('카테고리가 삭제되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.detail || '삭제 실패', 'error'),
  });

  const deleteRegulationMutation = useMutation({
    mutationFn: (regId) => clubsApi.deleteClubRegulation(id, regId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-regulations', id] });
      setDeleteTarget(null);
      setDeleteType(null);
      showSnackbar('규정이 삭제되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.detail || '삭제 실패', 'error'),
  });

  const handleDelete = () => {
    if (deleteType === 'category' && deleteTarget) {
      deleteCategoryMutation.mutate(deleteTarget.id);
    } else if (deleteType === 'regulation' && deleteTarget) {
      deleteRegulationMutation.mutate(deleteTarget.id);
    }
  };

  const categories = regulationsData?.categories || [];

  if (clubLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, px: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate(`/clubs/${id}`)} size="small">
            <ArrowLeft />
          </IconButton>
          <Box>
            <Typography variant="h4">{club?.name} 규정</Typography>
            <Typography variant="body2" color="text.secondary">
              규정 카테고리 및 규정 관리
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Plus />} onClick={() => setCategoryModalOpen(true)}>
            카테고리 추가
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => navigate(`/clubs/${id}/regulations/create`)}
            disabled={categories.length === 0}
          >
            규정 추가
          </Button>
        </Stack>
      </Stack>

      {categories.length === 0 && !regLoading ? (
        <MainCard>
          <Box textAlign="center" py={6}>
            <Typography color="text.secondary" gutterBottom>
              등록된 규정이 없습니다.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              먼저 카테고리를 추가한 후 규정을 등록해주세요.
            </Typography>
            <Button variant="contained" startIcon={<Plus />} onClick={() => setCategoryModalOpen(true)}>
              카테고리 추가
            </Button>
          </Box>
        </MainCard>
      ) : (
        <Stack spacing={3}>
          {categories.map((cat) => (
            <MainCard key={cat.id}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">{cat.name}</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<Plus />}
                    onClick={() => navigate(`/clubs/${id}/regulations/create`, { state: { categoryId: cat.id } })}
                  >
                    규정 추가
                  </Button>
                  <IconButton size="small" onClick={() => { setDeleteTarget(cat); setDeleteType('category'); }}>
                    <Delete size={18} />
                  </IconButton>
                </Stack>
              </Stack>
              {cat.regulations?.length > 0 ? (
                <Stack spacing={1}>
                  {cat.regulations.map((r) => (
                    <Stack
                      key={r.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: 'grey.50',
                        '&:hover': { bgcolor: 'grey.100' },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ cursor: 'pointer', flex: 1 }}
                        onClick={() => navigate(`/clubs/${id}/regulations/${r.id}/edit`)}
                      >
                        {r.title}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setDeleteTarget(r);
                          setDeleteType('regulation');
                        }}
                      >
                        <Delete size={16} />
                      </IconButton>
                      <Button size="small" startIcon={<Edit />} onClick={() => navigate(`/clubs/${id}/regulations/${r.id}/edit`)}>
                        수정
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  등록된 규정이 없습니다.
                </Typography>
              )}
            </MainCard>
          ))}
        </Stack>
      )}

      <Dialog open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>카테고리 추가</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="카테고리 이름"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryModalOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={() => newCategoryName.trim() && createCategoryMutation.mutate(newCategoryName.trim())}
            disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
          >
            추가
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteType === 'category' ? '카테고리 삭제' : '규정 삭제'}
        content={
          deleteTarget
            ? `정말로 "${deleteTarget.name || deleteTarget.title}"을(를) 삭제하시겠습니까?${
                deleteType === 'category' ? ' (해당 카테고리의 모든 규정도 삭제됩니다)' : ''
              }`
            : ''
        }
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteType(null);
        }}
        confirmText="삭제"
        isLoading={deleteCategoryMutation.isPending || deleteRegulationMutation.isPending}
      />
    </Box>
  );
};

export default ClubRegulationsPage;
