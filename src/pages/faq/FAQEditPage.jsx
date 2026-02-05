import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import { adminFAQApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import { MdArrowBack as ArrowLeft, MdSave as Save } from 'react-icons/md';

const FAQEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    category_id: '',
    question: '',
    answer: '',
    is_active: true,
    order: 0,
  });
  const [errors, setErrors] = useState({});

  // FAQ 상세 조회
  const {
    data: faq,
    isLoading: isLoadingFaq,
  } = useQuery({
    queryKey: ['admin-faq', id],
    queryFn: () => adminFAQApi.getFaq(id),
    enabled: !!id,
    onSuccess: (data) => {
      setFormData({
        question: data.question || '',
        answer: data.answer || '',
        category_id: data.category_id?.toString() || '',
        is_active: data.is_active ?? true,
        order: data.order || 0,
      });
    },
  });

  // 카테고리 목록 조회
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-faq-categories'],
    queryFn: () => adminFAQApi.getCategories(),
  });

  // FAQ 수정 mutation
  const updateMutation = useMutation({
    mutationFn: (data) => adminFAQApi.updateFaq(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-faqs']);
      queryClient.invalidateQueries(['admin-faq', id]);
      navigate(`/faq/${id}`, { 
        state: { message: 'FAQ가 성공적으로 수정되었습니다.' }
      });
    },
    onError: (error) => {
      console.error('FAQ 수정 실패:', error);
      const errorMessage = error.response?.data?.detail || 'FAQ 수정에 실패했습니다.';
      setErrors({ general: errorMessage });
    }
  });

  // 폼 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.question.trim()) {
      newErrors.question = '질문을 입력해주세요.';
    }
    if (formData.question.length > 300) {
      newErrors.question = '질문은 300자 이하로 입력해주세요.';
    }
    if (!formData.answer.trim()) {
      newErrors.answer = '답변을 입력해주세요.';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    updateMutation.mutate({
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      category_id: formData.category_id ? Number(formData.category_id) : null,
      order: formData.order,
      is_active: formData.is_active,
    });
  };

  if (isLoadingFaq) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          FAQ 수정
        </Typography>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate('/faq')}
          variant="outlined"
        >
          목록으로
        </Button>
      </Box>

      <MainCard>
        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* 카테고리 선택 */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>카테고리 *</InputLabel>
            <Select
              value={formData.category_id}
              label="카테고리 *"
              onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
            >
              <MenuItem value="">카테고리를 선택하세요</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={String(cat.id)}>
                  {cat.title ?? cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 질문 */}
          <TextField
            fullWidth
            label="질문 *"
            required
            value={formData.question}
            onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
            error={!!errors.question}
            helperText={errors.question || `${formData.question.length}/300자`}
            maxLength={300}
            sx={{ mb: 3 }}
          />

          {/* 답변 */}
          <TextField
            fullWidth
            label="답변 *"
            required
            multiline
            rows={8}
            value={formData.answer}
            onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
            error={!!errors.answer}
            helperText={errors.answer || `${formData.answer.length}자`}
            sx={{ mb: 3 }}
          />

          {/* 공개 여부 */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              />
            }
            label="공개"
            sx={{ mb: 3 }}
          />
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 3 }}>
            체크하면 클라이언트에서 볼 수 있습니다.
          </Typography>

          {/* 제출 버튼 */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/faq')}
              >
                취소
              </Button>
              <AnimateButton>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={updateMutation.isPending ? <CircularProgress size={20} /> : <Save />}
                  disabled={updateMutation.isPending}
                  size="large"
                >
                  {updateMutation.isPending ? '수정 중...' : '수정'}
                </Button>
              </AnimateButton>
            </Stack>
          </Box>
        </Box>
      </MainCard>
    </Box>
  );
};

export default FAQEditPage;

