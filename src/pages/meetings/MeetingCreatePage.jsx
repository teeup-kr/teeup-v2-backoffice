import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import { MdArrowBack as ArrowLeft, MdSave, MdSchedule as ScheduleIcon, MdLocationOn as LocationIcon, MdPeople as PeopleIcon, MdAttachMoney as MoneyIcon, MdGolfCourse as GolfIcon, MdEvent as EventIcon } from 'react-icons/md';

const MeetingCreatePage = () => {
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
  });

  const [errors, setErrors] = useState({});

  // 모임 생성 mutation
  const createMeetingMutation = useMutation({
    mutationFn: (data) => meetingsApi.createMeeting(data),
    onSuccess: (data) => {
      console.log('모임 생성 성공:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
      navigate('/meetings', { 
        state: { message: '모임이 성공적으로 생성되었습니다.' }
      });
    },
    onError: (error) => {
      console.error('모임 생성 실패:', error);
      const errorMessage = error.response?.data?.message || '모임 생성에 실패했습니다.';
      setErrors({ general: errorMessage });
    }
  });

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
    
    createMeetingMutation.mutate(formData);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate('/meetings')}
          style={{ marginRight: 16 }}
        >
            돌아가기
        </Button>
        <Typography variant="h4">
          모임 생성
        </Typography>
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

          {/* 모임 설정 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="모임 설정" />
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    모임 생성 후 참가자들을 추가하고 세부 설정을 할 수 있습니다.
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    라운딩: 골프 라운딩 모임
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    소셜: 일반적인 모임
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
            onClick={() => navigate('/meetings')}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={createMeetingMutation.isPending ? <CircularProgress size={20} /> : <Save />}
            disabled={createMeetingMutation.isPending}
          >
            {createMeetingMutation.isPending ? '생성 중...' : '모임 생성'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default MeetingCreatePage;
