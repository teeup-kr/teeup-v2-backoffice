import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import { adminFAQApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import { MdArrowBack as ArrowLeft, MdEdit as Edit } from 'react-icons/md';

const FAQDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // FAQ 상세 조회
  const {
    data: faq,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-faq', id],
    queryFn: () => adminFAQApi.getFaq(id),
    enabled: !!id,
  });

  // 날짜 포맷팅
  const formatDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${da} ${hh}:${mm}`;
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
        FAQ를 불러오는데 실패했습니다.
      </Alert>
    );
  }

  if (!faq) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          FAQ 상세보기
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => navigate('/faq')}
            variant="outlined"
          >
            목록으로
          </Button>
          <Button
            startIcon={<Edit />}
            onClick={() => navigate(`/faq/${id}/edit`)}
            variant="contained"
            color="primary"
          >
            수정하기
          </Button>
        </Stack>
      </Box>

      <MainCard>
        <Stack spacing={3}>
          {/* 카테고리 */}
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              카테고리
            </Typography>
            {(faq.category_title ?? faq.category_name) ? (
              <Chip label={faq.category_title ?? faq.category_name} size="small" color="primary" />
            ) : (
              <Typography variant="body2" color="textSecondary">
                카테고리 없음
              </Typography>
            )}
          </Box>

          <Divider />

          {/* 질문 */}
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              질문
            </Typography>
            <Typography variant="body1">{faq.question}</Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              {faq.question?.length || 0}/300자
            </Typography>
          </Box>

          <Divider />

          {/* 답변 */}
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              답변
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                minHeight: 200,
                whiteSpace: 'pre-wrap',
                bgcolor: 'grey.50',
              }}
            >
              <Typography variant="body1">{faq.answer}</Typography>
            </Paper>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              {faq.answer?.length || 0}자
            </Typography>
          </Box>

          <Divider />

          {/* 공개 상태 */}
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              공개 상태
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={faq.is_active ? '공개' : '비공개'}
                color={faq.is_active ? 'success' : 'default'}
                size="small"
              />
              <Typography variant="body2" color="textSecondary">
                {faq.is_active ? '클라이언트에서 볼 수 있습니다.' : '클라이언트에서 볼 수 없습니다.'}
              </Typography>
            </Stack>
          </Box>

          <Divider />

          {/* 메타 정보 */}
          <Box>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
              메타 정보
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="textSecondary" display="block">
                  FAQ ID
                </Typography>
                <Typography variant="body2">{faq.id}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary" display="block">
                  조회수
                </Typography>
                <Typography variant="body2">{faq.views || 0}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary" display="block">
                  생성일
                </Typography>
                <Typography variant="body2">{formatDate(faq.created_at)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary" display="block">
                  수정일
                </Typography>
                <Typography variant="body2">{formatDate(faq.updated_at)}</Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </MainCard>
    </Box>
  );
};

export default FAQDetailPage;

