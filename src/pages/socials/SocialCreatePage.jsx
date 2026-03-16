import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Divider
} from '@mui/material';
import { meetingsApi } from '../../lib/api/meetings';
import { clubsApi } from '../../lib/api/clubs';
import MainCard from '../../components/MainCard';
import { MdArrowBack as ArrowLeft, MdSave as SaveIcon } from 'react-icons/md';

const SocialCreatePage = () => {
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
    club_id: '',
    venue_name: '',
  });

  const [errors, setErrors] = useState({});

  const { data: clubsResponse } = useQuery({
    queryKey: ['admin-clubs-list'],
    queryFn: () => clubsApi.getClubs({ limit: 200 }),
  });
  const clubsList = Array.isArray(clubsResponse?.data) ? clubsResponse.data : (Array.isArray(clubsResponse) ? clubsResponse : []);

  const createMutation = useMutation({
    mutationFn: (data) => meetingsApi.createEventMeeting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-socials'] });
      navigate('/socials', { state: { message: '소셜 모임이 성공적으로 생성되었습니다.' } });
    },
    onError: (error) => {
      setErrors({ general: error.response?.data?.message || '소셜 모임 생성에 실패했습니다.' });
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
    if (!formData.venue_name?.trim()) newErrors.venue_name = '장소명을 입력해주세요.';
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
    createMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim(),
      meeting_time: meetingTime,
      location: formData.location?.trim() || undefined,
      fee: Number(formData.fee) || 0,
      max_participants: Number(formData.max_participants) || 0,
      additional_info: formData.additional_info?.trim() || undefined,
      club_id: formData.club_id || undefined,
      venue_name: formData.venue_name.trim(),
    });
  };

  return (
    <Box sx={{ py: 3, px: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate('/socials')} sx={{ mr: 2 }}>
          돌아가기
        </Button>
        <Typography variant="h4">소셜 모임 생성</Typography>
      </Box>

      {errors.general && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.general}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <MainCard title="소셜 모임 기본 정보">
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
                  label="장소명 *"
                  value={formData.venue_name}
                  onChange={handleInputChange('venue_name')}
                  error={!!errors.venue_name}
                  helperText={errors.venue_name}
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
                <TextField fullWidth label="장소 (상세)" value={formData.location} onChange={handleInputChange('location')} />
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
            </MainCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <MainCard title="안내">
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  소셜 모임 생성 후 상세에서 참가자·정산을 관리할 수 있습니다.
                </Typography>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  소셜 모임은 참가비·정산 방식이 라운딩과 다르게 적용됩니다.
                </Typography>
              </Stack>
            </MainCard>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/socials')}>
            취소
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={createMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? '생성 중...' : '소셜 모임 생성'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default SocialCreatePage;
