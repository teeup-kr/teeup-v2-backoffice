import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  Paper,
} from '@mui/material';
import { adminInquiriesApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import { MdArrowBack as ArrowLeft, MdEdit as Edit, MdDelete as Delete, MdSend as Send } from 'react-icons/md';

const getTypeLabel = (type) => {
  const typeMap = {
    GENERAL: '일반',
    TECHNICAL: '기술',
    BILLING: '결제/요금',
    FEATURE_REQUEST: '기능 요청',
    BUG_REPORT: '버그 신고',
    ACCOUNT: '계정',
    PAYMENT: '결제',
  };
  return typeMap[type] || type || '-';
};

const getStatusLabel = (status) => {
  const statusMap = {
    PENDING: '대기',
    SUBMITTED: '제출됨',
    IN_PROGRESS: '진행중',
    RESOLVED: '해결됨',
    COMPLETED: '완료',
    CLOSED: '종료',
  };
  return statusMap[status] || status || '-';
};

const STATUS_OPTIONS = [
  { value: 'PENDING', label: '대기' },
  { value: 'SUBMITTED', label: '제출됨' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'RESOLVED', label: '해결됨' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CLOSED', label: '종료' },
];

const InquiryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newResponse, setNewResponse] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [editingResponseId, setEditingResponseId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState(null);

  const {
    data: detailData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-inquiry', id],
    queryFn: () => adminInquiriesApi.getInquiry(id),
    enabled: !!id,
  });

  const inquiry = detailData?.inquiry;
  const responses = detailData?.responses || [];

  const statusMutation = useMutation({
    mutationFn: (status) => adminInquiriesApi.updateInquiryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-inquiry', id]);
      queryClient.invalidateQueries(['admin-inquiries']);
    },
  });

  const createResponseMutation = useMutation({
    mutationFn: (data) => adminInquiriesApi.createResponse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-inquiry', id]);
      setNewResponse('');
      setIsInternal(false);
    },
  });

  const updateResponseMutation = useMutation({
    mutationFn: ({ responseId, data }) =>
      adminInquiriesApi.updateResponse(id, responseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-inquiry', id]);
      setEditingResponseId(null);
      setEditContent('');
    },
  });

  const deleteResponseMutation = useMutation({
    mutationFn: (responseId) => adminInquiriesApi.deleteResponse(id, responseId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-inquiry', id]);
      setDeleteDialogOpen(false);
      setResponseToDelete(null);
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = (e) => {
    const status = e.target.value;
    statusMutation.mutate(status);
  };

  const handleSubmitResponse = (e) => {
    e.preventDefault();
    if (!newResponse.trim()) return;
    createResponseMutation.mutate({ content: newResponse.trim(), is_internal: isInternal });
  };

  const handleStartEdit = (res) => {
    setEditingResponseId(res.id);
    setEditContent(res.content);
  };

  const handleSaveEdit = () => {
    if (!editingResponseId || !editContent.trim()) return;
    updateResponseMutation.mutate({
      responseId: editingResponseId,
      data: { content: editContent.trim() },
    });
  };

  const handleCancelEdit = () => {
    setEditingResponseId(null);
    setEditContent('');
  };

  const handleDeleteResponse = (res) => {
    setResponseToDelete(res);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (responseToDelete) {
      deleteResponseMutation.mutate(responseToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !inquiry) {
    return (
      <Box sx={{ width: '100%' }}>
        <Alert severity="error">문의를 불러오는 중 오류가 발생했습니다.</Alert>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate('/inquiries')} sx={{ mt: 2 }}>
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <MainCard>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Button
              startIcon={<ArrowLeft />}
              onClick={() => navigate('/inquiries')}
              sx={{ mb: 1 }}
            >
              목록으로
            </Button>
            <Typography variant="h4" gutterBottom>
              {inquiry.title || '(제목 없음)'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={getTypeLabel(inquiry.type)} color="primary" variant="outlined" size="small" />
              <Chip
                label={getStatusLabel(inquiry.status)}
                color={inquiry.status === 'RESOLVED' || inquiry.status === 'COMPLETED' ? 'success' : 'default'}
                size="small"
              />
              <Typography variant="body2" color="textSecondary">
                작성자: {inquiry.user_nickname || '-'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                등록일: {formatDate(inquiry.created_at)}
              </Typography>
            </Stack>
          </Box>
          <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>상태 변경</InputLabel>
              <Select
                value={inquiry.status}
                label="상태 변경"
                onChange={handleStatusChange}
                disabled={statusMutation.isPending}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
          </FormControl>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            문의 내용
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {inquiry.content || '(내용 없음)'}
            </Typography>
          </Paper>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          답변 목록 ({responses.length}개)
        </Typography>

        <Stack spacing={2} sx={{ mb: 4 }}>
          {responses.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              등록된 답변이 없습니다.
            </Typography>
          ) : (
            responses.map((res) => (
              <Paper key={res.id} variant="outlined" sx={{ p: 2 }}>
                {editingResponseId === res.id ? (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleSaveEdit}
                        disabled={updateResponseMutation.isPending}
                      >
                        저장
                      </Button>
                      <Button size="small" variant="outlined" onClick={handleCancelEdit}>
                        취소
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="body2" color="textSecondary">
                        관리자 · {formatDate(res.created_at)}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => handleStartEdit(res)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteResponse(res)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                    <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                      {res.content}
                    </Typography>
                  </>
                )}
              </Paper>
            ))
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          답변 작성
        </Typography>
        <Box component="form" onSubmit={handleSubmitResponse}>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="답변 내용을 입력하세요."
            value={newResponse}
            onChange={(e) => setNewResponse(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
            }
            label="내부 메모 (사용자에게 보이지 않음)"
          />
          <Box sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={createResponseMutation.isPending ? <CircularProgress size={20} /> : <Send />}
              disabled={!newResponse.trim() || createResponseMutation.isPending}
            >
              {createResponseMutation.isPending ? '등록 중...' : '답변 등록'}
            </Button>
          </Box>
        </Box>
      </MainCard>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>답변 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 답변을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteResponseMutation.isPending}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InquiryDetailPage;
