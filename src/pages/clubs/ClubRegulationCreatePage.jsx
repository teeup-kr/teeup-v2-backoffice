import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { clubsApi } from '../../lib/api/clubs';
import { adminNoticesApi } from '../../lib/api/admin';
import AnimateButton from '../../components/@extended/AnimateButton';
import { TipTapEditor } from '../../components/RichTextEditor';
import { MdArrowBack as ArrowLeft, MdSave as Save } from 'react-icons/md';

const ClubRegulationCreatePage = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editorRef = useRef(null);

  const [formData, setFormData] = useState({
    category_id: state?.categoryId || '',
    title: '',
    content: '',
    status: 'ACTIVE',
  });
  const [errors, setErrors] = useState({});

  const { data: club } = useQuery({
    queryKey: ['admin-club', id],
    queryFn: () => clubsApi.getClub(id),
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-club-regulation-categories', id],
    queryFn: () => clubsApi.getClubRegulationCategories(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (state?.categoryId && !formData.category_id) {
      setFormData((p) => ({ ...p, category_id: state.categoryId }));
    }
  }, [state?.categoryId, formData.category_id]);

  const handleImageUpload = async (file) => {
    const result = await adminNoticesApi.uploadFile(file);
    return result.web_view_link || result.web_content_link || result.file_id || '';
  };

  const createMutation = useMutation({
    mutationFn: (data) => clubsApi.createClubRegulation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-regulations', id] });
      navigate(`/clubs/${id}/regulations`, { state: { message: '규정이 등록되었습니다.' } });
    },
    onError: (err) => setErrors({ general: err.response?.data?.detail || '등록 실패' }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = editorRef.current?.getHTML?.() ?? formData.content;
    const newErrors = {};
    if (!formData.category_id) newErrors.category_id = '카테고리를 선택해주세요.';
    if (!formData.title.trim()) newErrors.title = '제목을 입력해주세요.';
    if (!content || content.replace(/<[^>]*>/g, '').trim() === '') newErrors.content = '내용을 입력해주세요.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    createMutation.mutate({
      category_id: parseInt(formData.category_id, 10),
      title: formData.title.trim(),
      content,
      status: formData.status,
    });
  };

  return (
    <Box sx={{ py: 3, px: 0 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/clubs/${id}/regulations`)} variant="outlined" size="small">
          목록
        </Button>
        <Typography variant="h4">{club?.name} - 규정 추가</Typography>
      </Stack>

      <Paper>
        <Card>
          <CardContent sx={{ p: 4 }}>
            {errors.general && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.general}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <FormControl fullWidth sx={{ mb: 3 }} error={!!errors.category_id}>
                <InputLabel>카테고리 *</InputLabel>
                <Select
                  value={formData.category_id}
                  label="카테고리 *"
                  onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))}
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category_id && <Typography variant="caption" color="error">{errors.category_id}</Typography>}
              </FormControl>

              <TextField
                fullWidth
                label="제목"
                required
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                error={!!errors.title}
                helperText={errors.title}
                sx={{ mb: 3 }}
              />

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                  내용 <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TipTapEditor
                  editorRef={editorRef}
                  initialValue={formData.content}
                  onChange={(html) => setFormData((p) => ({ ...p, content: html }))}
                  placeholder="규정 내용을 입력하세요"
                  height={400}
                  onImageUpload={handleImageUpload}
                />
                {errors.content && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {errors.content}
                  </Typography>
                )}
              </Box>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => navigate(`/clubs/${id}/regulations`)}>
                  취소
                </Button>
                <AnimateButton>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={createMutation.isPending ? <CircularProgress size={20} /> : <Save />}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? '저장 중...' : '저장'}
                  </Button>
                </AnimateButton>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Paper>
    </Box>
  );
};

export default ClubRegulationCreatePage;
