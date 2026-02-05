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
  Card,
  CardContent,
  Divider,
  Stack
} from '@mui/material';
import { MdArrowBack as ArrowLeft, MdPeople as PeopleIcon, MdGroup as TeamIcon, MdTrendingUp as StatsIcon } from 'react-icons/md';
import { meetingsApi } from '../../lib/api/meetings';
import { adminRoundsApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';

const RoundStatsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: round, isLoading: roundLoading, error: roundError } = useQuery({
    queryKey: ['admin-round', id],
    queryFn: () => adminRoundsApi.getRound(id),
    enabled: !!id,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-round-stats', id],
    queryFn: () => meetingsApi.getMeetingStats(id),
    enabled: !!id && !!round,
  });

  const { data: participantsData } = useQuery({
    queryKey: ['admin-round-participants', id],
    queryFn: () => adminRoundsApi.getRoundParticipants(id),
    enabled: !!id && !!round,
  });

  const { data: teamsData } = useQuery({
    queryKey: ['admin-round-teams', id],
    queryFn: () => adminRoundsApi.getRoundTeams(id),
    enabled: !!id && !!round,
  });

  if (roundLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (roundError || !round) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">라운딩 정보를 불러올 수 없습니다.</Alert>
        <Button onClick={() => navigate('/rounds')} sx={{ mt: 2 }}>
          라운딩 목록으로
        </Button>
      </Box>
    );
  }

  const roundData = round.data || round;
  const stats = statsData?.data ?? statsData ?? {};
  const participants = Array.isArray(participantsData) ? participantsData : participantsData?.data ?? [];
  const teams = Array.isArray(teamsData) ? teamsData : teamsData?.data ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/rounds/${id}`)} sx={{ mr: 2 }}>
          돌아가기
        </Button>
        <Typography variant="h4">라운딩 통계</Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {roundData.name}
      </Typography>

      {statsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MainCard>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PeopleIcon size={32} />
                <Box>
                  <Typography variant="body2" color="text.secondary">참가자 수</Typography>
                  <Typography variant="h4">{participants.length}</Typography>
                </Box>
              </Stack>
            </MainCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MainCard>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TeamIcon size={32} />
                <Box>
                  <Typography variant="body2" color="text.secondary">팀 수</Typography>
                  <Typography variant="h4">{teams.length}</Typography>
                </Box>
              </Stack>
            </MainCard>
          </Grid>
          {stats.participant_count != null && (
            <Grid item xs={12} sm={6} md={3}>
              <MainCard>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <StatsIcon size={32} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">통계 참가자</Typography>
                    <Typography variant="h4">{stats.participant_count}</Typography>
                  </Box>
                </Stack>
              </MainCard>
            </Grid>
          )}
          {stats.total_score != null && (
            <Grid item xs={12} sm={6} md={3}>
              <MainCard>
                <Box>
                  <Typography variant="body2" color="text.secondary">총 점수</Typography>
                  <Typography variant="h4">{stats.total_score}</Typography>
                </Box>
              </MainCard>
            </Grid>
          )}

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>통계 요약</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">최대 참가자</Typography>
                    <Typography variant="body1">{roundData.max_participants ?? '-'}명</Typography>
                  </Grid>
                  {Object.entries(stats).map(([key, value]) => (
                    typeof value === 'number' || typeof value === 'string' ? (
                      <Grid item xs={12} sm={6} key={key}>
                        <Typography variant="body2" color="text.secondary">{key}</Typography>
                        <Typography variant="body1">{String(value)}</Typography>
                      </Grid>
                    ) : null
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default RoundStatsPage;
