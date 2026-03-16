import React, { useState, useEffect } from 'react';
import { useSnackbar } from '../../contexts/SnackbarContext';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Divider,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { adminSettingsApi } from '../../lib/api/admin';
import { TipTapEditor } from '../../components/RichTextEditor';

// Tab Panel 컴포넌트 - 조건부 렌더링으로 변경
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3, px: 0 }}>{children}</Box>}
    </div>
  );
}

const SettingsPage = () => {
  const { showSnackbar } = useSnackbar();
  
  // 탭 매핑 정의
  const tabMap = {
    'account': 0,
    'terms': 1,
    'privacy': 2,
    'agreement': 3,
    'marketing': 4,
  };
  
  const reverseTabMap = {
    0: 'account',
    1: 'terms', 
    2: 'privacy',
    3: 'agreement',
    4: 'marketing',
  };
  
  // URL 해시에서 초기 탭 결정
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    return tabMap[hash] !== undefined ? tabMap[hash] : 0;
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  
  // 비밀번호 변경 관련 상태
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  // 약관 관리 상태
  const [termsData, setTermsData] = useState({
    service: { title: '서비스 이용약관', content: '' },
    privacy: { title: '개인정보처리방침', content: '' },
    collection: { title: '개인정보 수집 및 이용동의', content: '' },
    marketing: { title: '마케팅 정보 수신동의', content: '' },
  });

  // 관리자 정보 (localStorage에서 가져오기)
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');


  // 약관 데이터 로드 함수
  const loadTermsData = async () => {
    try {
      const [serviceRes, privacyRes, collectionRes, marketingRes] = await Promise.all([
        adminSettingsApi.getTerms('service'),
        adminSettingsApi.getTerms('privacy'),
        adminSettingsApi.getTerms('collection'),
        adminSettingsApi.getTerms('marketing'),
      ]);

      setTermsData({
        service: { 
          title: serviceRes.title || '서비스 이용약관', 
          content: serviceRes.content || '' 
        },
        privacy: { 
          title: privacyRes.title || '개인정보처리방침', 
          content: privacyRes.content || '' 
        },
        collection: { 
          title: collectionRes.title || '개인정보 수집 및 이용동의', 
          content: collectionRes.content || '' 
        },
        marketing: { 
          title: marketingRes.title || '마케팅 정보 수신동의', 
          content: marketingRes.content || '' 
        },
      });
    } catch (error) {
      console.error('약관 데이터 로드 실패:', error);
    }
  };

  // 비밀번호 변경 mutation
  const passwordMutation = useMutation({
    mutationFn: (data) => adminSettingsApi.changePassword(data),
    onSuccess: () => {
      showSnackbar('비밀번호가 성공적으로 변경되었습니다.', 'success');
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.detail || '비밀번호 변경에 실패했습니다.';
      showSnackbar(message, 'error');
    },
  });

  // 약관 저장 mutation
  const saveTermsMutation = useMutation({
    mutationFn: ({ type, data }) => adminSettingsApi.saveTerms(type, data),
    onSuccess: (_, variables) => {
      showSnackbar(`${termsData[variables.type].title}이(가) 저장되었습니다.`, 'success');
    },
    onError: () => {
      showSnackbar('저장에 실패했습니다.', 'error');
    },
  });


  // 탭 변경 핸들러들
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // URL 해시 업데이트
    const hash = reverseTabMap[newValue];
    window.location.hash = hash;
  };

  // 브라우저 뒤로가기로 인한 탭 변경
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const tabIndex = tabMap[hash];
      if (tabIndex !== undefined) {
        setActiveTab(tabIndex);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    loadTermsData();
  }, []);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmitPassword = async (event) => {
    event.preventDefault();
    
    if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
      showSnackbar('모든 필드를 입력해주세요.', 'error');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      showSnackbar('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.', 'error');
      return;
    }

    if (formData.new_password.length < 6) {
      showSnackbar('새 비밀번호는 최소 6자 이상이어야 합니다.', 'error');
      return;
    }

    passwordMutation.mutate(formData);
  };

  const handleTermsTitleChange = (type) => (event) => {
    setTermsData(prev => ({
      ...prev,
      [type]: { ...prev[type], title: event.target.value }
    }));
  };

  const handleTermsContentChange = (type) => (content) => {
    setTermsData(prev => ({
      ...prev,
      [type]: { ...prev[type], content }
    }));
  };

  const handleSaveTerms = (type) => {
    saveTermsMutation.mutate({
      type,
      data: {
        title: termsData[type].title,
        content: termsData[type].content,
      }
    });
  };

  return (
    <Box sx={{ py: 3, px: 0 }}>
      <Typography variant="h4" gutterBottom>
        관리자 설정
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        관리자 계정 정보, 비밀번호 및 약관을 관리할 수 있습니다.
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="설정 탭"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="계정 정보" />
          <Tab label="서비스 이용약관" />
          <Tab label="개인정보처리방침" />
          <Tab label="개인정보 수집 및 이용동의" />
          <Tab label="마케팅 정보 수신동의" />
        </Tabs>

        {/* 계정 정보 탭 */}
        <TabPanel value={activeTab} index={0}>
          <Card sx={{ maxWidth: 600 }}>
            <CardContent sx={{ p: 3 }}>
              {/* 계정 정보 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  계정 정보
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>닉네임:</strong> {admin?.nickname || '관리자'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>이메일:</strong> {admin?.email || 'admin@teeup.run'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>역할:</strong> {admin?.role === 'ADMIN' ? '관리자' : admin?.role || '관리자'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* 비밀번호 변경 */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  비밀번호 변경
                </Typography>

                <Box component="form" onSubmit={handleSubmitPassword}>
                  <TextField
                    fullWidth
                    label="현재 비밀번호"
                    type="password"
                    value={formData.current_password}
                    onChange={handleInputChange('current_password')}
                    margin="normal"
                    required
                    disabled={passwordMutation.isPending}
                  />

                  <TextField
                    fullWidth
                    label="새 비밀번호"
                    type="password"
                    value={formData.new_password}
                    onChange={handleInputChange('new_password')}
                    margin="normal"
                    required
                    disabled={passwordMutation.isPending}
                    helperText="최소 6자 이상 입력해주세요"
                  />

                  <TextField
                    fullWidth
                    label="새 비밀번호 확인"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleInputChange('confirm_password')}
                    margin="normal"
                    required
                    disabled={passwordMutation.isPending}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={passwordMutation.isPending}
                    startIcon={passwordMutation.isPending ? <CircularProgress size={20} /> : null}
                    sx={{ mt: 3 }}
                  >
                    {passwordMutation.isPending ? '변경 중...' : '비밀번호 변경'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* 약관 탭들 */}
        {(['service', 'privacy', 'collection', 'marketing']).map((type, index) => (
          <TabPanel key={type} value={activeTab} index={index + 1}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  {termsData[type].title}
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <TextField
                    fullWidth
                    label="제목"
                    value={termsData[type].title}
                    onChange={handleTermsTitleChange(type)}
                    disabled={saveTermsMutation.isPending}
                    sx={{ mb: 2 }}
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                    내용
                  </Typography>
                  <TipTapEditor
                    placeholder="약관 내용을 입력해주세요..."
                    initialValue={termsData[type].content}
                    onChange={(content) => handleTermsContentChange(type)(content)}
                    height={400}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                  <Button
                    variant="contained"
                    onClick={() => handleSaveTerms(type)}
                    disabled={saveTermsMutation.isPending}
                    startIcon={saveTermsMutation.isPending ? <CircularProgress size={20} /> : null}
                    size="large"
                  >
                    {saveTermsMutation.isPending ? '저장 중...' : '저장'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
};

export default SettingsPage;
