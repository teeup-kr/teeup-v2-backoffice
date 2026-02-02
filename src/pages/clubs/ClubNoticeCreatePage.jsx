import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { clubsApi } from '../../lib/api/clubs';
import { adminNoticesApi } from '../../lib/api/admin';
import AnimateButton from '../../components/@extended/AnimateButton';
import { TipTapEditor } from '../../components/RichTextEditor';
import { MdArrowBack as ArrowLeft, MdSave as Save } from 'react-icons/md';

const ClubNoticeCreatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editorRef = useRef(null);
  const editorContentRef = useRef('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_important: false,
    is_private: false,
  });
  const [errors, setErrors] = useState({});

  const { data: club } = useQuery({
    queryKey: ['admin-club', id],
    queryFn: () => clubsApi.getClub(id),
    enabled: !!id,
  });

  const handleImageUpload = async (file) => {
    const result = await adminNoticesApi.uploadFile(file);
    return result.web_view_link || result.web_content_link || result.file_id || '';
  };

  const createMutation = useMutation({
    mutationFn: (data) => clubsApi.createClubNotice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-notices', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-club', id] });
      navigate(`/clubs/${id}`, { state: { message: '공지사항이 등록되었습니다.' } });
    },
    onError: (err) => {
      setErrors({ general: err.response?.data?.detail || '등록에 실패했습니다.' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = editorRef.current?.getHTML?.() ?? editorContentRef.current ?? formData.content;
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = '제목을 입력해주세요.';
    if (!content || content.trim() === '' || content.replace(/<[^>]*>/g, '').trim() === '') {
      newErrors.content = '내용을 입력해주세요.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    createMutation.mutate({ ...formData, content });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/clubs/${id}`)} variant="outlined" size="small">
          목록
        </Button>
        <Typography variant="h4">{club?.name} - 공지 추가</Typography>
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

              <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_important}
                      onChange={(e) => setFormData((p) => ({ ...p, is_important: e.target.checked }))}
                    />
                  }
                  label="중요 공지"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_private}
                      onChange={(e) => setFormData((p) => ({ ...p, is_private: e.target.checked }))}
                    />
                  }
                  label="비공개"
                />
              </Stack>

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                  내용 <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TipTapEditor
                  editorRef={editorRef}
                  initialValue={formData.content}
                  onChange={(html) => {
                    editorContentRef.current = html;
                    setFormData((p) => ({ ...p, content: html }));
                  }}
                  placeholder="내용을 입력하세요"
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
                <Button variant="outlined" onClick={() => navigate(`/clubs/${id}`)}>
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

export default ClubNoticeCreatePage;
