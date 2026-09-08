import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
  FormControlLabel,
  Checkbox,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  Chip,
  Paper,
} from '@mui/material';
import { meetingsApi } from '../../lib/api/meetings';
import { clubsApi } from '../../lib/api/clubs';
import MainCard from '../../components/MainCard';
import { MdArrowBack as ArrowLeft, MdSave as SaveIcon, MdAdd as AddIcon, MdDelete as DeleteIcon } from 'react-icons/md';

/** 앱 `meetingConstants.js`와 동일 */
const ROUNDING_SUBTYPES = [
  { id: 'REGULAR', label: '정기' },
  { id: 'IRREGULAR', label: '비정기' },
  { id: 'ONE_TIME', label: '일회성' },
];

const TEAM_FORMATION_MODES = [
  { id: 'GENDER_SEPARATED_HANDICAP', label: '성별 분리 + 핸디캡 기준' },
  { id: 'GENDER_SEPARATED_PREVIOUS_RECORD', label: '성별 분리 + 직전대회 성적 기준' },
  { id: 'GENDER_SEPARATED_RANDOM', label: '성별 분리 + 랜덤' },
  { id: 'GENDER_MIXED_HANDICAP', label: '성별 혼합 + 핸디캡 기준' },
  { id: 'GENDER_MIXED_PREVIOUS_RECORD', label: '성별 혼합 + 직전대회 성적 기준' },
  { id: 'GENDER_MIXED_RANDOM', label: '성별 혼합 + 랜덤' },
];

const SETTLEMENT_METHODS = [
  { id: 'EQUAL_SPLIT', label: 'N분의 1' },
  { id: 'INDIVIDUAL', label: '개별 정산' },
];

function validateMeetingTimeBeforeEarliestTee(meetingIso, teeTimes) {
  if (!meetingIso || !teeTimes?.length) return true;
  const meetingDate = new Date(meetingIso);
  if (Number.isNaN(meetingDate.getTime())) return true;
  const meetingDateStr = meetingIso.includes('T') ? meetingIso.split('T')[0] : meetingIso.substring(0, 10);
  const sorted = [...teeTimes].filter(Boolean).sort();
  const earliest = sorted[0];
  if (!earliest || !/^\d{1,2}:\d{2}$/.test(earliest)) return true;
  const [teeHour, teeMinute] = earliest.split(':').map(Number);
  const teeDateTime = new Date(`${meetingDateStr}T00:00:00`);
  teeDateTime.setHours(teeHour, teeMinute, 0, 0);
  return meetingDate < teeDateTime;
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'SCHEDULED':
      return '예정';
    case 'IN_PROGRESS':
      return '진행중';
    case 'COMPLETED':
      return '완료';
    case 'CANCELED':
      return '취소';
    default:
      return status || '알 수 없음';
  }
};

const chipToggleGroupSx = {
  flexWrap: 'wrap',
  gap: 1,
  '& .MuiToggleButton-root': {
    borderRadius: 2,
    textTransform: 'none',
    px: 2,
    py: 0.75,
  },
};

const RoundEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const privateHydratedRef = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meeting_date: '',
    meeting_time: '',
    application_deadline_date: '',
    application_deadline_time: '',
    location: '',
    club_id: '',
    course_name: '',
    reservation_name: '',
    hole_count: 18,
    tee_times: ['07:30'],
    max_participants: 4,
    team_size: 4,
    team_formation_mode: 'GENDER_SEPARATED_HANDICAP',
    meeting_subtype: 'REGULAR',
    green_fee: '',
    caddy_fee: '',
    cart_fee: '',
    settlement_method: 'EQUAL_SPLIT',
    is_private: false,
    status: 'SCHEDULED',
  });

  const [privateSelectedMembers, setPrivateSelectedMembers] = useState([]);
  const [privateGuests, setPrivateGuests] = useState([]);
  const guestKeySeq = useRef(0);

  const [errors, setErrors] = useState({});

  const { data: meetingRes, isLoading: meetingLoading, error: meetingError } = useQuery({
    queryKey: ['admin-round', id],
    queryFn: () => meetingsApi.getMeeting(id),
    enabled: !!id,
  });

  const rawMeeting = meetingRes?.data ?? meetingRes;

  const { data: participantsList } = useQuery({
    queryKey: ['admin-meeting-participants', id],
    queryFn: async () => {
      const r = await meetingsApi.getMeetingParticipants(id);
      return Array.isArray(r?.data) ? r.data : r;
    },
    enabled:
      !!id &&
      !!rawMeeting &&
      String(rawMeeting.meeting_type || '').toUpperCase() === 'ROUND',
  });

  useEffect(() => {
    privateHydratedRef.current = false;
    setPrivateSelectedMembers([]);
    setPrivateGuests([]);
  }, [id]);

  useEffect(() => {
    if (!rawMeeting?.id) return;
    if (String(rawMeeting.meeting_type || '').toUpperCase() !== 'ROUND') return;

    const mt = rawMeeting.meeting_time;
    let datePart = '';
    let timePart = '';
    if (mt) {
      try {
        const d = new Date(mt);
        if (!Number.isNaN(d.getTime())) {
          datePart = d.toISOString().slice(0, 10);
          timePart = d.toISOString().slice(11, 16);
        }
      } catch (_) {
        /* noop */
      }
      if (!datePart && typeof mt === 'string' && mt.includes('T')) {
        const [d0, t0] = mt.split('T');
        datePart = d0;
        timePart = (t0 || '').slice(0, 5);
      }
    }

    const ad = rawMeeting.application_deadline;
    let add = '';
    let adt = '';
    if (ad) {
      try {
        const d = new Date(ad);
        if (!Number.isNaN(d.getTime())) {
          add = d.toISOString().slice(0, 10);
          adt = d.toISOString().slice(11, 16);
        }
      } catch (_) {
        /* noop */
      }
      if (!add && typeof ad === 'string' && ad.includes('T')) {
        const [d0, t0] = ad.split('T');
        add = d0;
        adt = (t0 || '').slice(0, 5);
      }
    }

    const tees =
      Array.isArray(rawMeeting.tee_times) && rawMeeting.tee_times.length
        ? [...rawMeeting.tee_times]
        : rawMeeting.tee_time
          ? [rawMeeting.tee_time]
          : ['07:30'];

    setFormData({
      name: rawMeeting.name || '',
      description: rawMeeting.description || '',
      meeting_date: datePart,
      meeting_time: timePart,
      application_deadline_date: add,
      application_deadline_time: adt,
      location: rawMeeting.location || '',
      club_id: rawMeeting.club_id != null ? String(rawMeeting.club_id) : '',
      course_name: rawMeeting.course_name || '',
      reservation_name: rawMeeting.reservation_name || '',
      hole_count: rawMeeting.hole_count ?? 18,
      tee_times: tees,
      max_participants: rawMeeting.max_participants ?? 0,
      team_size: rawMeeting.team_size ?? 4,
      team_formation_mode: rawMeeting.team_formation_mode || 'GENDER_SEPARATED_HANDICAP',
      meeting_subtype: rawMeeting.meeting_subtype || 'REGULAR',
      green_fee: rawMeeting.green_fee != null ? String(rawMeeting.green_fee) : '',
      caddy_fee: rawMeeting.caddy_fee != null ? String(rawMeeting.caddy_fee) : '',
      cart_fee: rawMeeting.cart_fee != null ? String(rawMeeting.cart_fee) : '',
      settlement_method: rawMeeting.settlement_method || 'EQUAL_SPLIT',
      is_private: !!rawMeeting.is_private,
      status: rawMeeting.status || 'SCHEDULED',
    });
  }, [rawMeeting?.id]);

  useEffect(() => {
    if (!rawMeeting?.id || privateHydratedRef.current) return;
    if (!Array.isArray(participantsList)) return;
    if (!rawMeeting.is_private) {
      privateHydratedRef.current = true;
      return;
    }
    const users = participantsList
      .filter((p) => !p.is_guest && p.user_id)
      .map((p) => ({
        user_id: p.user_id,
        user_nickname: p.user_nickname,
        user_realname: p.user_name,
        user_email: '',
        status: 'ACTIVE',
      }));
    setPrivateSelectedMembers(users);
    let seq = guestKeySeq.current;
    const guests = participantsList.filter((p) => p.is_guest).map((p) => {
      seq += 1;
      return {
        key: `g-${p.guest_id ?? seq}`,
        guest_id: p.guest_id,
        name: p.name || p.user_nickname || '',
        birthdate: p.guest_birthdate || '',
        gender: p.guest_gender || '',
        average_score: '',
        handicap: p.guest_handicap != null && p.guest_handicap !== '' ? String(p.guest_handicap) : '',
      };
    });
    guestKeySeq.current = seq;
    setPrivateGuests(guests);
    privateHydratedRef.current = true;
  }, [rawMeeting?.id, rawMeeting?.is_private, participantsList]);

  const clubIdForPrivateMembers = formData.is_private && formData.club_id ? String(formData.club_id) : null;

  const { data: clubMembersResponse, isLoading: clubMembersLoading } = useQuery({
    queryKey: ['admin-club-members-private-round', clubIdForPrivateMembers],
    queryFn: () => clubsApi.getClubMembers(clubIdForPrivateMembers),
    enabled: Boolean(clubIdForPrivateMembers),
  });
  const activeClubMembers = useMemo(() => {
    const list = Array.isArray(clubMembersResponse?.members) ? clubMembersResponse.members : [];
    return list.filter((m) => ['ACTIVE', 'APPROVED'].includes(String(m.status || '').toUpperCase()));
  }, [clubMembersResponse]);

  const { data: clubsResponse } = useQuery({
    queryKey: ['admin-clubs-list'],
    queryFn: () => clubsApi.getClubs({ limit: 200 }),
  });
  const clubsList = Array.isArray(clubsResponse?.data) ? clubsResponse.data : (Array.isArray(clubsResponse) ? clubsResponse : []);

  const canEditPrivateParticipants = formData.status === 'SCHEDULED';

  const updateMutation = useMutation({
    mutationFn: (data) => meetingsApi.updateMeeting(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rounds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-round', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-participants', id] });
      navigate(`/rounds/${id}`, { state: { message: '라운딩 정보가 수정되었습니다.' } });
    },
    onError: (error) => {
      const d = error.response?.data;
      const msg =
        (typeof d?.detail === 'string' && d.detail) ||
        d?.message ||
        error.response?.data?.message ||
        '라운딩 수정에 실패했습니다.';
      setErrors({ general: msg });
    },
  });

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleClubSelect = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, club_id: value }));
    setPrivateSelectedMembers([]);
    setPrivateGuests([]);
    if (errors.club_id) setErrors((prev) => ({ ...prev, club_id: '' }));
  };

  const handlePrivateToggle = (event) => {
    const checked = event.target.checked;
    setFormData((prev) => ({ ...prev, is_private: checked }));
    if (!checked) {
      setPrivateSelectedMembers([]);
      setPrivateGuests([]);
    }
    if (errors.selected_private) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.selected_private;
        return next;
      });
    }
  };

  const addPrivateGuest = useCallback(() => {
    guestKeySeq.current += 1;
    setPrivateGuests((prev) => [
      ...prev,
      {
        key: guestKeySeq.current,
        name: '',
        birthdate: '',
        gender: '',
        average_score: '',
        handicap: '',
      },
    ]);
  }, []);

  const updatePrivateGuest = (index, field, value) => {
    setPrivateGuests((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    const ek = `guest_${index}_skill`;
    if (errors[ek]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[ek];
        return n;
      });
    }
  };

  const removePrivateGuest = (index) => {
    setPrivateGuests((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const n = { ...prev };
      Object.keys(n).forEach((k) => {
        if (k.startsWith('guest_')) delete n[k];
      });
      return n;
    });
  };

  const handleTeeTimeChange = (index) => (event) => {
    const v = event.target.value;
    setFormData((prev) => {
      const next = [...(prev.tee_times || [])];
      next[index] = v;
      return { ...prev, tee_times: next };
    });
  };

  const addTeeTimeRow = useCallback(() => {
    setFormData((prev) => ({ ...prev, tee_times: [...(prev.tee_times || []), ''] }));
  }, []);

  const removeTeeTimeRow = useCallback((index) => {
    setFormData((prev) => {
      const next = (prev.tee_times || []).filter((_, i) => i !== index);
      return { ...prev, tee_times: next.length ? next : [''] };
    });
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = '모임명을 입력해주세요.';
    if (!formData.description?.trim()) newErrors.description = '모임 설명을 입력해주세요.';
    if (!formData.club_id) newErrors.club_id = '클럽을 선택해주세요.';
    if (!formData.location?.trim()) newErrors.location = '장소를 입력해주세요.';
    if (!formData.course_name?.trim()) newErrors.course_name = '골프장명을 입력해주세요.';
    if (!formData.reservation_name?.trim()) newErrors.reservation_name = '예약자명을 입력해주세요.';
    if (!formData.meeting_date) newErrors.meeting_date = '모임 날짜를 선택해주세요.';
    if (!formData.meeting_time) newErrors.meeting_time = '모임 시간을 입력해주세요.';
    if (!formData.application_deadline_date) newErrors.application_deadline_date = '신청 마감일을 선택해주세요.';
    if (!formData.application_deadline_time) newErrors.application_deadline_time = '신청 마감 시간을 입력해주세요.';

    const mp = Number(formData.max_participants);
    if (!Number.isFinite(mp) || mp < 0) {
      newErrors.max_participants = '최대 참가자 수는 0 이상의 숫자로 입력해주세요.';
    }

    const ts = Number(formData.team_size);
    if (!Number.isFinite(ts) || ts < 1) newErrors.team_size = '한 조당 인원은 1 이상이어야 합니다.';
    if (Number.isFinite(mp) && mp > 0 && Number.isFinite(ts) && ts > mp) {
      newErrors.team_size = '한 조당 인원은 최대 참가자 수를 넘을 수 없습니다.';
    }

    const teeList = (formData.tee_times || []).map((t) => String(t || '').trim()).filter(Boolean);
    if (!teeList.length) newErrors.tee_times = '티타임을 1개 이상 입력해주세요.';
    else {
      for (const t of teeList) {
        if (!/^\d{1,2}:\d{2}$/.test(t)) {
          newErrors.tee_times = '티타임은 HH:mm 형식이어야 합니다.';
          break;
        }
      }
    }

    const gf = Number(formData.green_fee);
    const cf = Number(formData.caddy_fee);
    const cartf = Number(formData.cart_fee);
    if (!Number.isFinite(gf) || gf <= 0) newErrors.green_fee = '그린피를 입력해주세요.';
    if (!Number.isFinite(cf) || cf <= 0) newErrors.caddy_fee = '캐디피를 입력해주세요.';
    if (!Number.isFinite(cartf) || cartf <= 0) newErrors.cart_fee = '카트비를 입력해주세요.';

    const meetingIso = `${formData.meeting_date}T${formData.meeting_time}:00`;
    const deadlineIso = `${formData.application_deadline_date}T${formData.application_deadline_time}:00`;
    const mt = new Date(meetingIso);
    const dl = new Date(deadlineIso);
    if (!Number.isNaN(mt.getTime()) && !Number.isNaN(dl.getTime()) && mt < dl) {
      newErrors.application_deadline_date = '신청 마감은 모임 일시 이전이어야 합니다.';
    }

    if (teeList.length && !validateMeetingTimeBeforeEarliestTee(meetingIso, teeList)) {
      newErrors.meeting_time = '모임(집합) 시간은 가장 이른 티타임보다 이전이어야 합니다.';
    }

    if (formData.is_private && canEditPrivateParticipants) {
      const namedGuests = privateGuests.filter((g) => g.name?.trim());
      if (privateSelectedMembers.length === 0 && namedGuests.length === 0) {
        newErrors.selected_private = '프라이빗 라운딩은 클럽 멤버 1명 이상 또는 게스트 1명 이상을 지정해주세요.';
      }
      namedGuests.forEach((g, idx) => {
        const h = String(g.handicap ?? '').trim();
        const a = String(g.average_score ?? '').trim();
        const hasH = h !== '' && Number.isFinite(Number(h));
        const hasA = a !== '' && Number.isFinite(Number(a));
        if (!hasH && !hasA) {
          newErrors[`guest_${idx}_skill`] = '평균 타수 또는 핸디캡 중 하나는 필수입니다.';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const meetingTime = `${formData.meeting_date}T${formData.meeting_time}:00`;
    const applicationDeadline = `${formData.application_deadline_date}T${formData.application_deadline_time}:00`;
    const teeList = (formData.tee_times || []).map((t) => String(t || '').trim()).filter(Boolean);
    const green = Number(formData.green_fee) || 0;
    const caddy = Number(formData.caddy_fee) || 0;
    const cart = Number(formData.cart_fee) || 0;

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      meeting_time: meetingTime,
      application_deadline: applicationDeadline,
      club_id: Number(formData.club_id),
      course_name: formData.course_name.trim(),
      reservation_name: formData.reservation_name.trim(),
      hole_count: Number(formData.hole_count) || 18,
      tee_times: teeList,
      max_participants: Number(formData.max_participants) || 0,
      team_size: Number(formData.team_size) || 4,
      team_formation_mode: formData.team_formation_mode,
      meeting_subtype: formData.meeting_subtype,
      green_fee: green,
      caddy_fee: caddy,
      cart_fee: cart,
      total_cost: green + caddy + cart,
      settlement_method: formData.settlement_method,
      is_private: !!formData.is_private,
      status: formData.status,
    };

    if (formData.is_private && canEditPrivateParticipants) {
      payload.selected_participants = privateSelectedMembers.map((m) => Number(m.user_id));
      payload.selected_guests = privateGuests
        .filter((g) => g.name?.trim())
        .map((g) => ({
          ...(g.guest_id != null && g.guest_id !== '' ? { guest_id: Number(g.guest_id) } : {}),
          name: g.name.trim(),
          birthdate: g.birthdate?.trim() || undefined,
          gender: g.gender || undefined,
          average_score:
            g.average_score === '' || g.average_score == null ? undefined : Number(g.average_score),
          handicap: g.handicap === '' || g.handicap == null ? undefined : Number(g.handicap),
        }));
    }

    updateMutation.mutate(payload);
  };

  if (meetingLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (meetingError || !rawMeeting) {
    return (
      <Box sx={{ py: 3, px: 0 }}>
        <Alert severity="error">라운딩 정보를 불러올 수 없습니다.</Alert>
        <Button onClick={() => navigate('/rounds')} sx={{ mt: 2 }}>
          라운딩 목록으로
        </Button>
      </Box>
    );
  }

  if (String(rawMeeting.meeting_type || '').toUpperCase() !== 'ROUND') {
    return (
      <Box sx={{ py: 3, px: 0 }}>
        <Alert severity="warning">라운딩이 아닌 모임입니다. 소셜 등은 목록에서 해당 메뉴로 수정해주세요.</Alert>
        <Button onClick={() => navigate('/rounds')} sx={{ mt: 2 }}>
          돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, px: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/rounds/${id}`)} sx={{ mr: 2 }}>
          돌아가기
        </Button>
        <Typography variant="h4">라운딩 수정</Typography>
        <Chip label={getStatusLabel(formData.status)} sx={{ ml: 1 }} />
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
              <MainCard title="기본 정보" subheader="라운딩 모임 유형과 소개를 입력하세요.">
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      모임 구분
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      value={formData.meeting_subtype}
                      onChange={(_, v) => {
                        if (v != null) setFormData((p) => ({ ...p, meeting_subtype: v }));
                      }}
                      sx={chipToggleGroupSx}
                    >
                      {ROUNDING_SUBTYPES.map((o) => (
                        <ToggleButton key={o.id} value={o.id}>
                          {o.label}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.is_private}
                        onChange={handlePrivateToggle}
                        disabled={!canEditPrivateParticipants}
                      />
                    }
                    label="프라이빗 라운딩 (초대된 멤버·게스트만)"
                  />
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
                    label="장소 *"
                    value={formData.location}
                    onChange={handleInputChange('location')}
                    error={!!errors.location}
                    helperText={errors.location}
                    required
                  />
                </Stack>
              </MainCard>

              <MainCard title="일정 및 클럽" subheader="모임 일정과 클럽을 설정하세요.">
                <Stack spacing={3}>
                  <FormControl fullWidth error={!!errors.club_id}>
                    <InputLabel id="rc-club-label">클럽 *</InputLabel>
                    <Select
                      labelId="rc-club-label"
                      value={formData.club_id}
                      onChange={handleClubSelect}
                      label="클럽 *"
                      required
                    >
                      <MenuItem value="" disabled>
                        선택
                      </MenuItem>
                      {clubsList.map((club) => (
                        <MenuItem key={club.id} value={String(club.id)}>
                          {club.name ?? club.display_id}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.club_id && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.club_id}
                      </Typography>
                    )}
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
                        helperText={errors.meeting_date || '집합·라운딩 일정 기준 날짜'}
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
                        helperText={errors.meeting_time || '가장 이른 티타임보다 앞선 시간 권장'}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="신청 마감일 *"
                        type="date"
                        value={formData.application_deadline_date}
                        onChange={handleInputChange('application_deadline_date')}
                        error={!!errors.application_deadline_date}
                        helperText={errors.application_deadline_date}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="신청 마감 시간 *"
                        type="time"
                        value={formData.application_deadline_time}
                        onChange={handleInputChange('application_deadline_time')}
                        error={!!errors.application_deadline_time}
                        helperText={errors.application_deadline_time}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </MainCard>

              {formData.is_private && (
                <MainCard
                  title="프라이빗 참가자"
                  subheader="초대할 클럽 멤버를 검색·선택하고, 필요하면 게스트를 추가하세요. (앱과 동일)"
                >
                  <Stack spacing={2}>
                    {!canEditPrivateParticipants && (
                      <Alert severity="info">
                        예정(SCHEDULED) 상태에서만 프라이빗 참가자·게스트를 편집할 수 있습니다.
                      </Alert>
                    )}
                    {!formData.club_id ? (
                      <Typography variant="body2" color="text.secondary">
                        멤버 목록을 불러오려면 위「일정 및 클럽」에서 클럽을 먼저 선택해주세요.
                      </Typography>
                    ) : clubMembersLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={22} />
                        <Typography variant="body2">클럽 멤버를 불러오는 중…</Typography>
                      </Box>
                    ) : (
                      <Autocomplete
                        multiple
                        disabled={!canEditPrivateParticipants}
                        options={activeClubMembers}
                        value={privateSelectedMembers}
                        onChange={(_, newValue) => {
                          setPrivateSelectedMembers(newValue);
                          if (errors.selected_private) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.selected_private;
                              return next;
                            });
                          }
                        }}
                        getOptionLabel={(m) =>
                          m.user_nickname ||
                          m.user_realname ||
                          m.user_email ||
                          (m.user_id != null ? `사용자 #${m.user_id}` : '')
                        }
                        isOptionEqualToValue={(a, b) => String(a.user_id) === String(b.user_id)}
                        disableCloseOnSelect
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              {...getTagProps({ index })}
                              key={option.user_id}
                              label={option.user_nickname || option.user_realname || `#${option.user_id}`}
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="초대할 클럽 멤버"
                            placeholder="닉네임·이름·이메일로 검색"
                          />
                        )}
                      />
                    )}
                    {errors.selected_private && (
                      <Typography variant="caption" color="error" display="block">
                        {errors.selected_private}
                      </Typography>
                    )}

                    <Divider />

                    <Typography variant="subtitle2">게스트 추가</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      클럽 멤버가 아닌 참가자입니다. 이름은 필수이며, 평균 타수 또는 핸디캡 중 하나는 필수입니다.
                    </Typography>

                    {privateGuests.map((guest, index) => (
                      <Paper key={guest.key} variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography fontWeight={600}>게스트 {index + 1}</Typography>
                            <IconButton
                              size="small"
                              aria-label="게스트 삭제"
                              onClick={() => removePrivateGuest(index)}
                              disabled={!canEditPrivateParticipants}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                          <TextField
                            fullWidth
                            size="small"
                            label="이름"
                            value={guest.name}
                            onChange={(e) => updatePrivateGuest(index, 'name', e.target.value)}
                            disabled={!canEditPrivateParticipants}
                          />
                          <TextField
                            fullWidth
                            size="small"
                            label="생년월일"
                            type="date"
                            value={guest.birthdate}
                            onChange={(e) => updatePrivateGuest(index, 'birthdate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            disabled={!canEditPrivateParticipants}
                          />
                          <FormControl fullWidth size="small">
                            <InputLabel id={`guest-g-${guest.key}-gender`}>성별</InputLabel>
                            <Select
                              labelId={`guest-g-${guest.key}-gender`}
                              value={guest.gender}
                              label="성별"
                              onChange={(e) => updatePrivateGuest(index, 'gender', e.target.value)}
                              disabled={!canEditPrivateParticipants}
                            >
                              <MenuItem value="">선택 안 함</MenuItem>
                              <MenuItem value="MALE">남</MenuItem>
                              <MenuItem value="FEMALE">여</MenuItem>
                            </Select>
                          </FormControl>
                          <Grid container spacing={1}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                size="small"
                                label="평균 타수"
                                type="number"
                                value={guest.average_score}
                                onChange={(e) => updatePrivateGuest(index, 'average_score', e.target.value)}
                                error={!!errors[`guest_${index}_skill`]}
                                inputProps={{ min: 50, max: 150 }}
                                disabled={!canEditPrivateParticipants}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                size="small"
                                label="핸디캡"
                                type="number"
                                value={guest.handicap}
                                onChange={(e) => updatePrivateGuest(index, 'handicap', e.target.value)}
                                error={!!errors[`guest_${index}_skill`]}
                                inputProps={{ min: 0, max: 72, step: 0.1 }}
                                disabled={!canEditPrivateParticipants}
                              />
                            </Grid>
                          </Grid>
                          {errors[`guest_${index}_skill`] && (
                            <Typography variant="caption" color="error">
                              {errors[`guest_${index}_skill`]}
                            </Typography>
                          )}
                        </Stack>
                      </Paper>
                    ))}

                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={addPrivateGuest}
                      disabled={!canEditPrivateParticipants}
                    >
                      게스트 추가
                    </Button>
                  </Stack>
                </MainCard>
              )}

              <MainCard title="골프장 정보" subheader="라운드 상세 정보를 입력하세요.">
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="골프장명 *"
                    value={formData.course_name}
                    onChange={handleInputChange('course_name')}
                    error={!!errors.course_name}
                    helperText={errors.course_name}
                    required
                  />
                  <TextField
                    fullWidth
                    label="예약자명 *"
                    value={formData.reservation_name}
                    onChange={handleInputChange('reservation_name')}
                    error={!!errors.reservation_name}
                    helperText={errors.reservation_name}
                    required
                  />
                  <FormControl fullWidth>
                    <InputLabel id="rc-hole-label">홀 수 *</InputLabel>
                    <Select
                      labelId="rc-hole-label"
                      value={formData.hole_count}
                      onChange={handleInputChange('hole_count')}
                      label="홀 수 *"
                    >
                      {[9, 18].map((h) => (
                        <MenuItem key={h} value={h}>
                          {h}홀
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      티타임 * (HH:mm, 앱과 동일)
                    </Typography>
                    <Stack spacing={1}>
                      {(formData.tee_times || ['']).map((row, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            type="time"
                            size="small"
                            value={row}
                            onChange={handleTeeTimeChange(idx)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 140 }}
                          />
                          <IconButton size="small" onClick={() => removeTeeTimeRow(idx)} aria-label="티타임 삭제">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button size="small" startIcon={<AddIcon />} onClick={addTeeTimeRow} type="button">
                        티타임 추가
                      </Button>
                    </Stack>
                    {errors.tee_times && (
                      <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                        {errors.tee_times}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </MainCard>

              <MainCard title="팀 및 참가 인원" subheader="인원과 팀 편성 방식을 설정하세요.">
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="최대 참가자 수 *"
                    type="number"
                    value={formData.max_participants}
                    onChange={handleInputChange('max_participants')}
                    error={!!errors.max_participants}
                    helperText={errors.max_participants || '0일 경우 전체 참가(인원 제한 없음)입니다.'}
                    inputProps={{ min: 0 }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="한 조 인원 수 *"
                    type="number"
                    value={formData.team_size}
                    onChange={handleInputChange('team_size')}
                    error={!!errors.team_size}
                    helperText={errors.team_size}
                    inputProps={{ min: 1 }}
                    required
                  />
                  <FormControl fullWidth>
                    <InputLabel id="rc-team-mode-label">팀 편성 방식 *</InputLabel>
                    <Select
                      labelId="rc-team-mode-label"
                      value={formData.team_formation_mode}
                      onChange={handleInputChange('team_formation_mode')}
                      label="팀 편성 방식 *"
                    >
                      {TEAM_FORMATION_MODES.map((o) => (
                        <MenuItem key={o.id} value={o.id}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </MainCard>

              <MainCard title="비용 및 정산" subheader="라운딩 비용과 정산 방식을 입력하세요.">
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="그린피 (원) *"
                        type="number"
                        value={formData.green_fee}
                        onChange={handleInputChange('green_fee')}
                        error={!!errors.green_fee}
                        helperText={errors.green_fee}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="캐디피 (원) *"
                        type="number"
                        value={formData.caddy_fee}
                        onChange={handleInputChange('caddy_fee')}
                        error={!!errors.caddy_fee}
                        helperText={errors.caddy_fee}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="카트비 (원) *"
                        type="number"
                        value={formData.cart_fee}
                        onChange={handleInputChange('cart_fee')}
                        error={!!errors.cart_fee}
                        helperText={errors.cart_fee}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                  </Grid>
                  <FormControl fullWidth>
                    <InputLabel id="rc-settle-label">정산 방식 *</InputLabel>
                    <Select
                      labelId="rc-settle-label"
                      value={formData.settlement_method}
                      onChange={handleInputChange('settlement_method')}
                      label="정산 방식 *"
                    >
                      {SETTLEMENT_METHODS.map((o) => (
                        <MenuItem key={o.id} value={o.id}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </MainCard>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <MainCard title="상태·안내">
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="re-status-label">라운딩 상태</InputLabel>
                  <Select
                    labelId="re-status-label"
                    value={formData.status}
                    label="라운딩 상태"
                    onChange={handleInputChange('status')}
                  >
                    <MenuItem value="SCHEDULED">예정</MenuItem>
                    <MenuItem value="IN_PROGRESS">진행중</MenuItem>
                    <MenuItem value="COMPLETED">완료</MenuItem>
                    <MenuItem value="CANCELED">취소</MenuItem>
                  </Select>
                </FormControl>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  생성 페이지와 동일한 항목으로 수정합니다. 예정 상태에서만 프라이빗 참가자·게스트를 변경할 수 있습니다.
                </Typography>
                <Divider />
                <Typography variant="caption" color="text.secondary" display="block">
                  생성: {rawMeeting.created_at ? new Date(rawMeeting.created_at).toLocaleString('ko-KR') : '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  수정: {rawMeeting.updated_at ? new Date(rawMeeting.updated_at).toLocaleString('ko-KR') : '-'}
                </Typography>
              </Stack>
            </MainCard>
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
