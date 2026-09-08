import React, { useState, useEffect, useMemo } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Stack,
  Divider
} from '@mui/material';
import {
  MdArrowBack as ArrowLeft,
  MdSave as SaveIcon,
  MdList as ListIcon,
  MdDelete as DeleteIcon,
  MdAdd as AddIcon
} from 'react-icons/md';
import { adminRoundsApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import { useSnackbar } from '../../contexts/SnackbarContext';

const formatApiError = (err) => {
  const d = err?.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join(', ');
  return err?.message || '요청 실패';
};

const RoundScoreManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [editingScores, setEditingScores] = useState({});
  const [holeDialog, setHoleDialog] = useState({ open: false, participantId: null, name: '' });
  const [drafts, setDrafts] = useState({});
  const [newHole, setNewHole] = useState({ hole_number: 1, par: 4, strokes: 4 });

  const { data: round, isLoading: roundLoading, error: roundError } = useQuery({
    queryKey: ['admin-round', id],
    queryFn: () => adminRoundsApi.getRound(id),
    enabled: !!id
  });

  const { data: participantsData, isLoading: participantsLoading } = useQuery({
    queryKey: ['admin-round-participants', id],
    queryFn: () => adminRoundsApi.getRoundParticipants(id),
    enabled: !!id && !!round
  });

  const { data: scoresData, isLoading: scoresLoading } = useQuery({
    queryKey: ['admin-round-scores', id],
    queryFn: () => adminRoundsApi.getRoundScores(id),
    enabled: !!id && !!round
  });

  const {
    data: holeScoresData,
    isLoading: holeScoresLoading,
    refetch: refetchHoleScores
  } = useQuery({
    queryKey: ['admin-hole-scores', id, holeDialog.participantId],
    queryFn: () => adminRoundsApi.getParticipantHoleScores(id, holeDialog.participantId),
    enabled: !!id && !!holeDialog.open && holeDialog.participantId != null
  });

  const holeList = useMemo(() => holeScoresData?.scores ?? [], [holeScoresData]);

  useEffect(() => {
    if (!holeDialog.open) return;
    if (holeScoresLoading) return;
    if (!holeList.length) {
      setDrafts({});
      return;
    }
    const next = {};
    for (const s of holeList) {
      next[s.id] = {
        hole_number: s.hole_number,
        par: s.par,
        strokes: s.strokes
      };
    }
    setDrafts(next);
  }, [holeDialog.open, holeScoresLoading, holeList]);

  const usedHoleNumbers = useMemo(() => new Set(holeList.map((s) => s.hole_number)), [holeList]);
  const sumStrokes = useMemo(() => holeList.reduce((a, s) => a + (s.strokes || 0), 0), [holeList]);

  const firstAvailableHole = useMemo(() => {
    for (let h = 1; h <= 18; h += 1) {
      if (!usedHoleNumbers.has(h)) return h;
    }
    return 1;
  }, [usedHoleNumbers]);

  useEffect(() => {
    if (holeDialog.open) {
      setNewHole((prev) => ({
        ...prev,
        hole_number: firstAvailableHole,
        par: 4,
        strokes: prev.strokes || 4
      }));
    }
  }, [holeDialog.open, firstAvailableHole]);

  const updateScoreMutation = useMutation({
    mutationFn: ({ participantId, data }) => adminRoundsApi.updateRoundParticipantScore(id, participantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-round-scores', id] });
      setEditingScores({});
      showSnackbar('점수가 저장되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(formatApiError(err), 'error')
  });

  const createHoleMutation = useMutation({
    mutationFn: ({ participantId, data }) => adminRoundsApi.createParticipantHoleScore(id, participantId, data),
    onSuccess: async () => {
      await refetchHoleScores();
      queryClient.invalidateQueries({ queryKey: ['admin-round-scores', id] });
      showSnackbar('홀 스코어가 추가되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(formatApiError(err), 'error')
  });

  const updateHoleMutation = useMutation({
    mutationFn: ({ participantId, scoreId, data }) =>
      adminRoundsApi.updateParticipantHoleScore(id, participantId, scoreId, data),
    onSuccess: async () => {
      await refetchHoleScores();
      queryClient.invalidateQueries({ queryKey: ['admin-round-scores', id] });
      showSnackbar('홀 스코어가 저장되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(formatApiError(err), 'error')
  });

  const deleteHoleMutation = useMutation({
    mutationFn: ({ participantId, scoreId }) =>
      adminRoundsApi.deleteParticipantHoleScore(id, participantId, scoreId),
    onSuccess: async () => {
      await refetchHoleScores();
      queryClient.invalidateQueries({ queryKey: ['admin-round-scores', id] });
      showSnackbar('홀 스코어가 삭제되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(formatApiError(err), 'error')
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
    if (p.is_guest) return p.guest_name || p.name || '게스트';
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

  const openHoleDialog = (p) => {
    const pid = p.id ?? p.participant_id;
    setHoleDialog({ open: true, participantId: pid, name: getDisplayName(p) });
  };

  const closeHoleDialog = () => {
    setHoleDialog({ open: false, participantId: null, name: '' });
    setDrafts({});
  };

  const setDraft = (scoreId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [scoreId]: { ...prev[scoreId], [field]: value }
    }));
  };

  const saveHoleRow = (scoreId, originalHoleNumber) => {
    const d = drafts[scoreId];
    if (!d) return;
    const par = Number(d.par);
    const strokes = Number(d.strokes);
    const holeNum = Number(d.hole_number);
    if (Number.isNaN(par) || Number.isNaN(strokes) || Number.isNaN(holeNum)) {
      showSnackbar('홀·파·타수를 숫자로 입력해 주세요.', 'error');
      return;
    }
    const payload = {
      hole_number: holeNum,
      par,
      strokes,
      score_to_par: strokes - par
    };
    if (holeNum !== originalHoleNumber) {
      payload.hole_number = holeNum;
    }
    updateHoleMutation.mutate({
      participantId: holeDialog.participantId,
      scoreId,
      data: payload
    });
  };

  const handleAddHole = () => {
    const hn = Number(newHole.hole_number);
    const par = Number(newHole.par);
    const strokes = Number(newHole.strokes);
    if (usedHoleNumbers.has(hn)) {
      showSnackbar(`홀 ${hn}번은 이미 있습니다.`, 'error');
      return;
    }
    if (Number.isNaN(hn) || Number.isNaN(par) || Number.isNaN(strokes)) {
      showSnackbar('홀·파·타수를 확인해 주세요.', 'error');
      return;
    }
    createHoleMutation.mutate({
      participantId: holeDialog.participantId,
      data: {
        hole_number: hn,
        par,
        strokes,
        score_to_par: strokes - par
      }
    });
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
      <Box sx={{ py: 3, px: 0 }}>
        <Alert severity="error">라운딩 정보를 불러올 수 없습니다.</Alert>
        <Button onClick={() => navigate('/rounds')} sx={{ mt: 2 }}>
          라운딩 목록으로
        </Button>
      </Box>
    );
  }

  const roundData = round.data || round;
  const holeMutating =
    createHoleMutation.isPending || updateHoleMutation.isPending || deleteHoleMutation.isPending;

  return (
    <Box sx={{ py: 3, px: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/rounds/${id}`)} sx={{ mr: 2 }}>
          돌아가기
        </Button>
        <Typography variant="h4">점수 관리</Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {roundData.name}
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>총타(간편)</strong>는 회원만 저장할 수 있으며(게스트 불가), <strong>홀별 상세</strong>는 참가자별 홀 단위
        타수·파를 등록·수정·삭제할 수 있습니다.
      </Alert>

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
                  <TableCell align="right" width={180}>
                    총타(간편)
                  </TableCell>
                  <TableCell align="center" width={100}>
                    저장
                  </TableCell>
                  <TableCell align="center" width={140}>
                    홀별 상세
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      참가자가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  participants.map((p) => {
                    const pid = p.id ?? p.participant_id;
                    const scoreInfo = scoresMap[pid];
                    const currentScore = scoreInfo?.score ?? scoreInfo?.total_score ?? '';
                    const editValue = editingScores[pid] !== undefined ? editingScores[pid] : currentScore;
                    const grossDisabled = p.is_guest;
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
                            inputProps={{ min: 55, max: 144, step: 1 }}
                            sx={{ width: 120 }}
                            disabled={grossDisabled}
                            placeholder={grossDisabled ? '—' : ''}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleSaveScore(pid)}
                            disabled={
                              grossDisabled || updateScoreMutation.isPending || editingScores[pid] === undefined
                            }
                          >
                            <SaveIcon />
                          </IconButton>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ListIcon />}
                            onClick={() => openHoleDialog(p)}
                          >
                            홀별
                          </Button>
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

      <Dialog open={holeDialog.open} onClose={closeHoleDialog} maxWidth="md" fullWidth>
        <DialogTitle>홀별 스코어 — {holeDialog.name}</DialogTitle>
        <DialogContent dividers>
          {holeScoresLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                등록된 홀 합산 타수: <strong>{sumStrokes}</strong>타 ({holeList.length}홀)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={72}>홀</TableCell>
                      <TableCell width={88}>Par</TableCell>
                      <TableCell width={88}>타수</TableCell>
                      <TableCell width={72}>대파</TableCell>
                      <TableCell align="center">저장</TableCell>
                      <TableCell align="center">삭제</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {holeList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          등록된 홀 스코어가 없습니다. 아래에서 추가하세요.
                        </TableCell>
                      </TableRow>
                    ) : (
                      holeList.map((row) => {
                        const d = drafts[row.id] ?? {
                          hole_number: row.hole_number,
                          par: row.par,
                          strokes: row.strokes
                        };
                        const toPar = Number(d.strokes) - Number(d.par);
                        return (
                          <TableRow key={row.id}>
                            <TableCell>
                              <TextField
                                select
                                size="small"
                                value={d.hole_number}
                                onChange={(e) => setDraft(row.id, 'hole_number', Number(e.target.value))}
                                sx={{ minWidth: 64 }}
                              >
                                {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => (
                                  <MenuItem
                                    key={h}
                                    value={h}
                                    disabled={holeList.some((o) => o.id !== row.id && o.hole_number === h)}
                                  >
                                    {h}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={d.par}
                                onChange={(e) => setDraft(row.id, 'par', e.target.value)}
                                inputProps={{ min: 3, max: 6 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={d.strokes}
                                onChange={(e) => setDraft(row.id, 'strokes', e.target.value)}
                                inputProps={{ min: 1, max: 20 }}
                              />
                            </TableCell>
                            <TableCell>{Number.isNaN(toPar) ? '—' : (toPar > 0 ? `+${toPar}` : `${toPar}`)}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => saveHoleRow(row.id, row.hole_number)}
                                disabled={holeMutating}
                              >
                                <SaveIcon />
                              </IconButton>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  deleteHoleMutation.mutate({
                                    participantId: holeDialog.participantId,
                                    scoreId: row.id
                                  })
                                }
                                disabled={holeMutating}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider />

              <Typography variant="subtitle2">홀 추가</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <TextField
                  select
                  size="small"
                  label="홀"
                  value={newHole.hole_number}
                  onChange={(e) => setNewHole((prev) => ({ ...prev, hole_number: Number(e.target.value) }))}
                  sx={{ width: 100 }}
                >
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => (
                    <MenuItem key={h} value={h} disabled={usedHoleNumbers.has(h)}>
                      {h}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  type="number"
                  size="small"
                  label="Par"
                  value={newHole.par}
                  onChange={(e) => setNewHole((prev) => ({ ...prev, par: e.target.value }))}
                  inputProps={{ min: 3, max: 6 }}
                  sx={{ width: 100 }}
                />
                <TextField
                  type="number"
                  size="small"
                  label="타수"
                  value={newHole.strokes}
                  onChange={(e) => setNewHole((prev) => ({ ...prev, strokes: e.target.value }))}
                  inputProps={{ min: 1, max: 20 }}
                  sx={{ width: 100 }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddHole}
                  disabled={holeMutating || usedHoleNumbers.size >= 18}
                >
                  추가
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeHoleDialog}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoundScoreManagementPage;
