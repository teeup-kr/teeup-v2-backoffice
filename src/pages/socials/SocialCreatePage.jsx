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
  Divider,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { meetingsApi } from '../../lib/api/meetings';
import { clubsApi } from '../../lib/api/clubs';
import MainCard from '../../components/MainCard';
import { MdArrowBack as ArrowLeft, MdSave as SaveIcon } from 'react-icons/md';

/** 앱 meetingConstants와 동일 */
const SOCIAL_TYPE_OPTIONS = [
  { id: 'CASUAL', label: '친목' },
  { id: 'DINNER', label: '식사' },
  { id: 'EVENT', label: '행사' }
];

const SOCIAL_SETTLEMENT_METHODS = [
  { id: 'EQUAL_SPLIT', label: 'N분의 1' },
  { id: 'CLUB_FUND', label: '전체 회비에서 처리' }
];

const SocialCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    social_type: 'CASUAL',
    meeting_date: '',
    meeting_time: '',
    application_deadline_date: '',
    application_deadline_time: '',
    location: '',
    participant_mode: 'ALL',
    max_participants: '',
    social_notes: '',
    club_id: '',
    venue_name: '',
    settlement_method: 'EQUAL_SPLIT',
    social_cost: ''
  });

  const [errors, setErrors] = useState({});

  const { data: clubsResponse } = useQuery({
    queryKey: ['admin-clubs-list'],
    queryFn: () => clubsApi.getClubs({ limit: 200 })
  });
  const clubsList = Array.isArray(clubsResponse?.data)
    ? clubsResponse.data
    : Array.isArray(clubsResponse)
      ? clubsResponse
      : [];

  const createMutation = useMutation({
    mutationFn: (data) => meetingsApi.createEventMeeting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-socials'] });
      navigate('/socials', { state: { message: '소셜 모임이 성공적으로 생성되었습니다.' } });
    },
    onError: (error) => {
      setErrors({ general: error.response?.data?.message || '소셜 모임 생성에 실패했습니다.' });
    }
  });

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const getDateTimeISO = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return '';
    return `${dateStr}T${timeStr}:00`;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = '모임명을 입력해주세요.';
    if (!formData.meeting_date) newErrors.meeting_date = '모임 날짜를 선택해주세요.';
    if (!formData.meeting_time) newErrors.meeting_time = '모임 시간을 입력해주세요.';
    if (!formData.application_deadline_date) {
      newErrors.application_deadline = '신청 마감일을 선택해주세요.';
    } else if (!formData.application_deadline_time) {
      newErrors.application_deadline = '신청 마감 시간을 입력해주세요.';
    }
    if (!formData.venue_name?.trim()) newErrors.venue_name = '장소명을 입력해주세요.';
    if (!formData.club_id) newErrors.club_id = '클럽을 선택해주세요.';

    const meetingIso = getDateTimeISO(formData.meeting_date, formData.meeting_time);
    const deadlineIso = getDateTimeISO(formData.application_deadline_date, formData.application_deadline_time);
    if (meetingIso && deadlineIso) {
      const meetingDate = new Date(meetingIso);
      const deadlineDate = new Date(deadlineIso);
      if (
        !Number.isNaN(meetingDate.getTime()) &&
        !Number.isNaN(deadlineDate.getTime()) &&
        meetingDate < deadlineDate
      ) {
        newErrors.application_deadline = '신청 마감일은 모임 시간 이전이어야 합니다.';
      }
    }

    if (formData.participant_mode === 'LIMITED') {
      const digits = String(formData.max_participants ?? '').replace(/\D/g, '');
      const n = digits === '' ? 0 : parseInt(digits, 10);
      if (!n || n <= 0) {
        newErrors.max_participants = '참가자 수는 1명 이상이어야 합니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const meetingTime = getDateTimeISO(formData.meeting_date, formData.meeting_time);
    const applicationDeadline = getDateTimeISO(
      formData.application_deadline_date,
      formData.application_deadline_time
    );

    const maxParticipants =
      formData.participant_mode === 'ALL'
        ? 0
        : parseInt(String(formData.max_participants).replace(/\D/g, ''), 10) || 0;

    const costRaw = String(formData.social_cost ?? '').trim();
    const socialCost = costRaw === '' ? undefined : Number(costRaw.replace(/,/g, ''));
    if (costRaw !== '' && !Number.isFinite(socialCost)) {
      setErrors({ social_cost: '참가비(비용)는 숫자로 입력해주세요.' });
      return;
    }

    createMutation.mutate({
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      type: formData.social_type,
      meeting_time: meetingTime,
      application_deadline: applicationDeadline,
      location: formData.location?.trim() || undefined,
      max_participants: maxParticipants,
      club_id: Number(formData.club_id) || formData.club_id,
      venue_name: formData.venue_name.trim(),
      settlement_method: formData.settlement_method,
      social_cost: socialCost,
      social_notes: formData.social_notes?.trim() || undefined
    });
  };

  const chipToggleGroupSx = {
    flexWrap: 'wrap',
    gap: 1,
    '& .MuiToggleButton-root': {
      borderRadius: 2,
      textTransform: 'none',
      px: 2,
      py: 0.75
    }
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
            <Stack spacing={3}>
              {/* 기본 정보 */}
              <MainCard title="기본 정보" subheader="소셜 모임 정보를 입력해주세요.">
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="모임명"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    error={!!errors.name}
                    helperText={errors.name}
                    placeholder="예: 봄맞이 저녁 모임"
                  />
                  <TextField
                    fullWidth
                    label="설명"
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    multiline
                    minRows={3}
                    placeholder="모임 소개를 입력하세요"
                  />
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      모임 유형
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      value={formData.social_type}
                      onChange={(_, v) => {
                        if (v != null) {
                          setFormData((p) => ({ ...p, social_type: v }));
                        }
                      }}
                      sx={chipToggleGroupSx}
                    >
                      {SOCIAL_TYPE_OPTIONS.map((o) => (
                        <ToggleButton key={o.id} value={o.id}>
                          {o.label}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>
                </Stack>
              </MainCard>

              {/* 일정 및 클럽 */}
              <MainCard title="일정 및 클럽" subheader="모임 일정을 설정해주세요.">
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="모임 날짜"
                        type="date"
                        value={formData.meeting_date}
                        onChange={handleInputChange('meeting_date')}
                        error={!!errors.meeting_date}
                        helperText={errors.meeting_date}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="모임 시간"
                        type="time"
                        value={formData.meeting_time}
                        onChange={handleInputChange('meeting_time')}
                        error={!!errors.meeting_time}
                        helperText={errors.meeting_time}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="신청 마감일"
                        type="date"
                        value={formData.application_deadline_date}
                        onChange={handleInputChange('application_deadline_date')}
                        error={!!errors.application_deadline}
                        helperText={errors.application_deadline}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="신청 마감 시간"
                        type="time"
                        value={formData.application_deadline_time}
                        onChange={handleInputChange('application_deadline_time')}
                        error={!!errors.application_deadline}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      클럽
                    </Typography>
                    {clubsList.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        등록된 클럽이 없습니다. 클럽을 먼저 등록한 뒤 다시 시도해주세요.
                      </Typography>
                    ) : (
                      <ToggleButtonGroup
                        exclusive
                        value={formData.club_id === '' ? null : formData.club_id}
                        onChange={(_, v) => {
                          if (v != null) {
                            setFormData((p) => ({ ...p, club_id: v }));
                            setErrors((e) => ({ ...e, club_id: '' }));
                          }
                        }}
                        sx={chipToggleGroupSx}
                      >
                        {clubsList.map((club) => (
                          <ToggleButton key={club.id} value={club.id}>
                            {club.name ?? club.display_id ?? club.id}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    )}
                    {errors.club_id && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {errors.club_id}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </MainCard>

              {/* 장소 및 비용 */}
              <MainCard title="장소 및 비용" subheader="장소와 비용 정보를 입력해주세요.">
                <Stack spacing={3}>
                  <Typography variant="body2" color="text.secondary">
                    참가자 안내용으로 기록하는 항목입니다.
                  </Typography>
                  <TextField
                    fullWidth
                    label="장소명"
                    value={formData.venue_name}
                    onChange={handleInputChange('venue_name')}
                    error={!!errors.venue_name}
                    helperText={errors.venue_name}
                    placeholder="예: 판교 라운지"
                  />
                  <TextField
                    fullWidth
                    label="장소 (상세 주소 등)"
                    value={formData.location}
                    onChange={handleInputChange('location')}
                  />
                  <TextField
                    fullWidth
                    label="참가비·비용 (선택)"
                    value={formData.social_cost}
                    onChange={handleInputChange('social_cost')}
                    error={!!errors.social_cost}
                    helperText={errors.social_cost || '참가자 안내용 금액입니다. 미입력 시 생략됩니다.'}
                    placeholder="예: 50000"
                  />
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      정산 방식
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      value={formData.settlement_method}
                      onChange={(_, v) => {
                        if (v != null) setFormData((p) => ({ ...p, settlement_method: v }));
                      }}
                      sx={chipToggleGroupSx}
                    >
                      {SOCIAL_SETTLEMENT_METHODS.map((m) => (
                        <ToggleButton key={m.id} value={m.id}>
                          {m.label}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      참가자 안내용으로 기록하는 항목입니다.
                    </Typography>
                  </Box>
                </Stack>
              </MainCard>

              {/* 참가자 설정 */}
              <MainCard title="참가자 설정" subheader="참가자 수를 설정해주세요.">
                <Stack spacing={2}>
                  <ToggleButtonGroup
                    exclusive
                    value={formData.participant_mode}
                    onChange={(_, v) => {
                      if (v != null) {
                        setFormData((p) => ({
                          ...p,
                          participant_mode: v,
                          max_participants: v === 'ALL' ? '' : p.max_participants
                        }));
                        setErrors((e) => ({ ...e, max_participants: '' }));
                      }
                    }}
                    sx={chipToggleGroupSx}
                  >
                    <ToggleButton value="ALL">모든 클럽 멤버</ToggleButton>
                    <ToggleButton value="LIMITED">참가자 수 설정</ToggleButton>
                  </ToggleButtonGroup>
                  {formData.participant_mode === 'LIMITED' && (
                    <TextField
                      fullWidth
                      label="참가자 수"
                      value={formData.max_participants}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        setFormData((p) => ({ ...p, max_participants: digitsOnly }));
                        if (errors.max_participants) setErrors((prev) => ({ ...prev, max_participants: '' }));
                      }}
                      error={!!errors.max_participants}
                      helperText={errors.max_participants}
                      placeholder="예: 20"
                      inputProps={{ inputMode: 'numeric' }}
                    />
                  )}
                </Stack>
              </MainCard>

              {/* 운영진용 메모 */}
              <MainCard title="운영진용 메모" subheader="참가자에게 보이지 않으며, 운영진만 볼 수 있습니다.">
                <TextField
                  fullWidth
                  label="메모 (선택)"
                  value={formData.social_notes}
                  onChange={handleInputChange('social_notes')}
                  multiline
                  minRows={4}
                  placeholder="메모를 입력하세요 (선택)"
                />
              </MainCard>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <MainCard title="안내">
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  섹션 구성과 입력 순서는 앱(소셜 모임 만들기)과 같게 맞춰 두었습니다.
                </Typography>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  생성 후 상세 화면에서 참가자·정산을 관리할 수 있습니다.
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
            disabled={createMutation.isPending || clubsList.length === 0}
            startIcon={createMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {createMutation.isPending ? '생성 중...' : '소셜 모임 생성'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default SocialCreatePage;
