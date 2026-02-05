import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  InputAdornment,
  Chip,
  Divider,
  Paper,
  Pagination
} from '@mui/material';
import { clubsApi } from '../../lib/api/clubs';
import { regionApi } from '../../lib/api/region';
import apiClient from '../../lib/api/apiClient';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';
import { MdArrowBack as ArrowLeft, MdSave as Save, MdPersonAdd as AddUser, MdClear, MdSearch as Search, MdPerson, MdGroup as GroupIcon, MdLocationOn as LocationIcon, MdAttachMoney as MoneyIcon, MdDescription as DescriptionIcon } from 'react-icons/md';

const ClubCreatePage = () => {
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
    attachment_file: '',
    representative_id: '',
  });

  // 정기 회비 관련 상태
  const [hasRegularFee, setHasRegularFee] = useState(false);
  const [regularFeeAmount, setRegularFeeAmount] = useState('');
  const [regularFeeCycle, setRegularFeeCycle] = useState('MONTHLY');
  const [regularFeeDescription, setRegularFeeDescription] = useState('');

  const [selectedRepresentativeId, setSelectedRepresentativeId] = useState('');
  const [selectedRepresentative, setSelectedRepresentative] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [userSearchPage, setUserSearchPage] = useState(1);
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  
  // 유효성 검사 에러 상태
  const [errors, setErrors] = useState({});

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

  // 시도 변경 시 군구 초기화
  const handleSidoChange = (event) => {
    const code = event.target.value;
    setFormData((prev) => ({ ...prev, sido_code: code, gungu_codes: [] }));
    if (errors.sido_code || errors.gungu_codes) {
      setErrors((prev) => ({ ...prev, sido_code: '', gungu_codes: '' }));
    }
  };

  // 군구 다중 선택 (최대 4개)
  const handleGunguToggle = (code) => {
    setFormData((prev) => {
      const current = prev.gungu_codes || [];
      const exists = current.includes(code);
      let next;
      if (exists) {
        next = current.filter((c) => c !== code);
      } else if (current.length < 4) {
        next = [...current, code];
      } else {
        return prev;
      }
      return { ...prev, gungu_codes: next };
    });
    if (errors.gungu_codes) setErrors((prev) => ({ ...prev, gungu_codes: '' }));
  };

  // 사용자 검색
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: searchUsers
  } = useQuery({
    queryKey: ['admin-users-search', activeSearchQuery, userSearchPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeSearchQuery) params.append('q', activeSearchQuery);
      params.append('page', userSearchPage.toString());
      params.append('limit', '5');
      
      const response = await apiClient.get(`/v1/admin/users/search?${params.toString()}`);
      return response.data || response;
    },
    enabled: showUserSearchModal,
    staleTime: 30 * 1000,
  });

  // 검색 실행 핸들러
  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
    setUserSearchPage(1);
  };

  // 모달 열 때 초기화
  useEffect(() => {
    if (showUserSearchModal) {
      setSearchQuery('');
      setActiveSearchQuery('');
      setUserSearchPage(1);
    }
  }, [showUserSearchModal]);

  // 클럽 생성 mutation
  const createClubMutation = useMutation({
    mutationFn: async (data) => {
      const clubData = {
        ...data,
        has_regular_fee: hasRegularFee,
        regular_fee_amount: hasRegularFee ? parseFloat(regularFeeAmount) : null,
        regular_fee_cycle: hasRegularFee ? regularFeeCycle : null,
        regular_fee_description: hasRegularFee ? regularFeeDescription : null,
      };
      
      return clubsApi.createClub(clubData);
    },
    onSuccess: (data) => {
      console.log('새 클럽 생성 성공:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      navigate('/clubs', { 
        state: { message: '클럽이 성공적으로 생성되었습니다.' }
      });
    },
    onError: (error) => {
      console.error('새 클럽 생성 실패:', error);
      const errorMessage = error.response?.data?.message || '클럽 생성에 실패했습니다.';
      setErrors({ general: errorMessage });
    }
  });

  // 파일 업로드
  const uploadFile = async (file) => {
    setFileUploading(true);
    try {
      // clubsApi.uploadFile은 /v1/admin/upload 엔드포인트를 사용
      const response = await clubsApi.uploadFile(file);
      // 다양한 백엔드 응답 필드를 호환 처리
      const uploadedUrl = response?.url || response?.file_url || response?.upload_path || response?.filename;
      return uploadedUrl;
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      throw error;
    } finally {
      setFileUploading(false);
    }
  };

  // 입력값 변경 핸들러
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
    
    // 클럽명 검증
    if (!formData.name.trim()) {
      newErrors.name = '클럽명을 입력해주세요.';
    } else if (formData.name.length < 2) {
      newErrors.name = '클럽명은 2자 이상 입력해주세요.';
    }
    
    // 클럽 타입 검증
    if (!formData.type || (formData.type !== 'REGULAR' && formData.type !== 'IRREGULAR')) {
      newErrors.type = '클럽 타입을 선택해주세요.';
    }
    
    // 클럽 설명 검증
    if (!formData.description.trim()) {
      newErrors.description = '클럽 설명을 입력해주세요.';
    } else if (formData.description.length < 10) {
      newErrors.description = '클럽 설명은 10자 이상 입력해주세요.';
    }
    
    // 활동 지역 검증 (시도/군구)
    if (!formData.sido_code) {
      newErrors.sido_code = '시도를 선택해주세요.';
    }
    if (!formData.gungu_codes?.length || formData.gungu_codes.length < 1) {
      newErrors.gungu_codes = '군구를 1개 이상 선택해주세요.';
    } else if (formData.gungu_codes.length > 4) {
      newErrors.gungu_codes = '군구는 최대 4개까지 선택 가능합니다.';
    }
    
    // 연락처 검증
    if (!formData.contact_info.trim()) {
      newErrors.contact_info = '클럽 대표연락처를 입력해주세요.';
    } else if (!/^\d{11}$/.test(formData.contact_info)) {
      newErrors.contact_info = '클럽 대표연락처는 11자리 숫자여야 합니다.';
    }
    
    // 멤버 수 검증
    if (formData.member_count < 1) {
      newErrors.member_count = '멤버 수는 1명 이상이어야 합니다.';
    }
    
    // 대표자 검증 (관리자 전용)
    if (!formData.representative_id) {
      newErrors.representative_id = '대표자를 선택해주세요.';
    }
    
    // 정기 회비 검증 (관리자 전용)
    if (hasRegularFee && !regularFeeAmount) {
      newErrors.regularFeeAmount = '회비 금액을 입력해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      let attachmentUrl = '';
      if (selectedFile) {
        attachmentUrl = await uploadFile(selectedFile);
      }
      
      const submitData = {
        ...formData,
        attachment_file: attachmentUrl,
      };
      
      createClubMutation.mutate(submitData);
    } catch (error) {
      setErrors({ general: '파일 업로드에 실패했습니다.' });
    }
  };

  // 사용자 선택
  const handleUserSelect = (user) => {
    setSelectedRepresentative(user);
    setFormData(prev => ({ ...prev, representative_id: user.id }));
    setShowUserSearchModal(false);
    setSearchQuery('');
  };

  // 사용자 선택 취소
  const handleUserClear = () => {
    setSelectedRepresentative(null);
    setFormData(prev => ({ ...prev, representative_id: '' }));
  };

  return (
    <Box>
      {/* 헤더 */}
      <MainCard sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AnimateButton>
              <Button
                startIcon={<ArrowLeft />}
                onClick={() => navigate('/clubs')}
                variant="outlined"
              >
                돌아가기
              </Button>
            </AnimateButton>
            <Stack direction="row" alignItems="center" spacing={2}>
              <ExtendedAvatar color="primary" size="lg">
                <GroupIcon />
              </ExtendedAvatar>
              <Box>
                <Typography variant="h4" component="h1">
                  클럽 생성
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  새로운 클럽을 생성하세요
                </Typography>
              </Box>
            </Stack>
          </Stack>
          
          <AnimateButton>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={createClubMutation.isPending}
              size="large"
            >
              {createClubMutation.isPending ? '생성 중...' : '클럽 생성'}
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
                    label="클럽 설명 * (10자 이상 입력해주세요.)"
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    multiline
                    rows={6}
                    error={!!errors.description}
                    helperText={errors.description}
                    required
                  />
                  
                  <Grid container spacing={2}>
                    <Grid item>
                      <FormControl sx={{ minWidth: 350 }} error={!!errors.type}>
                        <InputLabel>클럽 유형*</InputLabel>
                        <Select
                          value={formData.type}
                          onChange={handleInputChange('type')}
                          label="클럽 유형*"
                          sx={{ minWidth: 350 }}
                          required
                        >
                          <MenuItem value="REGULAR">정기</MenuItem>
                          <MenuItem value="IRREGULAR">비정기</MenuItem>
                        </Select>
                        {errors.type && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                            {errors.type}
                          </Typography>
                        )}
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
                  
                  <FormControl fullWidth error={!!errors.sido_code} sx={{ mb: 1 }}>
                    <InputLabel>시도 *</InputLabel>
                    <Select
                      value={formData.sido_code}
                      onChange={handleSidoChange}
                      label="시도 *"
                    >
                      <MenuItem value="">
                        <em>선택</em>
                      </MenuItem>
                      {sidoList.map((s) => (
                        <MenuItem key={s.code} value={s.code}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.sido_code && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {errors.sido_code}
                      </Typography>
                    )}
                  </FormControl>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      군구 * (1~4개 선택)
                    </Typography>
                    {!formData.sido_code ? (
                      <Typography variant="body2" color="text.secondary">
                        시도를 먼저 선택해주세요.
                      </Typography>
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
                    {errors.gungu_codes && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {errors.gungu_codes}
                      </Typography>
                    )}
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="연락처*"
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
                    error={!!errors.contact_info}
                    helperText={errors.contact_info || '클럽 대표연락처를 11자리 숫자로 입력해주세요.'}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="추가 정보"
                    value={formData.additional_info}
                    onChange={handleInputChange('additional_info')}
                    multiline
                    rows={5}
                  />
                </Stack>
              </Stack>
            </MainCard>
          </Box>

          {/* 대표자 선택 */}
          <Box sx={{ width: { xs: '100%', md: '25%' }, flexShrink: 0 }}>
            <MainCard>
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <MdPerson style={{ color: '#1976d2' }} />
                  <Typography variant="h6">대표자 선택</Typography>
                </Stack>
                <Divider />
                {selectedRepresentative ? (
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <ExtendedAvatar
                        alt={selectedRepresentative.nickname}
                        src={selectedRepresentative.profile_image}
                        color="primary"
                        size="sm"
                      >
                        {selectedRepresentative.nickname?.charAt(0)}
                      </ExtendedAvatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="600">
                          {selectedRepresentative.nickname}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {selectedRepresentative.email}
                        </Typography>
                      </Box>
                      <AnimateButton>
                        <Button
                          size="small"
                          onClick={handleUserClear}
                          color="error"
                        >
                          <MdClear />
                        </Button>
                      </AnimateButton>
                    </Stack>
                  </Box>
                ) : (
                  <AnimateButton>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AddUser />}
                      onClick={() => setShowUserSearchModal(true)}
                    >
                      대표자 선택
                    </Button>
                  </AnimateButton>
                )}
                {errors.representative_id && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {errors.representative_id}
                  </Typography>
                )}
              </Stack>
            </MainCard>

            {/* 정기 회비 설정 */}
            <MainCard sx={{ mt: 2 }}>
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <MoneyIcon style={{ color: '#1976d2' }} />
                  <Typography variant="h6">정기 회비 설정</Typography>
                </Stack>
                <Divider />
                <Stack spacing={2}>
                  <FormControl>
                    <InputLabel>정기 회비 여부</InputLabel>
                    <Select
                      value={hasRegularFee ? 'yes' : 'no'}
                      onChange={(e) => setHasRegularFee(e.target.value === 'yes')}
                      label="정기 회비 여부"
                    >
                      <MenuItem value="no">없음</MenuItem>
                      <MenuItem value="yes">있음</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {hasRegularFee && (
                    <>
                      <TextField
                        fullWidth
                        label="회비 금액"
                        type="number"
                        value={regularFeeAmount}
                        onChange={(e) => setRegularFeeAmount(e.target.value)}
                        error={!!errors.regularFeeAmount}
                        helperText={errors.regularFeeAmount}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">원</InputAdornment>,
                        }}
                      />
                      
                      <FormControl fullWidth>
                        <InputLabel>회비 주기</InputLabel>
                        <Select
                          value={regularFeeCycle}
                          onChange={(e) => setRegularFeeCycle(e.target.value)}
                          label="회비 주기"
                        >
                          <MenuItem value="MONTHLY">월간</MenuItem>
                          <MenuItem value="QUARTERLY">분기</MenuItem>
                          <MenuItem value="YEARLY">연간</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <TextField
                        fullWidth
                        label="회비 설명"
                        value={regularFeeDescription}
                        onChange={(e) => setRegularFeeDescription(e.target.value)}
                        multiline
                        rows={2}
                      />
                    </>
                  )}
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
                    onClick={() => navigate('/clubs')}
                    size="large"
                  >
                    취소
                  </Button>
                </AnimateButton>
                <AnimateButton>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={createClubMutation.isPending ? <CircularProgress size={20} /> : <Save />}
                    disabled={createClubMutation.isPending || fileUploading}
                    size="large"
                  >
                    {createClubMutation.isPending ? '생성 중...' : '클럽 생성'}
                  </Button>
                </AnimateButton>
              </Stack>
            </MainCard>
          </Box>
          <Box sx={{ width: { xs: '100%', md: '25%' }, flexShrink: 0 }} />
        </Box>
      </form>

      {/* 사용자 검색 모달 */}
      <Dialog
        open={showUserSearchModal}
        onClose={() => setShowUserSearchModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            margin: { xs: 3, sm: 4 },
            maxHeight: 'calc(100vh - 96px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ pt: 3, pb: 0, px: 3 }}>대표자 선택</DialogTitle>
        <DialogContent dividers sx={{ flex: 1, overflow: 'auto', pt: 4, px: 3, pb: 2, minHeight: 0 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="사용자 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={usersLoading}
              sx={{ minWidth: 100 }}
            >
              검색
            </Button>
          </Stack>
          
          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <List>
                {usersData?.users?.map((user) => (
                  <ListItemButton
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    sx={{ borderRadius: 1, mb: 1 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                      <ExtendedAvatar
                        alt={user.nickname}
                        src={user.profile_image}
                        color="primary"
                        size="sm"
                      >
                        {user.nickname?.charAt(0)}
                      </ExtendedAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" fontWeight="600">
                            {user.nickname}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="textSecondary">
                            {user.email}
                          </Typography>
                        }
                      />
                    </Stack>
                  </ListItemButton>
                ))}
                {usersData?.users?.length === 0 && (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      검색 결과가 없습니다.
                    </Typography>
                  </Box>
                )}
              </List>
              {usersData && usersData.total_pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
                  <Pagination
                    count={usersData.total_pages || 1}
                    page={userSearchPage}
                    onChange={(event, page) => setUserSearchPage(page)}
                    color="primary"
                    size="small"
                  />
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUserSearchModal(false)}>
            취소
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClubCreatePage;
