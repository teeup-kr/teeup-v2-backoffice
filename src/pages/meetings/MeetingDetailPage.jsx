import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Tooltip
} from '@mui/material';
import { meetingsApi } from '../../lib/api/meetings';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';
import { MdArrowBack as ArrowLeft, MdEdit, MdDelete, MdPersonAdd, MdBlock, MdCheckCircle, MdCancel, MdAttachMoney, MdScore, MdGroup, MdSchedule as ScheduleIcon, MdLocationOn as LocationIcon, MdPeople as PeopleIcon, MdTrendingUp as TrendingUpIcon, MdGolfCourse as GolfIcon, MdEvent as EventIcon } from 'react-icons/md';

// 참가자 역할 한국어 변환
const getParticipantRoleLabel = (role) => {
  switch (role) {
    case 'ORGANIZER':
      return '개설자';
    case 'PARTICIPANT':
      return '참가자';
    default:
      return role || '알 수 없음';
  }
};

// 참가자 상태 한국어 변환
const getParticipantStatusLabel = (status) => {
  switch (status) {
    case 'CONFIRMED':
      return '확정';
    case 'CANCELED':
      return '취소';
    case 'PENDING':
      return '대기중';
    default:
      return status || '알 수 없음';
  }
};

const MeetingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  // 모임 상세 정보 조회
  const {
    data: meeting,
    isLoading: meetingLoading,
    error: meetingError
  } = useQuery({
    queryKey: ['admin-meeting', id],
    queryFn: () => meetingsApi.getMeeting(id),
    enabled: !!id,
  });

  // 모임 참가자 목록 조회
  const {
    data: participants,
    isLoading: participantsLoading
  } = useQuery({
    queryKey: ['admin-meeting-participants', id],
    queryFn: () => meetingsApi.getMeetingParticipants(id),
    enabled: !!id,
  });

  // 모임 삭제 mutation
  const deleteMeetingMutation = useMutation({
    mutationFn: () => meetingsApi.deleteMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
      navigate('/meetings', { 
        state: { message: '모임이 성공적으로 삭제되었습니다.' }
      });
    },
    onError: (error) => {
      console.error('모임 삭제 실패:', error);
    }
  });

  // 모임 상태 변경 mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data) => meetingsApi.updateMeetingStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting', id] });
      setShowStatusDialog(false);
      setStatusReason('');
    },
    onError: (error) => {
      console.error('상태 변경 실패:', error);
    }
  });

  // 참가자 상태 변경 mutation
  const updateParticipantStatusMutation = useMutation({
    mutationFn: ({ participantId, status }) => meetingsApi.updateParticipantStatus(id, participantId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-participants', id] });
    },
    onError: (error) => {
      console.error('참가자 상태 변경 실패:', error);
    }
  });

  const handleDeleteMeeting = () => {
    deleteMeetingMutation.mutate();
    setShowDeleteDialog(false);
  };

  const handleStatusChange = () => {
    updateStatusMutation.mutate({
      status: newStatus,
      reason: statusReason,
    });
  };

  const handleParticipantStatusChange = (participantId, status) => {
    updateParticipantStatusMutation.mutate({ participantId, status });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'CANCELLED': return 'error';
      case 'COMPLETED': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return '활성';
      case 'INACTIVE': return '비활성';
      case 'CANCELLED': return '취소';
      case 'CANCELED': return '취소';
      case 'COMPLETED': return '완료';
      default: return status || '알 수 없음';
    }
  };

  if (meetingLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (meetingError || !meeting) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          모임 정보를 불러올 수 없습니다.
        </Alert>
        <Button
          onClick={() => navigate('/meetings')}
          sx={{ mt: 2 }}
        >
          모임 목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => navigate('/meetings')}
            style={{ marginRight: 16 }}
          >
            돌아가기
          </Button>
          <Typography variant="h4">
            {meeting.name}
          </Typography>
          <Chip
            label={getStatusText(meeting.status)}
            color={getStatusColor(meeting.status)}
            sx={{ ml: 2 }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/meetings/${id}/edit`)}
          >
            수정
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => {
              setNewStatus(meeting.status === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE');
              setShowStatusDialog(true);
            }}
          >
            {meeting.status === 'ACTIVE' ? '취소' : '활성화'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setShowDeleteDialog(true)}
          >
            삭제
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* 모임 기본 정보 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="모임 정보" />
            <CardContent>
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      모임명
                    </Typography>
                    <Typography variant="h6">
                      {meeting.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      모임 유형
                    </Typography>
                    <Typography variant="h6">
                      {meeting.type === 'ROUNDING' ? '라운딩' : '소셜'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                      모임 설명
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {meeting.description}
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      모임 날짜
                    </Typography>
                    <Typography variant="body1">
                      {new Date(meeting.meeting_date).toLocaleDateString('ko-KR')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      모임 시간
                    </Typography>
                    <Typography variant="body1">
                      {meeting.meeting_time}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      장소
                    </Typography>
                    <Typography variant="body1">
                      {meeting.location || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      참가비
                    </Typography>
                    <Typography variant="body1">
                      {meeting.fee ? `${meeting.fee.toLocaleString()}원` : '무료'}
                    </Typography>
                  </Grid>
                </Grid>
                
                {meeting.additional_info && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      추가 정보
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {meeting.additional_info}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* 참가자 목록 */}
          <Card sx={{ mt: 3 }}>
            <CardHeader 
              title="참가자 목록" 
              action={
                <Button
                  variant="outlined"
                  startIcon={<PersonAdd />}
                  onClick={() => navigate(`/meetings/${id}/participants`)}
                >
                  참가자 관리
                </Button>
              }
            />
            <CardContent>
              {participantsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>닉네임</TableCell>
                        <TableCell>이메일</TableCell>
                        <TableCell>전화번호</TableCell>
                        <TableCell>상태</TableCell>
                        <TableCell>가입일</TableCell>
                        <TableCell>액션</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participants?.participants?.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell>{participant.user.nickname}</TableCell>
                          <TableCell>{participant.user.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={getParticipantRoleLabel(participant.role)}
                              color={participant.role === 'ORGANIZER' ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getParticipantStatusLabel(participant.status)}
                              color={participant.status === 'CONFIRMED' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(participant.created_at).toLocaleDateString('ko-KR')}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleParticipantStatusChange(
                                participant.id, 
                                participant.status === 'CONFIRMED' ? 'CANCELLED' : 'CONFIRMED'
                              )}
                            >
                              {participant.status === 'CONFIRMED' ? <Block /> : <CheckCircle />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 모임 통계 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="모임 통계" />
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    총 참가자 수
                  </Typography>
                  <Typography variant="h4">
                    {meeting.participant_count || 0}명
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    주최자
                  </Typography>
                  <Typography variant="body1">
                    {meeting.organizer?.nickname || 'N/A'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    생성일
                  </Typography>
                  <Typography variant="body1">
                    {new Date(meeting.created_at).toLocaleDateString('ko-KR')}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    마지막 수정일
                  </Typography>
                  <Typography variant="body1">
                    {new Date(meeting.updated_at).toLocaleDateString('ko-KR')}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* 빠른 액션 */}
          <Card sx={{ mt: 2 }}>
            <CardHeader title="빠른 액션" />
            <CardContent>
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AttachMoney />}
                  onClick={() => navigate(`/meetings/${id}/expenses`)}
                >
                  비용 관리
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Score />}
                  onClick={() => navigate(`/meetings/${id}/scores`)}
                >
                  점수 관리
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Group />}
                  onClick={() => navigate(`/meetings/${id}/teams`)}
                >
                  팀 관리
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>모임 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 이 모임을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleDeleteMeeting}
            color="error"
            variant="contained"
            disabled={deleteMeetingMutation.isPending}
          >
            {deleteMeetingMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상태 변경 다이얼로그 */}
      <Dialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>모임 상태 변경</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="변경할 상태"
              value={getStatusText(newStatus)}
              disabled
            />
            <TextField
              fullWidth
              label="변경 사유"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              multiline
              rows={3}
              placeholder="상태 변경 사유를 입력해주세요"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatusDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? '변경 중...' : '상태 변경'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingDetailPage;
