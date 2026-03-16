import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Stack,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper
} from '@mui/material';
import { clubsApi } from '../../lib/api/clubs.js';
import { regionApi } from '../../lib/api/region.js';
import apiClient from '../../lib/api/apiClient.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';
import { MdArrowBack as ArrowLeft, MdCheckCircle, MdCancel, MdPerson, MdEmail, MdCalendarToday, MdMessage, MdGroup as GroupIcon, MdAssignment as AssignmentIcon, MdPersonAdd as PersonAddIcon } from 'react-icons/md';

function ClubApplicationRegionDisplay({ application }) {
  const hasSidoGungu = application?.sido_code && application?.gungu_codes?.length > 0;
  const { data: sidoList = [] } = useQuery({
    queryKey: ['region-sido'],
    queryFn: () => regionApi.getSidoList(),
    enabled: hasSidoGungu,
  });
  const { data: gunguList = [] } = useQuery({
    queryKey: ['region-gungu', application?.sido_code],
    queryFn: () => regionApi.getGunguList(application.sido_code),
    enabled: hasSidoGungu && !!application?.sido_code,
  });
  if (!hasSidoGungu) {
    return <Typography variant="body1" fontWeight="600">{application?.location || 'N/A'}</Typography>;
  }
  const sidoName = sidoList.find((s) => s.code === application.sido_code)?.name || application.sido_code;
  const gunguNames = (application.gungu_codes || [])
    .map((code) => gunguList.find((g) => g.code === code)?.name || code)
    .filter(Boolean);
  const display = [sidoName, ...gunguNames].filter(Boolean).join(' ');
  return <Typography variant="body1" fontWeight="600">{display || 'N/A'}</Typography>;
}

const ClubApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionReason, setActionReason] = useState('');

  // 클럽 신청 상세 조회
  const {
    data: application,
    isLoading: applicationLoading,
    error: applicationError
  } = useQuery({
    queryKey: ['admin-club-application', id],
    queryFn: () => clubsApi.getClubApplication(id),
    enabled: !!id,
  });

  // 첨부 파일 미리보기용 Blob URL 생성 (인증 헤더 포함 요청)
  useEffect(() => {
    const fileIdOrName = application?.attachment_file;
    if (!fileIdOrName) {
      setPreviewUrl('');
      return;
    }
    // 파일명이면(확장자 포함) 미리보기 시도하지 않음. file_id일 때만 시도
    const looksLikeFileId = !fileIdOrName.includes('.') && fileIdOrName.length > 20;
    if (!looksLikeFileId) {
      setPreviewUrl('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/v1/upload/${encodeURIComponent(fileIdOrName)}`, { responseType: 'blob' });
        if (cancelled) return;
        const url = URL.createObjectURL(res.data);
        setPreviewUrl(url);
      } catch (e) {
        setPreviewUrl('');
      }
    })();
    return () => {
      cancelled = true;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [application?.attachment_file]);

  // 신청 처리 mutation
  const processApplicationMutation = useMutation({
    mutationFn: ({ action, reason }) => 
      clubsApi.approveClubApplication(id, { action, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-application', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-club-applications'] });
      setShowActionDialog(false);
      setActionReason('');
      showSnackbar('처리되었습니다.', 'success');
    },
    onError: (error) => {
      console.error('신청 처리 실패:', error);
      showSnackbar('처리 중 오류가 발생했습니다.', 'error');
    }
  });

  const handleActionClick = (action) => {
    if (action === 'approve') {
      // 승인은 바로 처리 (사유 불필요)
      processApplicationMutation.mutate({
        action: 'approve',
        reason: '',
      });
    } else {
      // 거부는 모달 표시
      setActionType('reject');
      setActionReason('');
      setShowActionDialog(true);
    }
  };

  const handleActionSubmit = () => {
    // 거부 사유와 함께 처리
    processApplicationMutation.mutate({
      action: 'reject',
      reason: actionReason,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'CANCELED': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return '대기중';
      case 'APPROVED': return '승인됨';
      case 'REJECTED': return '거절됨';
      case 'CANCELED': return '취소됨';
      default: return status || '알 수 없음';
    }
  };

  if (applicationLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (applicationError || !application) {
    return (
      <Box sx={{ py: 3, px: 0 }}>
        <Alert severity="error">
          클럽 신청 정보를 불러올 수 없습니다.
        </Alert>
        <Button
          onClick={() => navigate('/clubs/applications')}
          sx={{ mt: 2 }}
        >
          신청 목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* 헤더 */}
      <MainCard sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AnimateButton>
              <Button
                startIcon={<ArrowLeft />}
                onClick={() => navigate('/clubs/applications')}
                variant="outlined"
              >
                돌아가기
              </Button>
            </AnimateButton>
            <Stack direction="row" alignItems="center" spacing={2}>
              <ExtendedAvatar color="primary" size="lg">
                <AssignmentIcon />
              </ExtendedAvatar>
              <Box>
                <Typography variant="h4" component="h1">
                  클럽 신청 상세
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {application.name} 신청 상세
                </Typography>
              </Box>
              <Chip
                label={getStatusText(application.status)}
                color={getStatusColor(application.status)}
                variant="filled"
              />
            </Stack>
          </Stack>
          
          {application.status === 'PENDING' && (
            <Stack direction="row" spacing={1}>
              <AnimateButton>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<MdCheckCircle />}
                  onClick={() => handleActionClick('approve')}
                  size="large"
                >
                  승인
                </Button>
              </AnimateButton>
              <AnimateButton>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<MdCancel />}
                  onClick={() => handleActionClick('reject')}
                  size="large"
                >
                  거절
                </Button>
              </AnimateButton>
            </Stack>
          )}
        </Stack>
      </MainCard>

      <Grid container spacing={3}>
        {/* 좌측 메인 */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <MainCard>
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <GroupIcon style={{ color: '#1976d2' }} />
                <Typography variant="h6">신청 정보</Typography>
              </Stack>
              <Divider />
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">클럽명</Typography>
                  <Typography variant="h6" fontWeight="600">{application.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">클럽 설명</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{application.description}</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">클럽 유형</Typography>
                    <Chip label={application.type === 'REGULAR' ? '정기' : '비정기'} size="small" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">예상 멤버 수</Typography>
                    <Typography variant="body1" fontWeight="600">{application.member_count}명</Typography>
                  </Grid>
                </Grid>
                <Box>
                  <Typography variant="body2" color="text.secondary">활동 지역</Typography>
                  <ClubApplicationRegionDisplay application={application} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">첨부 파일</Typography>
                  {application.attachment_file ? (
                    <Box>
                      <Typography variant="body1" fontWeight="600" sx={{ mb: 1 }}>
                        {application.attachment_file}
                      </Typography>
                      {/* 파일 ID인 경우 (확장자가 없고 길이가 20 이상) */}
                      {!application.attachment_file.includes('.') && application.attachment_file.length > 20 ? (
                        <Button
                          variant="outlined"
                          color="primary"
                          href={`https://drive.google.com/file/d/${application.attachment_file}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ mt: 1 }}
                        >
                          구글 드라이브에서 확인
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          파일명만 저장되어 있습니다.
                        </Typography>
                      )}
                      {previewUrl && (
                        <Box sx={{ mt: 2 }}>
                          <img src={previewUrl} alt="첨부 파일" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #eee' }} />
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body1" fontWeight="600">-</Typography>
                  )}
                </Box>
                {application.additional_info && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">추가 정보</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{application.additional_info}</Typography>
                  </Box>
                )}
              </Stack>
            </Stack>
          </MainCard>
        </Grid>
        {/* 우측 사이드 */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <MainCard>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <PersonAddIcon style={{ color: '#1976d2' }} />
                  <Typography variant="h6">신청자 정보</Typography>
                </Stack>
                <Divider />
                <Typography variant="body1" fontWeight="600">{application.applicant?.realname || '신청자'}</Typography>
                <Typography variant="body2" color="text.secondary">ID: {application.applicant?.id || '-'}</Typography>
                <Typography variant="body2" color="text.secondary">{application.applicant?.email || '-'}</Typography>
              </Stack>
            </MainCard>
            <MainCard>
              <Stack spacing={2}>
                <Typography variant="h6">신청 일시</Typography>
                <Divider />
                <Typography variant="body2">{new Date(application.created_at).toLocaleString('ko-KR')}</Typography>
                {application.updated_at !== application.created_at && (
                  <Typography variant="body2">수정일: {new Date(application.updated_at).toLocaleString('ko-KR')}</Typography>
                )}
              </Stack>
            </MainCard>
            {application.status === 'PENDING' && (
              <MainCard>
                <Stack spacing={2}>
                  <Button variant="contained" color="success" startIcon={<MdCheckCircle />} onClick={() => handleActionClick('approve')}>승인</Button>
                  <Button variant="outlined" color="error" startIcon={<MdCancel />} onClick={() => handleActionClick('reject')}>거절</Button>
                </Stack>
              </MainCard>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* 액션 다이얼로그 */}
      <Dialog
        open={showActionDialog}
        onClose={() => setShowActionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          신청 거부
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              이 클럽 신청을 거부하시겠습니까?
            </Typography>
            <TextField
              fullWidth
              label="거부 사유"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              multiline
              rows={4}
              placeholder="거부 사유를 입력해주세요"
              required
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowActionDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleActionSubmit}
            variant="contained"
            color="error"
            disabled={processApplicationMutation.isPending || !actionReason.trim()}
          >
            {processApplicationMutation.isPending ? '처리 중...' : '거부'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClubApplicationDetailPage;
