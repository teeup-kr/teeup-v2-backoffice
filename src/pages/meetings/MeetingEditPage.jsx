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
  Divider
} from '@mui/material';
import { meetingsApi } from '../../lib/api/meetings';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import { MdArrowBack as ArrowLeft, MdSave, MdSchedule as ScheduleIcon, MdLocationOn as LocationIcon, MdPeople as PeopleIcon, MdAttachMoney as MoneyIcon, MdGolfCourse as GolfIcon, MdEvent as EventIcon } from 'react-icons/md';

// 상태 한국어 변환
const getStatusText = (status) => {
  switch (status) {
    case 'ACTIVE': return '활성';
    case 'INACTIVE': return '비활성';
    case 'CANCELLED': return '취소';
    case 'CANCELED': return '취소';
    case 'COMPLETED': return '완료';
    default: return status || '알 수 없음';
  }
};

const MeetingEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'ROUNDING',
    meeting_date: '',
    meeting_time: '',
    location: '',
    fee: 0,
    max_participants: 0,
    additional_info: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState({});

  // 모임 상세 정보 조회
  const {
    data: meeting,
    isLoading: meetingLoading,
    error: meetingError
  } = useQuery({
    queryKey: ['admin-meeting', id],
    queryFn: () => meetingsApi.getMeeting(id),
    enabled: !!id,
  });

  // 모임 수정 mutation
  const updateMeetingMutation = useMutation({
    mutationFn: (data) => meetingsApi.updateMeeting(id, data),
    onSuccess: (data) => {
      console.log('모임 수정 성공:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-meeting', id] });
      navigate(`/meetings/${id}`, { 
        state: { message: '모임 정보가 성공적으로 수정되었습니다.' }
      });
    },
    onError: (error) => {
      console.error('모임 수정 실패:', error);
      const errorMessage = error.response?.data?.message || '모임 수정에 실패했습니다.';
      setErrors({ general: errorMessage });
    }
  });

  // 모임 데이터 로드 및 초기화
  useEffect(() => {
    if (meeting) {
      setFormData({
        name: meeting.name || '',
        description: meeting.description || '',
        type: meeting.type || 'ROUNDING',
        meeting_date: meeting.meeting_date ? meeting.meeting_date.split('T')[0] : '',
        meeting_time: meeting.meeting_time || '',
        location: meeting.location || '',
        fee: meeting.fee || 0,
        max_participants: meeting.max_participants || 0,
        additional_info: meeting.additional_info || '',
        status: meeting.status || 'ACTIVE',
      });
    }
  }, [meeting]);

  // 입력값 변경 핸들러들
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '모임명을 입력해주세요.';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '모임 설명을 입력해주세요.';
    }
    
    if (!formData.meeting_date) {
      newErrors.meeting_date = '모임 날짜를 선택해주세요.';
    }
    
    if (!formData.meeting_time) {
      newErrors.meeting_time = '모임 시간을 입력해주세요.';
    }
    
    if (formData.max_participants <= 0) {
      newErrors.max_participants = '최대 참가자 수는 1명 이상이어야 합니다.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    updateMeetingMutation.mutate(formData);
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
        <Alert severity="error">
          모임 정보를 불러올 수 없습니다.
        </Alert>
        <Button
          onClick={() => navigate('/meetings')}
          sx={{ mt: 2 }}
        >
          모임 목록으로 돌아가기
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
          모임 수정
        </Typography>
        <Chip
          label={getStatusText(meeting.status)}
          color={meeting.status === 'ACTIVE' ? 'success' : 'default'}
          sx={{ ml: 2 }}
        />
      </Box>

      {/* 에러 메시지 */}
      {errors.general && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.general}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* 기본 정보 */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="기본 정보" />
              <CardContent>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="모임명*"
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
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>모임 유형</InputLabel>
                        <Select
                          value={formData.type}
                          onChange={handleInputChange('type')}
                          label="모임 유형"
                        >
                          <MenuItem value="ROUNDING">라운딩</MenuItem>
                          <MenuItem value="SOCIAL">소셜</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="최대 참가자수*"
                        type="number"
                        value={formData.max_participants}
                        onChange={handleInputChange('max_participants')}
                        error={!!errors.max_participants}
                        helperText={errors.max_participants}
                        required
                      />
                    </Grid>
                  </Grid>
                  
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
                  
                  <TextField
                    fullWidth
                    label="장소"
                    value={formData.location}
                    onChange={handleInputChange('location')}
                  />
                  
                  <TextField
                    fullWidth
                    label="참가비"
                    type="number"
                    value={formData.fee}
                    onChange={handleInputChange('fee')}
                    InputProps={{
                      endAdornment: <Typography sx={{ ml: 1 }}>원</Typography>,
                    }}
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

          {/* 상태 관리 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="상태 관리" />
              <CardContent>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>모임 상태</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={handleInputChange('status')}
                      label="모임 상태"
                    >
                      <MenuItem value="ACTIVE">활성</MenuItem>
                      <MenuItem value="INACTIVE">비활성</MenuItem>
                      <MenuItem value="CANCELLED">취소</MenuItem>
                      <MenuItem value="COMPLETED">완료</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Typography variant="body2" color="text.secondary">
                    모임 상태를 변경하면 참가자들에게 알림이 전송됩니다.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* 모임 정보 */}
            <Card sx={{ mt: 2 }}>
              <CardHeader title="모임 정보" />
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>생성일:</strong> {new Date(meeting.created_at).toLocaleDateString('ko-KR')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>수정일:</strong> {new Date(meeting.updated_at).toLocaleDateString('ko-KR')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>주최자:</strong> {meeting.organizer?.nickname || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>현재 참가자 수:</strong> {meeting.participant_count || 0}명
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 제출 버튼 */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/meetings/${id}`)}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={updateMeetingMutation.isPending ? <CircularProgress size={20} /> : <Save />}
            disabled={updateMeetingMutation.isPending}
          >
            {updateMeetingMutation.isPending ? '수정 중...' : '모임 수정'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default MeetingEditPage;
