import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { adminFAQApi } from '../../lib/api/admin';
import { MdClose as CloseIcon, MdAdd as Plus, MdEdit as Edit, MdDelete as Delete } from 'react-icons/md';

const CategoryModal = ({ open, onClose, onCategoryChanged }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [order, setOrder] = useState(1);
  const [editingCategory, setEditingCategory] = useState(null);

  // 카테고리 목록 조회
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-faq-categories'],
    queryFn: () => adminFAQApi.getCategories(),
    enabled: open,
  });

  // 카테고리 생성 mutation
  const createMutation = useMutation({
    mutationFn: (data) => adminFAQApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-faq-categories']);
      setName('');
      setOrder(1);
      onCategoryChanged?.();
    },
  });

  // 카테고리 수정 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminFAQApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-faq-categories']);
      setEditingCategory(null);
      setName('');
      setOrder(1);
      onCategoryChanged?.();
    },
  });

  // 카테고리 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => adminFAQApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-faq-categories']);
      onCategoryChanged?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (order < 1) {
      alert('순서는 1 이상이어야 합니다.');
      return;
    }
    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        data: { name: name.trim(), order },
      });
    } else {
      createMutation.mutate({ name: name.trim(), order, is_active: true });
    }
  };

  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setOrder(cat.order);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setOrder(1);
  };

  const handleDelete = (id) => {
    if (confirm('정말 이 카테고리를 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">FAQ 카테고리 관리</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {/* 새 카테고리 추가 폼 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
            {editingCategory ? '카테고리 수정' : '새 카테고리 추가'}
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <TextField
                label="카테고리명"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                sx={{ flex: '1 1 auto', maxWidth: '400px' }}
                maxLength={50}
                helperText={`${name.length}/50자`}
              />
              <TextField
                label="순서"
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                required
                inputProps={{ min: 1 }}
                sx={{ width: 120 }}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={editingCategory ? <Edit /> : <Plus />}
                disabled={createMutation.isPending || updateMutation.isPending}
                sx={{ minWidth: 120, height: '56px', alignSelf: 'flex-start', fontSize: '1rem' }}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <CircularProgress size={20} />
                ) : editingCategory ? (
                  '수정'
                ) : (
                  '추가'
                )}
              </Button>
              {editingCategory && (
                <Button variant="outlined" onClick={handleCancelEdit}>
                  취소
                </Button>
              )}
            </Stack>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            위에 있는 것부터 먼저 표시됩니다 (순서가 빠름)
          </Alert>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 카테고리 목록 */}
        <Box>
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
            카테고리 목록
          </Typography>
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : categories.length === 0 ? (
            <Alert severity="info">등록된 카테고리가 없습니다.</Alert>
          ) : (
            <Stack spacing={1}>
              {categories.map((cat) => (
                <Box
                  key={cat.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body1">{cat.name}</Typography>
                    {cat.is_active ? (
                      <Chip label="활성" size="small" color="success" />
                    ) : (
                      <Chip label="비활성" size="small" />
                    )}
                    <Typography variant="caption" color="textSecondary">
                      순서: {cat.order}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEdit(cat)}
                      disabled={editingCategory?.id === cat.id}
                    >
                      수정
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(cat.id)}
                      disabled={deleteMutation.isPending}
                    >
                      삭제
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryModal;

