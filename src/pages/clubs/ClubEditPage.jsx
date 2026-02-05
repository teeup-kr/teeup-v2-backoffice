import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
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
import { clubsApi } from '../../lib/api/clubs';
import { regionApi } from '../../lib/api/region';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';
import { MdArrowBack as ArrowLeft, MdSave as Save, MdGroup as GroupIcon, MdDescription as DescriptionIcon, MdLocationOn as LocationIcon, MdAttachMoney as MoneyIcon } from 'react-icons/md';

const ClubEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'REGULAR',
    member_count: 0,
    sido_code: '',
    gungu_codes: [],
    contact_info: '',
    additional_info: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState({});

  // 클럽 상세 정보 조회
  const {
    data: club,
    isLoading: clubLoading,
    error: clubError
  } = useQuery({
    queryKey: ['admin-club', id],
    queryFn: () => clubsApi.getClub(id),
    enabled: !!id,
  });

  // 클럽 멤버 목록 조회 (대표자 실명 표시용)
  const {
    data: members,
    isLoading: membersLoading
  } = useQuery({
    queryKey: ['admin-club-members', id],
    queryFn: () => clubsApi.getClubMembers(id),
    enabled: !!id,
  });

  // 클럽 수정 mutation
  const updateClubMutation = useMutation({
    mutationFn: (data) => clubsApi.updateClub(id, data),
    onSuccess: (data) => {
      console.log('클럽 수정 성공:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-club', id] });
      navigate(`/clubs/${id}`, { 
        state: { message: '클럽 정보가 성공적으로 수정되었습니다.' }
      });
    },
    onError: (error) => {
      console.error('클럽 수정 실패:', error);
      const errorMessage = error.response?.data?.message || '클럽 수정에 실패했습니다.';
      setErrors({ general: errorMessage });
    }
  });

  // 시도/군구 목록
  const { data: sidoList = [] } = useQuery({
    queryKey: ['region-sido'],
    queryFn: () => regionApi.getSidoList(),
  });
  const { data: gunguList = [], isLoading: gunguLoading } = useQuery({
    queryKey: ['region-gungu', formData.sido_code],
    queryFn: () => regionApi.getGunguList(formData.sido_code),
    enabled: !!formData.sido_code,
  });

  const handleSidoChange = (event) => {
    const code = event.target.value;
    setFormData((prev) => ({ ...prev, sido_code: code, gungu_codes: [] }));
  };
  const handleGunguToggle = (code) => {
    setFormData((prev) => {
      const current = prev.gungu_codes || [];
      const exists = current.includes(code);
      if (exists) return { ...prev, gungu_codes: current.filter((c) => c !== code) };
      if (current.length >= 4) return prev;
      return { ...prev, gungu_codes: [...current, code] };
    });
  };

  // 클럽 데이터 로드 및 초기화
  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || '',
        description: club.description || '',
        type: club.type || 'REGULAR',
        member_count: club.member_count || 0,
        sido_code: club.sido_code || '',
        gungu_codes: club.gungu_codes || [],
        contact_info: club.contact_info || '',
        additional_info: club.additional_info || '',
        status: club.status || 'ACTIVE',
      });
    }
  }, [club]);

  // 입력값 변경 핸들러
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 상태 텍스트 변환 함수
  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return '활성';
      case 'INACTIVE': return '비활성';
      case 'SUSPENDED': return '정지';
      case 'APPROVED': return '승인';
      default: return status || '알 수 없음';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'SUSPENDED': return 'error';
      case 'APPROVED': return 'success';
      default: return 'default';
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '클럽명을 입력해주세요.';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '클럽 설명을 입력해주세요.';
    }
    
    if (formData.member_count <= 0) {
      newErrors.member_count = '멤버 수는 1명 이상이어야 합니다.';
    }
    
    if (formData.sido_code && (!formData.gungu_codes?.length || formData.gungu_codes.length > 4)) {
      newErrors.gungu_codes = '군구를 1~4개 선택해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    updateClubMutation.mutate(formData);
  };

  if (clubLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (clubError || !club) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          클럽 정보를 불러오는데 실패했습니다.
        </Alert>
        <Button
          onClick={() => navigate('/clubs')}
          sx={{ mt: 2 }}
        >
          클럽 목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* 헤더 */}
      <MainCard sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AnimateButton>
              <Button
                startIcon={<ArrowLeft />}
                onClick={() => navigate(`/clubs/${id}`)}
                variant="outlined"
              >
                돌아가기
              </Button>
            </AnimateButton>
            <Stack direction="row" alignItems="center" spacing={2}>
              <ExtendedAvatar
                alt={club.name}
                src={club.logo_url}
                color="primary"
                size="lg"
              >
                <GroupIcon />
              </ExtendedAvatar>
              <Box>
                <Typography variant="h4" component="h1">
                  클럽 수정: {club.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  클럽 정보를 수정하세요
                </Typography>
              </Box>
              <Chip
                label={getStatusText(club.status)}
                color={getStatusColor(club.status)}
                variant="filled"
              />
            </Stack>
          </Stack>
          
          <AnimateButton>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={updateClubMutation.isPending}
              size="large"
            >
              {updateClubMutation.isPending ? '수정 중...' : '수정'}
            </Button>
          </AnimateButton>
        </Stack>
      </MainCard>

      {/* 에러 메시지 */}
      {errors.general && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.general}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* 기본 정보 */}
          <Box sx={{ width: { xs: '100%', md: '75%' }, flexShrink: 0 }}>
            <MainCard>
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <DescriptionIcon style={{ color: '#1976d2' }} />
                  <Typography variant="h6">기본 정보</Typography>
                </Stack>
                <Divider />
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="클럽명*"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="클럽 설명 *"
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description}
                    required
                  />
                  
                  <Grid container spacing={2}>
                    <Grid item>
                      <FormControl sx={{ minWidth: 350 }}>
                        <InputLabel>클럽 유형</InputLabel>
                        <Select
                          value={formData.type}
                          onChange={handleInputChange('type')}
                          label="클럽 유형"
                          sx={{ minWidth: 350 }}
                        >
                          <MenuItem value="REGULAR">정기</MenuItem>
                          <MenuItem value="IRREGULAR">비정기</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs>
                      <TextField
                        fullWidth
                        label="예상 멤버 수*"
                        type="number"
                        value={formData.member_count}
                        onChange={handleInputChange('member_count')}
                        error={!!errors.member_count}
                        helperText={errors.member_count}
                        required
                      />
                    </Grid>
                  </Grid>
                  
                  <FormControl fullWidth sx={{ mb: 1 }}>
                    <InputLabel>시도</InputLabel>
                    <Select
                      value={formData.sido_code}
                      onChange={handleSidoChange}
                      label="시도"
                    >
                      <MenuItem value=""><em>선택</em></MenuItem>
                      {sidoList.map((s) => (
                        <MenuItem key={s.code} value={s.code}>{s.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>군구 (1~4개 선택)</Typography>
                    {!formData.sido_code ? (
                      <Typography variant="body2" color="text.secondary">시도를 먼저 선택해주세요.</Typography>
                    ) : gunguLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {gunguList.map((g) => (
                          <Chip
                            key={g.code}
                            label={g.name}
                            onClick={() => handleGunguToggle(g.code)}
                            color={formData.gungu_codes?.includes(g.code) ? 'primary' : 'default'}
                            variant={formData.gungu_codes?.includes(g.code) ? 'filled' : 'outlined'}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="연락처"
                    value={formData.contact_info}
                    onChange={(e) => {
                      // 숫자만 허용하고 11자리로 제한
                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                      setFormData(prev => ({ ...prev, contact_info: value }));
                      // 에러 메시지 제거
                      if (errors.contact_info) {
                        setErrors(prev => ({ ...prev, contact_info: '' }));
                      }
                    }}
                    onKeyPress={(e) => {
                      // 숫자만 허용
                      if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                        e.preventDefault();
                      }
                    }}
                    inputProps={{ maxLength: 11 }}
                    helperText="클럽 대표연락처를 11자리 숫자로 입력해주세요."
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
              </Stack>
            </MainCard>
          </Box>

          {/* 상태 관리 */}
          <Box sx={{ width: { xs: '100%', md: '25%' }, flexShrink: 0 }}>
            <MainCard>
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <GroupIcon style={{ color: '#1976d2' }} />
                  <Typography variant="h6">상태 관리</Typography>
                </Stack>
                <Divider />
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>클럽 상태</InputLabel>
                    <Select
                      value={formData.status || ''}
                      onChange={handleInputChange('status')}
                      label="클럽 상태"
                    >
                      <MenuItem value="ACTIVE">활성</MenuItem>
                      <MenuItem value="INACTIVE">비활성</MenuItem>
                      <MenuItem value="SUSPENDED">정지</MenuItem>
                      <MenuItem value="APPROVED">승인</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Typography variant="body2" color="text.secondary">
                    클럽 상태를 변경하면 해당 클럽의 모든 활동에 영향을 받습니다.
                  </Typography>
                </Stack>
              </Stack>
            </MainCard>

            {/* 클럽 정보 */}
            <MainCard sx={{ mt: 2 }}>
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <LocationIcon style={{ color: '#1976d2' }} />
                  <Typography variant="h6">클럽 정보</Typography>
                </Stack>
                <Divider />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      생성일
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {new Date(club.created_at).toLocaleDateString('ko-KR')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      수정일
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {new Date(club.updated_at).toLocaleDateString('ko-KR')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      대표자
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {members?.members?.find(m => m.role === 'LEADER')?.user_realname || club.representative_name || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      현재 멤버 수
                    </Typography>
                    <Typography variant="body1" fontWeight="600" color="primary.main">
                      {club.current_member_count || 0}명
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </MainCard>
          </Box>
        </Box>

        {/* 제출 버튼 */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, mt: 3 }}>
          <Box sx={{ width: { xs: '100%', md: '75%' }, flexShrink: 0 }}>
            <MainCard>
              <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <AnimateButton>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/clubs/${id}`)}
                    size="large"
                  >
                    취소
                  </Button>
                </AnimateButton>
                <AnimateButton>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={updateClubMutation.isPending ? <CircularProgress size={20} /> : <Save />}
                    disabled={updateClubMutation.isPending}
                    size="large"
                  >
                    {updateClubMutation.isPending ? '수정 중...' : '클럽 수정'}
                  </Button>
                </AnimateButton>
              </Stack>
            </MainCard>
          </Box>
          <Box sx={{ width: { xs: '100%', md: '25%' }, flexShrink: 0 }} />
        </Box>
      </form>
    </Box>
  );
};

export default ClubEditPage;
