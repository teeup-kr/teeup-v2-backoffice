import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardHeader,
  CardContent,
  Divider
} from '@mui/material';
import { meetingsApi } from '../../lib/api/meetings';
import { clubsApi } from '../../lib/api/clubs';
import { MdArrowBack as ArrowLeft, MdSave as SaveIcon } from 'react-icons/md';

const getStatusLabel = (status) => {
  switch (status) {
    case 'SCHEDULED': return '예정';
    case 'IN_PROGRESS': return '진행중';
    case 'COMPLETED': return '완료';
    case 'CANCELED': return '취소';
    default: return status || '알 수 없음';
  }
};

const RoundEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meeting_date: '',
    meeting_time: '',
    location: '',
    fee: 0,
    max_participants: 0,
    additional_info: '',
    status: 'SCHEDULED',
    club_id: '',
    course_name: '',
  });

  const [errors, setErrors] = useState({});

  const { data: meeting, isLoading: meetingLoading, error: meetingError } = useQuery({
    queryKey: ['admin-round', id],
    queryFn: () => meetingsApi.getMeeting(id),
    enabled: !!id,
  });

  const { data: clubsResponse } = useQuery({
    queryKey: ['admin-clubs-list'],
    queryFn: () => clubsApi.getClubs({ limit: 200 }),
  });
  const clubsList = Array.isArray(clubsResponse?.data) ? clubsResponse.data : (Array.isArray(clubsResponse) ? clubsResponse : []);

  useEffect(() => {
    if (meeting) {
      const raw = meeting.data || meeting;
      const mt = raw.meeting_time;
      let datePart = '';
      let timePart = '';
      if (mt) {
        try {
          const d = new Date(mt);
          datePart = d.toISOString().slice(0, 10);
          timePart = d.toTimeString().slice(0, 5);
        } catch (_) {
          if (typeof mt === 'string' && mt.includes('T')) {
            const [d, t] = mt.split('T');
            datePart = d;
            timePart = (t || '').slice(0, 5);
          }
        }
      }
      setFormData({
        name: raw.name || '',
        description: raw.description || '',
        meeting_date: datePart,
        meeting_time: timePart,
        location: raw.location || '',
        fee: raw.fee ?? 0,
        max_participants: raw.max_participants ?? 0,
        additional_info: raw.additional_info || '',
        status: raw.status || 'SCHEDULED',
        club_id: raw.club_id || '',
        course_name: raw.course_name || '',
      });
    }
  }, [meeting]);

  const updateMutation = useMutation({
    mutationFn: (data) => meetingsApi.updateMeeting(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rounds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-round', id] });
      navigate(`/rounds/${id}`, { state: { message: '라운딩 정보가 수정되었습니다.' } });
    },
    onError: (error) => {
      setErrors({ general: error.response?.data?.message || '라운딩 수정에 실패했습니다.' });
    },
  });

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = '모임명을 입력해주세요.';
    if (!formData.description?.trim()) newErrors.description = '모임 설명을 입력해주세요.';
    if (!formData.meeting_date) newErrors.meeting_date = '모임 날짜를 선택해주세요.';
    if (!formData.meeting_time) newErrors.meeting_time = '모임 시간을 입력해주세요.';
    if (Number(formData.max_participants) <= 0) newErrors.max_participants = '최대 참가자 수는 1명 이상이어야 합니다.';
    if (!formData.course_name?.trim()) newErrors.course_name = '골프장명을 입력해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getMeetingTimeISO = () => {
    const { meeting_date, meeting_time } = formData;
    if (!meeting_date || !meeting_time) return '';
    return `${meeting_date}T${meeting_time}:00`;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    const meetingTime = getMeetingTimeISO();
    updateMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim(),
      meeting_time: meetingTime,
      location: formData.location?.trim() || undefined,
      fee: Number(formData.fee) || 0,
      max_participants: Number(formData.max_participants) || 0,
      additional_info: formData.additional_info?.trim() || undefined,
      status: formData.status,
      club_id: formData.club_id || undefined,
      course_name: formData.course_name.trim(),
    });
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
        <Alert severity="error">라운딩 정보를 불러올 수 없습니다.</Alert>
        <Button onClick={() => navigate('/rounds')} sx={{ mt: 2 }}>
          라운딩 목록으로
        </Button>
      </Box>
    );
  }

  const raw = meeting.data || meeting;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/rounds/${id}`)} sx={{ mr: 2 }}>
          돌아가기
        </Button>
        <Typography variant="h4">라운딩 수정</Typography>
        <Chip label={getStatusLabel(formData.status)} sx={{ ml: 2 }} />
      </Box>

      {errors.general && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.general}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="기본 정보" />
              <CardContent>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="모임명 *"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                  />
                  <TextField
                    fullWidth
                    label="모임 설명 *"
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description}
                    required
                  />
                  <TextField
                    fullWidth
                    label="골프장명 *"
                    value={formData.course_name}
                    onChange={handleInputChange('course_name')}
                    error={!!errors.course_name}
                    helperText={errors.course_name}
                    required
                  />
                  <FormControl fullWidth>
                    <InputLabel>클럽 (선택)</InputLabel>
                    <Select value={formData.club_id} onChange={handleInputChange('club_id')} label="클럽 (선택)">
                      <MenuItem value="">선택 안 함</MenuItem>
                      {clubsList.map((club) => (
                        <MenuItem key={club.id} value={club.id}>
                          {club.name ?? club.display_id}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="모임 날짜 *"
                        type="date"
                        value={formData.meeting_date}
                        onChange={handleInputChange('meeting_date')}
                        error={!!errors.meeting_date}
                        helperText={errors.meeting_date}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="모임 시간 *"
                        type="time"
                        value={formData.meeting_time}
                        onChange={handleInputChange('meeting_time')}
                        error={!!errors.meeting_time}
                        helperText={errors.meeting_time}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                  </Grid>
                  <TextField fullWidth label="장소" value={formData.location} onChange={handleInputChange('location')} />
                  <TextField
                    fullWidth
                    label="최대 참가자 수 *"
                    type="number"
                    value={formData.max_participants}
                    onChange={handleInputChange('max_participants')}
                    error={!!errors.max_participants}
                    helperText={errors.max_participants}
                    inputProps={{ min: 1 }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="참가비 (원)"
                    type="number"
                    value={formData.fee}
                    onChange={handleInputChange('fee')}
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    fullWidth
                    label="추가 정보"
                    value={formData.additional_info}
                    onChange={handleInputChange('additional_info')}
                    multiline
                    rows={3}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="상태" />
              <CardContent>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>라운딩 상태</InputLabel>
                    <Select value={formData.status} onChange={handleInputChange('status')} label="라운딩 상태">
                      <MenuItem value="SCHEDULED">예정</MenuItem>
                      <MenuItem value="IN_PROGRESS">진행중</MenuItem>
                      <MenuItem value="COMPLETED">완료</MenuItem>
                      <MenuItem value="CANCELED">취소</MenuItem>
                    </Select>
                  </FormControl>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    생성일: {raw.created_at ? new Date(raw.created_at).toLocaleString('ko-KR') : '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    수정일: {raw.updated_at ? new Date(raw.updated_at).toLocaleString('ko-KR') : '-'}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate(`/rounds/${id}`)}>
            취소
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={updateMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? '수정 중...' : '저장'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default RoundEditPage;
