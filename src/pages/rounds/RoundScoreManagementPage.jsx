import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Stack
} from '@mui/material';
import { MdArrowBack as ArrowLeft, MdSave as SaveIcon } from 'react-icons/md';
import { meetingsApi } from '../../lib/api/meetings';
import { adminRoundsApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import { useSnackbar } from '../../contexts/SnackbarContext';

const RoundScoreManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [editingScores, setEditingScores] = useState({});

  const { data: round, isLoading: roundLoading, error: roundError } = useQuery({
    queryKey: ['admin-round', id],
    queryFn: () => adminRoundsApi.getRound(id),
    enabled: !!id,
  });

  const { data: participantsData, isLoading: participantsLoading } = useQuery({
    queryKey: ['admin-round-participants', id],
    queryFn: () => adminRoundsApi.getRoundParticipants(id),
    enabled: !!id && !!round,
  });

  const { data: scoresData, isLoading: scoresLoading } = useQuery({
    queryKey: ['admin-round-scores', id],
    queryFn: () => meetingsApi.getMeetingScores(id),
    enabled: !!id && !!round,
  });

  const updateScoreMutation = useMutation({
    mutationFn: ({ participantId, data }) => meetingsApi.updateScore(id, participantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-round-scores', id] });
      setEditingScores({});
      showSnackbar('점수가 저장되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || '저장 실패', 'error'),
  });

  const participants = Array.isArray(participantsData) ? participantsData : participantsData?.data ?? [];
  const scoresMap = (() => {
    const raw = scoresData?.data ?? scoresData ?? {};
    if (Array.isArray(raw)) return Object.fromEntries(raw.map((s) => [s.participant_id ?? s.participantId, s]));
    if (raw.scores) return Object.fromEntries((raw.scores || []).map((s) => [s.participant_id ?? s.participantId, s]));
    if (raw.participants) return Object.fromEntries((raw.participants || []).map((p) => [p.id ?? p.participant_id, p]));
    return raw;
  })();

  const getDisplayName = (p) => {
    if (p.is_guest) return p.guest_name || '게스트';
    return p.user_name ?? p.user_nickname ?? p.nickname ?? '-';
  };

  const handleScoreChange = (participantId, value) => {
    setEditingScores((prev) => ({ ...prev, [participantId]: value }));
  };

  const handleSaveScore = (participantId) => {
    const value = editingScores[participantId];
    if (value === undefined) return;
    const num = Number(value);
    updateScoreMutation.mutate(
      { participantId, data: { score: num } },
      { onSettled: () => setEditingScores((p) => ({ ...p, [participantId]: undefined })) }
    );
  };

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
        <Button onClick={() => navigate('/rounds')} sx={{ mt: 2 }}>라운딩 목록으로</Button>
      </Box>
    );
  }

  const roundData = round.data || round;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/rounds/${id}`)} sx={{ mr: 2 }}>
          돌아가기
        </Button>
        <Typography variant="h4">점수 관리</Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {roundData.name}
      </Typography>

      <MainCard>
        {participantsLoading || scoresLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>참가자</TableCell>
                  <TableCell>역할</TableCell>
                  <TableCell align="right" width={180}>점수</TableCell>
                  <TableCell align="center" width={100}>저장</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      참가자가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  participants.map((p) => {
                    const pid = p.id ?? p.participant_id;
                    const scoreInfo = scoresMap[pid];
                    const currentScore = scoreInfo?.score ?? scoreInfo?.total_score ?? '';
                    const editValue = editingScores[pid] !== undefined ? editingScores[pid] : currentScore;
                    return (
                      <TableRow key={pid}>
                        <TableCell>{getDisplayName(p)}</TableCell>
                        <TableCell>{p.role === 'ORGANIZER' ? '개설자' : '참가자'}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={editValue}
                            onChange={(e) => handleScoreChange(pid, e.target.value)}
                            inputProps={{ min: 0, step: 1 }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleSaveScore(pid)}
                            disabled={updateScoreMutation.isPending || editingScores[pid] === undefined}
                          >
                            <SaveIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </MainCard>
    </Box>
  );
};

export default RoundScoreManagementPage;
