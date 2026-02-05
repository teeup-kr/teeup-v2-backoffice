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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack
} from '@mui/material';
import { MdArrowBack as ArrowLeft, MdAdd as PlusIcon, MdEdit as EditIcon, MdDelete as DeleteIcon } from 'react-icons/md';
import { meetingsApi } from '../../lib/api/meetings';
import { adminRoundsApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import { useSnackbar } from '../../contexts/SnackbarContext';

const RoundTeamManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: round, isLoading: roundLoading, error: roundError } = useQuery({
    queryKey: ['admin-round', id],
    queryFn: () => adminRoundsApi.getRound(id),
    enabled: !!id,
  });

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['admin-round-teams', id],
    queryFn: () => meetingsApi.getMeetingTeams(id),
    enabled: !!id && !!round,
  });

  const createMutation = useMutation({
    mutationFn: (data) => meetingsApi.createTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-round-teams', id] });
      setDialogOpen(false);
      setTeamName('');
      showSnackbar('팀이 추가되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || err.response?.data?.detail || '추가 실패', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => meetingsApi.updateTeam(id, editingTeam.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-round-teams', id] });
      setDialogOpen(false);
      setEditingTeam(null);
      setTeamName('');
      showSnackbar('팀이 수정되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || '수정 실패', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (teamId) => meetingsApi.deleteTeam(id, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-round-teams', id] });
      setDeleteTarget(null);
      showSnackbar('팀이 삭제되었습니다.', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || '삭제 실패', 'error'),
  });

  const teams = Array.isArray(teamsData) ? teamsData : teamsData?.data ?? teamsData?.teams ?? [];

  const handleOpenAdd = () => {
    setEditingTeam(null);
    setTeamName('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (team) => {
    setEditingTeam(team);
    setTeamName(team.name ?? `팀 ${team.id}`);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = { name: teamName.trim() || undefined };
    if (editingTeam) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const getMemberNames = (team) => {
    const members = team.members ?? team.participants ?? [];
    return members.map((m) => m.user_name ?? m.user_nickname ?? m.nickname ?? '-').join(', ') || '-';
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/rounds/${id}`)} sx={{ mr: 2 }}>
          돌아가기
        </Button>
        <Typography variant="h4">팀 관리</Typography>
        <Button variant="contained" startIcon={<PlusIcon />} onClick={handleOpenAdd}>
          팀 추가
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {roundData.name}
      </Typography>

      <MainCard>
        {teamsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>팀명</TableCell>
                  <TableCell>멤버</TableCell>
                  <TableCell align="center" width={120}>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      등록된 팀이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>{team.name ?? `팀 ${team.id}`}</TableCell>
                      <TableCell>{getMemberNames(team)}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpenEdit(team)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(team)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </MainCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTeam ? '팀 수정' : '팀 추가'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="팀명"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="예: A팀, 1조"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending || !teamName.trim()}
          >
            {editingTeam ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="팀 삭제"
        message="이 팀을 삭제하시겠습니까?"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
};

export default RoundTeamManagementPage;
