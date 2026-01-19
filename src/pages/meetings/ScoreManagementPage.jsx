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
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { meetingsApi } from '../../lib/api/meetings';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';
import { MdArrowBack as ArrowLeft, MdEdit, MdScore, MdTrendingUp as TrendingUpIcon, MdEmojiEvents as TrophyIcon } from 'react-icons/md';

const ScoreManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [scoreForm, setScoreForm] = useState({
    score: 0,
    notes: '',
  });

  // 모임 점수 조회
  const {
    data: scores,
    isLoading: scoresLoading,
    error: scoresError
  } = useQuery({
    queryKey: ['admin-meeting-scores', id],
    queryFn: () => meetingsApi.getMeetingScores(id),
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

  // 점수 업데이트 mutation
  const updateScoreMutation = useMutation({
    mutationFn: ({ participantId, data }) => meetingsApi.updateScore(id, participantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-scores', id] });
      setShowScoreDialog(false);
      setEditingScore(null);
      setScoreForm({ score: 0, notes: '' });
    },
    onError: (error) => {
      console.error('점수 업데이트 실패:', error);
    }
  });

  const handleEditScore = (participant) => {
    setEditingScore(participant);
    setScoreForm({
      score: participant.score || 0,
      notes: participant.score_notes || '',
    });
    setShowScoreDialog(true);
  };

  const handleSaveScore = () => {
    updateScoreMutation.mutate({
      participantId: editingScore.id,
      data: scoreForm,
    });
  };

  const averageScore = scores?.scores?.length > 0 
    ? scores.scores.reduce((sum, score) => sum + (score.score || 0), 0) / scores.scores.length 
    : 0;

  if (scoresLoading || meetingLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (scoresError || !scores) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          점수 정보를 불러올 수 없습니다.
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
          {meeting?.name} 점수 관리
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 점수 요약 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="점수 요약" />
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Score sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4">
                      {averageScore.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      평균 점수
                    </Typography>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    점수 입력 완료
                  </Typography>
                  <Typography variant="h6">
                    {scores?.scores?.filter(s => s.score).length || 0} / {scores?.scores?.length || 0}명
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 점수 목록 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="참가자 점수" />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>참가자</TableCell>
                      <TableCell>점수</TableCell>
                      <TableCell>비고</TableCell>
                      <TableCell>액션</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scores?.scores?.map((score) => (
                      <TableRow key={score.id}>
                        <TableCell>{score.user.nickname}</TableCell>
                        <TableCell>
                          {score.score ? `${score.score}점` : '미입력'}
                        </TableCell>
                        <TableCell>{score.score_notes || 'N/A'}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => handleEditScore(score)}
                          >
                            {score.score ? '수정' : '입력'}
                          </Button>
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

      {/* 점수 입력/수정 다이얼로그 */}
      <Dialog
        open={showScoreDialog}
        onClose={() => setShowScoreDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingScore?.score ? '점수 수정' : '점수 입력'} - {editingScore?.user?.nickname}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="점수"
              type="number"
              value={scoreForm.score}
              onChange={(e) => setScoreForm(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
              required
            />
            <TextField
              fullWidth
              label="비고"
              value={scoreForm.notes}
              onChange={(e) => setScoreForm(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScoreDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleSaveScore}
            variant="contained"
            disabled={updateScoreMutation.isPending}
          >
            {updateScoreMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScoreManagementPage;
