import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { adminNoticesApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import { 
  MdArrowBack as ArrowLeft, 
  MdEdit as Edit,
  MdDelete as Delete,
  MdDescription as FileIcon
} from 'react-icons/md';

const NoticeDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 공지사항 상세 조회
  const {
    data: notice,
    isLoading,
    error
  } = useQuery({
    queryKey: ['admin-notice', id],
    queryFn: () => adminNoticesApi.getNotice(parseInt(id))
  });

  // 공지사항 삭제
  const deleteMutation = useMutation({
    mutationFn: () => adminNoticesApi.deleteNotice(parseInt(id)),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-notices']);
      navigate('/notices', { 
        state: { message: '공지사항이 삭제되었습니다.' }
      });
    }
  });

  // 카테고리 한글 변환
  const getCategoryName = (type) => {
    const categoryMap = {
      'GENERAL': '일반',
      'MAINTENANCE': '점검',
      'UPDATE': '업데이트',
      'EVENT': '이벤트',
      'ANNOUNCEMENT': '공지'
    };
    return categoryMap[type] || type;
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !notice) {
    return (
      <Box sx={{ width: '100%' }}>
        <Alert severity="error">공지사항을 불러오는 중 오류가 발생했습니다.</Alert>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate('/notices')}
          sx={{ mt: 2 }}
        >
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <MainCard>
          <CardHeader
            title={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h3">공지사항 상세</Typography>
              </Stack>
            }
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<ArrowLeft />}
                  onClick={() => navigate('/notices')}
                >
                  목록으로
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => navigate(`/notices/${id}/edit`)}
                >
                  수정
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  삭제
                </Button>
              </Stack>
            }
          />
          <Divider />
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" spacing={1} mb={2}>
                <Chip
                  label={getCategoryName(notice.type)}
                  color="primary"
                  variant="outlined"
                />
                {notice.is_important && (
                  <Chip
                    label="중요"
                    color="error"
                  />
                )}
                <Chip
                  label={notice.is_published ? '발행됨' : '미발행'}
                  color={notice.is_published ? 'success' : 'default'}
                />
              </Stack>
              <Typography variant="h4" gutterBottom>
                {notice.title}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  작성자: 관리자
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  등록일: {formatDate(notice.published_at || notice.created_at)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  조회수: {notice.view_count || 0}
                </Typography>
              </Stack>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 내용 */}
            <Box
              sx={{
                '& .rich-content': {
                  fontFamily: "'Pretendard', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                  fontSize: '16px',
                  lineHeight: 1.8,
                  color: '#2E3140',
                  maxWidth: 'none',
                },
                // 제목 스타일
                '& .rich-content h1, & .rich-content h2, & .rich-content h3, & .rich-content h4, & .rich-content h5, & .rich-content h6': {
                  marginTop: '2em',
                  marginBottom: '1em',
                  fontWeight: 700,
                  lineHeight: 1.4,
                  color: '#2E3140',
                  borderBottom: 'none !important',
                },
                // 첫 번째 제목의 margin-top 조정
                '& .rich-content h1:first-child, & .rich-content h2:first-child, & .rich-content h3:first-child, & .rich-content h4:first-child, & .rich-content h5:first-child, & .rich-content h6:first-child': {
                  marginTop: '0.5em',
                },
                '& .rich-content h1': {
                  fontSize: '2em',
                },
                '& .rich-content h2': {
                  fontSize: '1.5em',
                },
                '& .rich-content h3': {
                  fontSize: '1.25em',
                },
                // 단락 스타일
                '& .rich-content p': {
                  margin: '1.2em 0',
                  color: '#2E3140',
                },
                '& .rich-content p:first-child': {
                  marginTop: '0.5em',
                },
                // 이미지 스타일
                '& .rich-content img': {
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  margin: '2em 0',
                },
                // iframe 스타일 (YouTube 임베드)
                '& .rich-content iframe': {
                  maxWidth: '100%',
                  margin: '2em 0',
                  borderRadius: '8px',
                },
                // 인용구 스타일
                '& .rich-content blockquote': {
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  backgroundColor: '#f8f9fa',
                  color: '#2E3140',
                  margin: '1.5em 0',
                  padding: '1em 1.5em',
                  borderRadius: '4px',
                },
                // 코드 스타일
                '& .rich-content code': {
                  backgroundColor: '#f1f3f4',
                  color: '#e83e8c',
                  padding: '0.2em 0.4em',
                  borderRadius: '3px',
                  fontSize: '0.9em',
                },
                '& .rich-content pre': {
                  backgroundColor: '#f8f9fa',
                  color: '#2E3140',
                  padding: '1.5em',
                  borderRadius: '8px',
                  overflowX: 'auto',
                  margin: '2em 0',
                },
                '& .rich-content pre code': {
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  padding: 0,
                },
                // 테이블 스타일
                '& .rich-content table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                  margin: '2em 0',
                },
                '& .rich-content table th, & .rich-content table td': {
                  border: '1px solid #e2e8f0',
                  padding: '12px',
                },
                '& .rich-content table th': {
                  backgroundColor: '#f8f9fa',
                  color: '#2E3140',
                  fontWeight: 600,
                },
                // 링크 스타일
                '& .rich-content a': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                  '&:hover': {
                    color: '#2563eb',
                  },
                },
                // 리스트 스타일
                '& .rich-content ul, & .rich-content ol': {
                  margin: '1.2em 0',
                  paddingLeft: '2em',
                },
                '& .rich-content li': {
                  margin: '0.5em 0',
                  color: '#2E3140',
                },
                // 강조 스타일
                '& .rich-content strong': {
                  fontWeight: 600,
                  color: '#2E3140',
                },
                // 기울임꼴
                '& .rich-content em': {
                  fontStyle: 'italic',
                  color: '#2E3140',
                },
              }}
            >
              <Box
                className="rich-content"
                component="div"
                dangerouslySetInnerHTML={{ __html: notice.content }}
              />
            </Box>

            {/* 첨부파일 */}
            {notice.attachment_file && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    첨부파일
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <FileIcon size={24} />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {notice.attachment_file}
                    </Typography>
                    {notice.web_view_link && (
                      <Button
                        variant="outlined"
                        size="small"
                        href={notice.web_view_link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        다운로드
                      </Button>
                    )}
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </MainCard>
      </Box>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>공지사항 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말로 "{notice?.title}" 공지사항을 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button
            onClick={() => deleteMutation.mutate()}
            color="error"
            variant="contained"
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NoticeDetailPage;

