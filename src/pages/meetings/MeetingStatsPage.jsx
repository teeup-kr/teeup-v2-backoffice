import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import { meetingsApi } from '../../lib/api/meetings';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import { MdArrowBack as ArrowLeft, MdBarChart, MdPeople, MdAttachMoney, MdScore, MdTrendingUp as TrendingUpIcon, MdSchedule as ScheduleIcon, MdGolfCourse as GolfIcon, MdEvent as EventIcon } from 'react-icons/md';

// 참가자 역할 한국어 변환
const getParticipantRoleLabel = (role) => {
  switch (role) {
    case 'ORGANIZER':
      return '개설자';
    case 'PARTICIPANT':
      return '참가자';
    case 'LEADER':
      return '리더';
    case 'MANAGER':
      return '매니저';
    case 'MEMBER':
      return '멤버';
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
    case 'CANCELLED':
      return '취소';
    case 'PENDING':
      return '대기중';
    case 'ACTIVE':
      return '활성';
    case 'INACTIVE':
      return '비활성';
    default:
      return status || '알 수 없음';
  }
};

const MeetingStatsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 모임 통계 조회
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['admin-meeting-stats', id],
    queryFn: () => meetingsApi.getMeetingStats(id),
    enabled: !!id,
  });

  // 모임 상세 정보 조회
  const {
    data: meeting,
    isLoading: meetingLoading
  } = useQuery({
    queryKey: ['admin-meeting', id],
    queryFn: () => meetingsApi.getMeeting(id),
    enabled: !!id,
  });

  if (statsLoading || meetingLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (statsError || !stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          모임 통계를 불러올 수 없습니다.
        </Alert>
        <Button
          onClick={() => navigate(`/meetings/${id}`)}
          sx={{ mt: 2 }}
        >
          모임 상세로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate(`/meetings/${id}`)}
          style={{ marginRight: 16 }}
        >
            돌아가기
        </Button>
        <Typography variant="h4">
          {meeting?.name} 통계
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 기본 통계 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="참가자 통계" />
            <CardContent>
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <People sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4">
                      {stats.participant_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      총 참가자 수
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BarChart sx={{ mr: 2, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h4">
                      {stats.confirmed_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      확정된 참가자
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoney sx={{ mr: 2, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h4">
                      {stats.total_fee ? `${stats.total_fee.toLocaleString()}원` : '0원'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      총 참가비
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 점수 통계 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="점수 통계" />
            <CardContent>
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Score sx={{ mr: 2, color: 'info.main' }} />
                  <Box>
                    <Typography variant="h4">
                      {stats.average_score || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      평균 점수
                    </Typography>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    최고 점수
                  </Typography>
                  <Typography variant="h6">
                    {stats.highest_score || 0}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    최저 점수
                  </Typography>
                  <Typography variant="h6">
                    {stats.lowest_score || 0}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 참가자 목록 */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="참가자 상세" />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>닉네임</TableCell>
                      <TableCell>역할</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>점수</TableCell>
                      <TableCell>참가비</TableCell>
                      <TableCell>참가일</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.participants?.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>{participant.user.nickname}</TableCell>
                        <TableCell>{getParticipantRoleLabel(participant.role)}</TableCell>
                        <TableCell>{getParticipantStatusLabel(participant.status)}</TableCell>
                        <TableCell>
                          {participant.score || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {participant.fee_paid ? `${participant.fee_paid.toLocaleString()}원` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {new Date(participant.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MeetingStatsPage;
