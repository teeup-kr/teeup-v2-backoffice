import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  IconButton
} from '@mui/material';
import { MdArrowBack as ArrowBackIcon, MdSave as SaveIcon } from 'react-icons/md';
import { adminUsersApi } from '../../lib/api/admin';
import { useSnackbar } from '../../contexts/SnackbarContext';

const UserCreatePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    email: '',
    realname: '',
    nickname: '',
    password: '',
    phone_number: '',
    birthdate: '',
    gender: '',
    status: 'ACTIVE',
    handicap: '',
    average_score: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  // 만 14세 미만 입력 방지를 위한 최대 선택 가능 생년월일 (오늘 기준 14년 전)
  const maxBirthdate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 14);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  // 폼 데이터 조회 (roles, statuses)
  const {
    data: formDataResponse,
    isLoading: formDataLoading
  } = useQuery({
    queryKey: ['admin-user-create-form-data'],
    queryFn: () => adminUsersApi.getUserCreateFormData(),
  });

  // 사용자 생성 mutation
  const createUserMutation = useMutation({
    mutationFn: (data) => adminUsersApi.createUser(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showSnackbar('사용자가 성공적으로 생성되었습니다.', 'success');
      navigate(`/users/${data.id}`);
    },
    onError: (error) => {
      console.error('사용자 생성 실패:', error);
      const errorMessage = error.response?.data?.detail || '사용자 생성에 실패했습니다.';
      showSnackbar(errorMessage, 'error');
    }
  });

  // 유효성 검사
  const validateForm = () => {
    const errors = {};

    // 이메일 검사
    if (!formData.email.trim()) {
      errors.email = '이메일을 입력해주세요.';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      errors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    // 비밀번호 검사
    if (!formData.password.trim()) {
      errors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6 || formData.password.length > 32) {
      errors.password = '비밀번호는 6자 이상 32자 이하여야 합니다.';
    } else {
      // 영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상 포함 확인
      const hasUpper = /[A-Z]/.test(formData.password);
      const hasLower = /[a-z]/.test(formData.password);
      const hasDigit = /[0-9]/.test(formData.password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
      
      const strength = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
      
      if (strength < 2) {
        errors.password = '영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상을 포함해야 합니다.';
      }
    }

    // 실명 검사
    if (formData.realname && !/^[가-힣a-zA-Z\s]*$/.test(formData.realname)) {
      errors.realname = '한글, 영문 대소문자만 입력 가능합니다';
    }

    // 닉네임 검사
    if (!formData.nickname.trim()) {
      errors.nickname = '닉네임을 입력해주세요.';
    } else if (formData.nickname.length < 2 || formData.nickname.length > 20) {
      errors.nickname = '닉네임은 2-20자여야 합니다.';
    } else if (!/^[a-zA-Z가-힣0-9]+$/.test(formData.nickname)) {
      errors.nickname = '닉네임은 영문, 한글, 숫자만 사용 가능합니다.';
    }

    // 전화번호 검사
    if (formData.phone_number && !/^[0-9]*$/.test(formData.phone_number)) {
      errors.phone_number = '숫자만 입력 가능합니다';
    }

    // 생년월일 검사
    if (formData.birthdate) {
      const birthDate = new Date(formData.birthdate);
      const today = new Date();

      if (birthDate > today) {
        errors.birthdate = '생년월일은 미래 날짜일 수 없습니다.';
      } else {
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 14) {
          errors.birthdate = '만14세 이상만 가입할 수 있습니다.';
        }

        if (birthDate.getFullYear() < 1900) {
          errors.birthdate = '올바른 생년월일을 입력해주세요.';
        }
      }
    }

    // 평균 스코어 검사
    if (formData.average_score !== '' && formData.average_score !== undefined && formData.average_score !== null) {
      const averageScore = Number(formData.average_score);
      if (isNaN(averageScore) || averageScore < 55 || averageScore > 144) {
        errors.average_score = '평균 타수는 55타 이상 144타 이하여야 합니다.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      showSnackbar('입력한 정보에 오류가 있습니다. 다시 확인해주세요.', 'error');
      return;
    }

    const submitData = {
      email: formData.email,
      password: formData.password,
      realname: formData.realname || null,
      nickname: formData.nickname,
      phone_number: formData.phone_number || null,
      birthdate: formData.birthdate || null,
      gender: formData.gender || null,
      status: formData.status,
      handicap: formData.handicap ? parseFloat(formData.handicap) : null,
      average_score: formData.average_score ? parseInt(formData.average_score) : null,
      needs_terms_agreement: false
    };

    createUserMutation.mutate(submitData);
  };

  // 입력값 변경 핸들러
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));

    // 실시간 유효성 검사
    const newErrors = { ...validationErrors };

    if (field === 'realname') {
      if (value === '') {
        delete newErrors.realname;
      } else if (!/^[가-힣a-zA-Z\s]*$/.test(value)) {
        newErrors.realname = '한글, 영문 대소문자만 입력 가능합니다';
      } else {
        delete newErrors.realname;
      }
    }

    if (field === 'nickname') {
      if (value === '') {
        delete newErrors.nickname;
      } else if (value.length < 2 || value.length > 20) {
        newErrors.nickname = '닉네임은 2-20자여야 합니다.';
      } else if (!/^[a-zA-Z가-힣0-9]+$/.test(value)) {
        newErrors.nickname = '닉네임은 영문, 한글, 숫자만 사용 가능합니다.';
      } else {
        delete newErrors.nickname;
      }
    }

    if (field === 'password') {
      if (value === '') {
        delete newErrors.password;
      } else if (value.length < 6 || value.length > 32) {
        newErrors.password = '비밀번호는 6자 이상 32자 이하여야 합니다.';
      } else {
        // 영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상 포함 확인
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasDigit = /[0-9]/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        
        const strength = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
        
        if (strength < 2) {
          newErrors.password = '영문 대문자, 소문자, 특수문자, 숫자 중 2개 이상을 포함해야 합니다.';
        } else {
          delete newErrors.password;
        }
      }
    }

    if (field === 'email') {
      if (value === '') {
        delete newErrors.email;
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        newErrors.email = '올바른 이메일 형식을 입력해주세요.';
      } else {
        delete newErrors.email;
      }
    }

    if (field === 'phone_number') {
      // 숫자만 허용
      const filteredValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [field]: filteredValue }));
      if (filteredValue === '') {
        delete newErrors.phone_number;
      } else if (!/^[0-9]*$/.test(filteredValue)) {
        newErrors.phone_number = '숫자만 입력 가능합니다';
      } else {
        delete newErrors.phone_number;
      }
      return;
    }

    if (field === 'average_score') {
      const filteredValue = value.replace(/^0+/, '');
      const averageScore = filteredValue === '' ? '' : filteredValue;
      
      // 핸디캡 자동 계산
      let calculatedHandicap = '';
      if (averageScore !== '') {
        const score = Number(averageScore);
        if (!isNaN(score)) {
          calculatedHandicap = Math.max(0, Math.min(72, score - 72)).toString();
        }
      }
      
      setFormData(prev => ({ 
        ...prev, 
        [field]: averageScore,
        handicap: calculatedHandicap
      }));
      
      if (averageScore === '') {
        delete newErrors.average_score;
      } else {
        const averageScoreNum = Number(averageScore);
        if (isNaN(averageScoreNum) || averageScoreNum < 55 || averageScoreNum > 144) {
          newErrors.average_score = '평균 타수는 55타 이상 144타 이하여야 합니다.';
        } else {
          delete newErrors.average_score;
        }
      }
      setValidationErrors(newErrors);
      return;
    }

    setValidationErrors(newErrors);
  };

  if (formDataLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const statuses = formDataResponse?.data?.statuses || ['ACTIVE', 'DEACTIVATED', 'DELETED'];

  return (
    <Box py={3} px={0}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/users')} style={{ marginRight: 8 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            사용자 생성
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/users')}
          >
            취소
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? '생성 중...' : '생성'}
          </Button>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* 기본 정보 */}
          <Grid item xs={12} md={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  기본 정보
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="이메일*"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      error={!!validationErrors.email}
                      helperText={validationErrors.email || ''}
                      fullWidth
                      required
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="비밀번호*"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      error={!!validationErrors.password}
                      helperText={validationErrors.password || '6자 이상 32자 이하, 영문 대소문자/특수문자/숫자 중 2개 이상 포함'}
                      fullWidth
                      required
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="실명"
                      value={formData.realname}
                      onChange={handleInputChange('realname')}
                      error={!!validationErrors.realname}
                      helperText={validationErrors.realname || ''}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="닉네임*"
                      value={formData.nickname}
                      onChange={handleInputChange('nickname')}
                      error={!!validationErrors.nickname}
                      helperText={validationErrors.nickname || ''}
                      fullWidth
                      required
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="전화번호"
                      value={formData.phone_number}
                      onChange={handleInputChange('phone_number')}
                      error={!!validationErrors.phone_number}
                      helperText={validationErrors.phone_number || ''}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="생년월일"
                      type="date"
                      value={formData.birthdate}
                      onChange={handleInputChange('birthdate')}
                      error={!!validationErrors.birthdate}
                      helperText={validationErrors.birthdate || ''}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ max: maxBirthdate }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ minWidth: 200 }}>
                      <InputLabel>성별</InputLabel>
                      <Select
                        value={formData.gender}
                        onChange={handleInputChange('gender')}
                        label="성별"
                      >
                        <MenuItem value="">선택 안함</MenuItem>
                        <MenuItem value="MALE">남성</MenuItem>
                        <MenuItem value="FEMALE">여성</MenuItem>
                        <MenuItem value="OTHER">기타</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={{ minWidth: 200 }}>
                      <InputLabel>상태*</InputLabel>
                      <Select
                        value={formData.status}
                        onChange={handleInputChange('status')}
                        label="상태*"
                        required
                      >
                        {statuses.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status === 'ACTIVE' ? '활성' : 
                             status === 'DEACTIVATED' ? '비활성' : 
                             status === 'DELETED' ? '삭제됨' :
                             status === 'INACTIVE' ? '비공개' :
                             status === 'SUSPENDED' ? '정지' : '알 수 없음'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 골프 정보 */}
          <Grid item xs={12} md={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  골프 정보
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="평균 스코어"
                      type="number"
                      value={formData.average_score}
                      onChange={handleInputChange('average_score')}
                      error={!!validationErrors.average_score}
                      helperText={validationErrors.average_score || '55타 이상 144타 이하'}
                      fullWidth
                      variant="outlined"
                      sx={{ minWidth: 300 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="핸디캡"
                      type="number"
                      value={formData.handicap}
                      disabled={true}
                      error={!!validationErrors.handicap}
                      helperText={validationErrors.handicap || '평균 스코어에 따라 자동 계산됩니다'}
                      fullWidth
                      variant="outlined"
                      sx={{ minWidth: 300 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default UserCreatePage;

