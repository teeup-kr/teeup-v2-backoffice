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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { meetingsApi } from '../../lib/api/meetings';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';
import { MdArrowBack as ArrowLeft, MdAdd, MdEdit, MdDelete, MdGroup, MdTrendingUp as TrendingUpIcon, MdPeople as PeopleIcon } from 'react-icons/md';

const TeamManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
  });

  // 모임 팀 조회
  const {
    data: teams,
    isLoading: teamsLoading,
    error: teamsError
  } = useQuery({
    queryKey: ['admin-meeting-teams', id],
    queryFn: () => meetingsApi.getMeetingTeams(id),
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

  // 팀 생성/수정 mutation
  const saveTeamMutation = useMutation({
    mutationFn: (data) => {
      if (editingTeam) {
        return meetingsApi.updateTeam(id, editingTeam.id, data);
      } else {
        return meetingsApi.createTeam(id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-teams', id] });
      setShowTeamDialog(false);
      setEditingTeam(null);
      setTeamForm({ name: '', description: '' });
    },
    onError: (error) => {
      console.error('팀 처리 실패:', error);
    }
  });

  // 팀 삭제 mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (teamId) => meetingsApi.deleteTeam(id, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-teams', id] });
    },
    onError: (error) => {
      console.error('팀 삭제 실패:', error);
    }
  });

  const handleAddTeam = () => {
    setEditingTeam(null);
    setTeamForm({ name: '', description: '' });
    setShowTeamDialog(true);
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description,
    });
    setShowTeamDialog(true);
  };

  const handleDeleteTeam = (teamId) => {
    if (window.confirm('이 팀을 삭제하시겠습니까?')) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  const handleSaveTeam = () => {
    saveTeamMutation.mutate(teamForm);
  };

  if (teamsLoading || meetingLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (teamsError || !teams) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          팀 정보를 불러올 수 없습니다.
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => navigate(`/meetings/${id}`)}
            style={{ marginRight: 16 }}
          >
            돌아가기
          </Button>
          <Typography variant="h4">
            {meeting?.name} 팀 관리
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddTeam}
        >
          팀 생성
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* 팀 요약 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="팀 요약" />
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Group sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4">
                      {teams?.teams?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      총 팀 수
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 팀 목록 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="팀 목록" />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>팀명</TableCell>
                      <TableCell>설명</TableCell>
                      <TableCell>멤버 수</TableCell>
                      <TableCell>액션</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teams?.teams?.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell>{team.name}</TableCell>
                        <TableCell>{team.description || 'N/A'}</TableCell>
                        <TableCell>{team.members?.length || 0}명</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              startIcon={<Edit />}
                              onClick={() => handleEditTeam(team)}
                            >
                              수정
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => handleDeleteTeam(team.id)}
                            >
                              삭제
                            </Button>
                          </Stack>
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

      {/* 팀 생성/수정 다이얼로그 */}
      <Dialog
        open={showTeamDialog}
        onClose={() => setShowTeamDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTeam ? '팀 수정' : '팀 생성'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="팀명"
              value={teamForm.name}
              onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="설명"
              value={teamForm.description}
              onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTeamDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleSaveTeam}
            variant="contained"
            disabled={saveTeamMutation.isPending}
          >
            {saveTeamMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamManagementPage;
