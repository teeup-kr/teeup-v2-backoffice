import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import { MdArrowBack as ArrowBackIcon, MdEdit as EditIcon, MdSave as SaveIcon, MdCancel as CancelIcon, MdRefresh as RefreshIcon, MdDelete as DeleteIcon, MdCheckCircle as CheckIcon } from 'react-icons/md';
import { adminUsersApi } from '../../lib/api/admin';
import { useSnackbar } from '../../contexts/SnackbarContext';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  
  const [userDetail, setUserDetail] = useState(null);
  const [userClubs, setUserClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    realname: '',
    nickname: '',
    phone_number: '',
    birthdate: '',
    gender: '',
    status: '',
    handicap: 0,
    average_score: 0,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // 메모 모달 상태
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedClubForNote, setSelectedClubForNote] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [loadingNote, setLoadingNote] = useState(false);
  const [noteTab, setNoteTab] = useState(0);

  // 사용자 상세 정보 조회
  const {
    data: user,
    isLoading: userLoading,
    error: userError
  } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const response = await adminUsersApi.getUser(id);
      console.log('UserDetailPage - 사용자 데이터:', response);
      return response;
    },
    enabled: !!id,
  });

  // 사용자 클럽 목록 조회
  const {
    data: userClubsData,
    isLoading: clubsLoading
  } = useQuery({
    queryKey: ['admin-user-clubs', id],
    queryFn: () => adminUsersApi.getUserClubs(id),
    enabled: !!id,
  });

  // 사용자별 모임 참가 목록 조회
  const {
    data: meetingsData,
    isLoading: meetingsLoading
  } = useQuery({
    queryKey: ['admin-user-meetings', id],
    queryFn: () => adminUsersApi.getUserMeetings(id, { page: 1, limit: 10 }),
    enabled: !!id,
  });

  // 사용자별 핸디캡 업데이트 이력 조회
  const {
    data: handicapHistoryData,
    isLoading: handicapHistoryLoading
  } = useQuery({
    queryKey: ['admin-user-handicap-history', id],
    queryFn: () => adminUsersApi.getUserHandicapHistory(id, { page: 1, limit: 10 }),
    enabled: !!id,
  });

  // 모임 탭 상태
  const [meetingTab, setMeetingTab] = useState(0);

  // 변경사항 감지
  const hasChanges = useMemo(() => {
    if (!user || !editData || !isEditing) return false;
    
    // 각 필드를 비교하여 변경사항 확인
    const normalizeValue = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return value;
      return String(value).trim();
    };
    
    const normalizeDate = (dateStr) => {
      if (!dateStr) return '';
      if (typeof dateStr === 'string' && dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr;
    };
    
    return (
      normalizeValue(editData.realname) !== normalizeValue(user.realname) ||
      normalizeValue(editData.nickname) !== normalizeValue(user.nickname) ||
      normalizeValue(editData.phone_number) !== normalizeValue(user.phone_number) ||
      normalizeDate(editData.birthdate) !== normalizeDate(user.birthdate ? user.birthdate.split('T')[0] : '') ||
      normalizeValue(editData.gender) !== normalizeValue(user.gender) ||
      normalizeValue(editData.status) !== normalizeValue(user.status) ||
      Number(editData.handicap || 0) !== Number(user.handicap || 0) ||
      Number(editData.average_score || 0) !== Number(user.average_score || 0)
    );
  }, [user, editData, isEditing]);

  // 사용자 수정 mutation
  const updateUserMutation = useMutation({
    mutationFn: (data) => adminUsersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      setIsEditing(false);
      setEditData({});
      setValidationErrors({});
      showSnackbar('사용자 정보가 성공적으로 수정되었습니다.', 'success');
    },
    onError: (error) => {
      console.error('사용자 수정 실패:', error);
      const errorMessage = error.response?.data?.detail || '사용자 정보 수정에 실패했습니다.';
      
      // 서버 에러 메시지를 파싱하여 validationErrors에 추가 (함수형 업데이트로 최신 상태 사용)
      setValidationErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        
        // 에러 메시지에서 필드명 추출 (여러 필드 에러가 동시에 올 수 있으므로 if-else가 아닌 독립적인 if 사용)
        if (errorMessage.includes('실명')) {
          newErrors.realname = errorMessage;
        }
        if (errorMessage.includes('닉네임')) {
          newErrors.nickname = errorMessage;
        }
        if (errorMessage.includes('전화번호') || errorMessage.includes('휴대폰')) {
          newErrors.phone_number = errorMessage;
        }
        if (errorMessage.includes('생년월일') || errorMessage.includes('생일')) {
          newErrors.birthdate = errorMessage;
        }
        if (errorMessage.includes('핸디캡')) {
          newErrors.handicap = errorMessage;
        }
        if (errorMessage.includes('스코어') || errorMessage.includes('평균')) {
          newErrors.average_score = errorMessage;
        }
        if (errorMessage.includes('성별')) {
          newErrors.gender = errorMessage;
        }
        if (errorMessage.includes('상태')) {
          newErrors.status = errorMessage;
        }
        
        return newErrors;
      });
      showSnackbar(errorMessage, 'error');
    }
  });

  // 사용자 삭제 mutation
  const deleteUserMutation = useMutation({
    mutationFn: () => adminUsersApi.deleteUser(id),
    onSuccess: () => {
      showSnackbar('사용자가 성공적으로 삭제되었습니다.', 'success');
      // 목록으로 이동
      setTimeout(() => {
        navigate('/users');
      }, 1500);
    },
    onError: (error) => {
      console.error('사용자 삭제 실패:', error);
      const errorMessage = error.response?.data?.detail || '사용자 삭제에 실패했습니다.';
      showSnackbar(errorMessage, 'error');
    }
  });

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteUserMutation.mutate();
    setDeleteDialogOpen(false);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleEdit = () => {
    if (user) {
      const newEditData = {
        realname: user.realname || '',
        nickname: user.nickname || '',
        phone_number: user.phone_number || '',
        birthdate: user.birthdate ? user.birthdate.split('T')[0] : '',
        gender: user.gender || '',
        handicap: user.handicap || 0,
        average_score: user.average_score || 0,
        status: user.status || ''
      };
      setEditData(newEditData);
      setIsEditing(true);
      
      // 기존 유효성 검사
      const errors = {};
      
      // 실명 검사
      if (newEditData.realname && !/^[가-힣a-zA-Z\s]*$/.test(newEditData.realname)) {
        errors.realname = '한글, 영문 대소문자만 입력 가능합니다';
      } else if (newEditData.realname && newEditData.realname.trim().length > 0 && newEditData.realname.trim().length < 2) {
        // 실명 길이 검사(2자 이상) - 패턴이 맞고 값이 있을 때만 길이 검사
        errors.realname = '실명은 2자 이상이어야 합니다';
      }
      
      // 닉네임 검사
      if (newEditData.nickname && !/^[가-힣a-zA-Z0-9]*$/.test(newEditData.nickname)) {
        errors.nickname = '한글, 영문 대소문자, 숫자만 입력 가능합니다';
      }
      
      // 전화번호 검사
      if (newEditData.phone_number && !/^[0-9]*$/.test(newEditData.phone_number)) {
        errors.phone_number = '숫자만 입력 가능합니다';
      }
      
      // 생년월일 검사
      if (newEditData.birthdate) {
        const birthDate = new Date(newEditData.birthdate);
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
      
      // 핸디캡 검사
      if (newEditData.handicap !== undefined && newEditData.handicap !== null && newEditData.handicap !== '') {
        const handicap = Number(newEditData.handicap);
        if (isNaN(handicap) || handicap < 0 || handicap > 72) {
          errors.handicap = '핸디캡은 0부터 72 사이의 숫자만 입력 가능합니다';
        }
      }
      
      // 평균 스코어 검사
      if (newEditData.average_score !== undefined && newEditData.average_score !== null && newEditData.average_score !== '') {
        const averageScore = Number(newEditData.average_score);
        if (isNaN(averageScore) || averageScore < 55 || averageScore > 144) {
          errors.average_score = '평균 스코어는 55부터 144 사이의 숫자만 입력 가능합니다';
        }
      }
      
      setValidationErrors(errors);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // 실명 검사(한글, 영문 대소문자, 공백만 사용)
    if (editData.realname && !/^[가-힣a-zA-Z\s]*$/.test(editData.realname)) {
      errors.realname = '한글, 영문 대소문자만 입력 가능합니다';
    } else if (editData.realname && editData.realname.trim().length > 0 && editData.realname.trim().length < 2) {
      // 실명 길이 검사(2자 이상) - 패턴이 맞고 값이 있을 때만 길이 검사
      errors.realname = '실명은 2자 이상이어야 합니다';
    }
    
    // 닉네임 검사(한글, 영문 대소문자, 숫자만 사용, 언더스코어 제거)
    if (editData.nickname && !/^[가-힣a-zA-Z0-9]*$/.test(editData.nickname)) {
      errors.nickname = '한글, 영문 대소문자, 숫자만 입력 가능합니다';
    }
    
    // 전화번호 검사(숫자만 사용)
    if (editData.phone_number && !/^[0-9]*$/.test(editData.phone_number)) {
      errors.phone_number = '숫자만 입력 가능합니다';
    }
    
    // 생년월일 검사
    if (editData.birthdate) {
      const birthDate = new Date(editData.birthdate);
      const today = new Date();
      
      // 미래 날짜 체크
      if (birthDate > today) {
        errors.birthdate = '생년월일은 미래 날짜일 수 없습니다.';
      } else {
        // 나이 계산
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        // 만14세 이상 확인
        if (age < 14) {
          errors.birthdate = '만14세 이상만 가입할 수 있습니다.';
        }
        
        // 1900년 이후 확인
        if (birthDate.getFullYear() < 1900) {
          errors.birthdate = '올바른 생년월일을 입력해주세요.';
        }
      }
    }
    
    // 핸디캡 검사(0 이상 72 이하)
    if (editData.handicap !== undefined && editData.handicap !== null && editData.handicap !== '') {
      const handicap = Number(editData.handicap);
      if (isNaN(handicap) || handicap < 0 || handicap > 72) {
        errors.handicap = '핸디캡은 0부터 72 사이의 숫자만 입력 가능합니다';
      }
    }
    
    // 평균 스코어 검사(55 이상 144 이하)
    if (editData.average_score !== undefined && editData.average_score !== null && editData.average_score !== '') {
      const averageScore = Number(editData.average_score);
      if (isNaN(averageScore) || averageScore < 55 || averageScore > 144) {
        errors.average_score = '평균 스코어는 55부터 144 사이의 숫자만 입력 가능합니다';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!id || !editData) return;
    
    // 유효성 검사
    if (!validateForm()) {
      showSnackbar('입력한 정보에 오류가 있습니다. 다시 확인해주세요.', 'error');
      return;
    }
    
    updateUserMutation.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
    setValidationErrors({});
  };

  const getStatusColor = (status) => {
    switch (status) {
      // 사용자 상태
      case 'ACTIVE':
        return 'success';
      case 'DEACTIVATED':
        return 'warning';
      case 'DELETED':
        return 'error';
      // 클럽 상태
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      case 'INACTIVE':
        return 'warning';
      case 'CANCELED':
        return 'default';
      case 'SUSPENDED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      // 사용자 상태
      case 'ACTIVE':
        return '활성';
      case 'DEACTIVATED':
        return '비활성';
      case 'DELETED':
        return '삭제됨';
      // 클럽 상태
      case 'APPROVED':
        return '승인됨';
      case 'PENDING':
        return '대기중';
      case 'REJECTED':
        return '거부됨';
      case 'INACTIVE':
        return '비공개';
      case 'CANCELED':
        return '취소됨';
      case 'SUSPENDED':
        return '정지';
      // 참가 상태
      case 'CONFIRMED':
        return '확정';
      default:
        return status || '알 수 없음';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'USER':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ADMIN':
        return '관리자';
      case 'USER':
        return '사용자';
      default:
        return role || '알 수 없음';
    }
  };

  const getClubRoleColor = (role) => {
    switch (role) {
      case 'LEADER':
        return 'error';
      case 'MANAGER':
        return 'warning';
      case 'MEMBER':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getClubRoleLabel = (role) => {
    switch (role) {
      case 'LEADER':
        return '리더';
      case 'MANAGER':
        return '매니저';
      case 'MEMBER':
        return '멤버';
      default:
        return role || '알 수 없음';
    }
  };

  // 리더/매니저 역할을 가진 클럽 확인
  const leaderOrManagerClubs = React.useMemo(() => {
    const clubs = Array.isArray(userClubsData?.clubs) ? userClubsData.clubs : [];
    const filtered = clubs.filter(club => 
      club.member_role === 'LEADER' || club.member_role === 'MANAGER'
    );
    console.log('클럽 데이터:', clubs);
    console.log('리더/매니저 클럽:', filtered);
    return filtered;
  }, [userClubsData]);

  // 메모 모달 열기
  const handleOpenNoteModal = async (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    
    console.log('메모 모달 열기 시도');
    console.log('클럽 데이터 전체:', userClubsData);
    console.log('리더/매니저 클럽 개수:', leaderOrManagerClubs.length);
    console.log('리더/매니저 클럽 목록:', leaderOrManagerClubs);
    
    // 모달을 먼저 열기
    setNoteModalOpen(true);
    setNoteContent('');
    
    if (leaderOrManagerClubs.length === 0) {
      console.warn('리더 또는 매니저 역할을 가진 클럽이 없습니다.');
      showSnackbar('리더 또는 매니저 역할을 가진 클럽이 없습니다.', 'warning');
      setSelectedClubForNote(null);
      return;
    }
    
    // 첫 번째 클럽을 기본으로 선택
    const firstClub = leaderOrManagerClubs[0];
    console.log('선택된 클럽:', firstClub);
    setSelectedClubForNote(firstClub);
    
    // 첫 번째 클럽의 메모 로드
    if (firstClub?.id) {
      await loadNoteForClub(firstClub.id);
    }
  };

  // 특정 클럽의 메모 로드
  const loadNoteForClub = async (clubId) => {
    if (!id || !clubId) return;
    
    setLoadingNote(true);
    try {
      const noteData = await adminUsersApi.getMemberNote(clubId, id);
      setNoteContent(noteData.note || '');
    } catch (error) {
      console.error('메모 조회 실패:', error);
      setNoteContent('');
      // 에러가 나도 모달은 열어둠 (메모가 없는 경우일 수 있음)
    } finally {
      setLoadingNote(false);
    }
  };

  // 메모 저장
  const handleSaveNote = async () => {
    if (!selectedClubForNote || !id) return;
    
    setLoadingNote(true);
    try {
      await adminUsersApi.updateMemberNote(selectedClubForNote.id, id, noteContent);
      showSnackbar('메모가 저장되었습니다.', 'success');
    } catch (error) {
      console.error('메모 저장 실패:', error);
      const errorMessage = error.response?.data?.detail || '메모 저장에 실패했습니다.';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoadingNote(false);
    }
  };

  // 메모 모달 닫기
  const handleCloseNoteModal = () => {
    setNoteModalOpen(false);
    setSelectedClubForNote(null);
    setNoteContent('');
    setNoteTab(0);
  };

  // 메모 탭 변경
  const handleNoteTabChange = async (event, newValue) => {
    setNoteTab(newValue);
    const club = leaderOrManagerClubs[newValue];
    if (club) {
      setSelectedClubForNote(club);
      await loadNoteForClub(club.id);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // ISO datetime을 yyyy-MM-dd 형식으로 변환
    return dateString.split('T')[0];
  };

  if (userLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (userError || !user) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {userError?.message || '사용자 정보를 불러올 수 없습니다.'}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/users')}
        >
          사용자 목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/users')} style={{ marginRight: 8 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            사용자 상세 정보
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="새로고침">
            <IconButton onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-user', id] })}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {!isEditing ? (
            <>
              {/* 리더/매니저인 경우 메모 버튼 표시 */}
              {leaderOrManagerClubs.length > 0 && (
                <Tooltip title="메모">
                  <IconButton
                    onClick={(e) => {
                      console.log('메모 버튼 클릭됨');
                      handleOpenNoteModal(e);
                    }}
                    color="primary"
                    sx={{ 
                      border: '1px solid',
                      borderColor: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText'
                      }
                    }}
                  >
                    <CheckIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
              >
                수정
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                disabled={deleteUserMutation.isPending}
              >
                삭제
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={updateUserMutation.isPending || !hasChanges || Object.keys(validationErrors).length > 0}
              >
                저장
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
              >
                취소
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={3} direction="column">
        {/* 기본 정보 */}
        <Grid item xs={12}>
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" gutterBottom>
                기본 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="이메일"
                    value={user.email}
                    fullWidth
                    disabled
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="실명"
                    value={isEditing ? editData.realname || '' : user.realname || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const newEditData = { ...editData, realname: value };
                      
                      // 실시간 유효성 검사
                      const newErrors = { ...validationErrors };
                      if (value === '') {
                        delete newErrors.realname;
                      } else if (!/^[가-힣a-zA-Z\s]*$/.test(value)) {
                        newErrors.realname = '한글, 영문 대소문자만 입력 가능합니다';
                      } else if (value.trim().length < 2) {
                        // 패턴이 맞을 때만 길이 검사
                        newErrors.realname = '실명은 2자 이상이어야 합니다';
                      } else {
                        delete newErrors.realname;
                      }
                      
                      setEditData(newEditData);
                      setValidationErrors(newErrors);
                    }}
                    error={!!validationErrors.realname}
                    helperText={validationErrors.realname || ''}
                    fullWidth
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="닉네임"
                    value={isEditing ? editData.nickname || '' : user.nickname || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const newEditData = { ...editData, nickname: value };
                      
                      // 실시간 유효성 검사
                      const newErrors = { ...validationErrors };
                      if (value === '') {
                        delete newErrors.nickname;
                      } else if (!/^[가-힣a-zA-Z0-9]*$/.test(value)) {
                        newErrors.nickname = '한글, 영문 대소문자, 숫자만 입력 가능합니다';
                      } else {
                        delete newErrors.nickname;
                      }
                      
                      setEditData(newEditData);
                      setValidationErrors(newErrors);
                    }}
                    error={!!validationErrors.nickname}
                    helperText={validationErrors.nickname || ''}
                    fullWidth
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="전화번호"
                    value={isEditing ? editData.phone_number || '' : user.phone_number || ''}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      
                      // 숫자만 허용하는 패턴으로 필터링
                      let filteredValue = '';
                      for (let i = 0; i < inputValue.length; i++) {
                        const char = inputValue[i];
                        if (/[0-9]/.test(char)) {
                          filteredValue += char;
                        }
                      }
                      
                      const newEditData = { ...editData, phone_number: filteredValue };
                      
                      // 실시간 유효성 검사
                      const newErrors = { ...validationErrors };
                      if (filteredValue === '') {
                        delete newErrors.phone_number;
                      } else if (!/^[0-9]*$/.test(filteredValue)) {
                        newErrors.phone_number = '숫자만 입력 가능합니다';
                      } else {
                        delete newErrors.phone_number;
                      }
                      
                      setEditData(newEditData);
                      setValidationErrors(newErrors);
                    }}
                    error={!!validationErrors.phone_number}
                    helperText={validationErrors.phone_number || ''}
                    fullWidth
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="생년월일"
                    type="date"
                    value={isEditing ? editData.birthdate || '' : formatDateForInput(user.birthdate)}
                    onChange={(e) => setEditData({ ...editData, birthdate: e.target.value })}
                    error={!!validationErrors.birthdate}
                    helperText={validationErrors.birthdate}
                    fullWidth
                    disabled={!isEditing}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={!isEditing}>
                    <InputLabel>성별</InputLabel>
                    <Select
                      value={isEditing ? editData.gender || '' : user.gender || ''}
                      onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                      label="성별"
                      sx={{ minWidth: 150 }}
                    >
                      <MenuItem value="MALE">남성</MenuItem>
                      <MenuItem value="FEMALE">여성</MenuItem>
                      <MenuItem value="OTHER">기타</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={!isEditing}>
                    <InputLabel>상태</InputLabel>
                    <Select
                      value={isEditing ? editData.status || '' : user.status || ''}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      label="상태"
                    >
                      <MenuItem value="ACTIVE">활성</MenuItem>
                      <MenuItem value="DEACTIVATED">비활성</MenuItem>
                      <MenuItem value="DELETED">삭제됨</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 골프 정보 및 기타 */}
        <Grid item xs={12}>
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" gutterBottom>
                골프 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="핸디캡"
                    type="number"
                    value={isEditing ? (editData.handicap ?? '') : (user.handicap ?? '')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+/, '');
                      const handicap = value === '' ? undefined : Number(value);
                      const newEditData = { ...editData, handicap };
                      
                      // 실시간 유효성 검사
                      const newErrors = { ...validationErrors };
                      if (handicap === undefined || handicap === null || handicap === '') {
                        delete newErrors.handicap;
                      } else {
                        const handicapNum = Number(handicap);
                        if (isNaN(handicapNum) || handicapNum < 0 || handicapNum > 72) {
                          newErrors.handicap = '핸디캡은 0부터 72 사이의 숫자만 입력 가능합니다';
                        } else {
                          delete newErrors.handicap;
                        }
                      }
                      
                      setEditData(newEditData);
                      setValidationErrors(newErrors);
                    }}
                    error={!!validationErrors.handicap}
                    helperText={validationErrors.handicap}
                    fullWidth
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="평균 스코어"
                    type="number"
                    value={isEditing ? (editData.average_score ?? '') : (user.average_score ?? '')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+/, '');
                      const averageScore = value === '' ? undefined : Number(value);
                      const newEditData = { ...editData, average_score: averageScore };
                      
                      // 실시간 유효성 검사
                      const newErrors = { ...validationErrors };
                      if (averageScore === undefined || averageScore === null || averageScore === '') {
                        delete newErrors.average_score;
                      } else {
                        const averageScoreNum = Number(averageScore);
                        if (isNaN(averageScoreNum) || averageScoreNum < 55 || averageScoreNum > 144) {
                          newErrors.average_score = '평균 스코어는 55부터 144 사이의 숫자만 입력 가능합니다';
                        } else {
                          delete newErrors.average_score;
                        }
                      }
                      
                      setEditData(newEditData);
                      setValidationErrors(newErrors);
                    }}
                    error={!!validationErrors.average_score}
                    helperText={validationErrors.average_score}
                    fullWidth
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="가입 경로"
                    value={user.provider || ''}
                    fullWidth
                    disabled
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={`역할: ${getRoleLabel(user.role)}`}
                      color={getRoleColor(user.role || '')}
                      size="small"
                    />
                    <Chip
                      label={`상태: ${getStatusLabel(user.status)}`}
                      color={getStatusColor(user.status || '')}
                      size="small"
                    />
                    <Chip
                      label={`이메일 인증: ${user.email_verified ? '완료' : '미완료'}`}
                      color={user.email_verified ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 시스템 정보 */}
        <Grid item xs={12}>
          <Card sx={{ height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" gutterBottom>
                시스템 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="사용자 ID"
                    value={user.id}
                    fullWidth
                    disabled
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="가입 클럽 수"
                    value={user.club_count || 0}
                    fullWidth
                    disabled
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="가입일"
                    value={formatDate(user.created_at)}
                    fullWidth
                    disabled
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="최종 수정일"
                    value={formatDate(user.updated_at)}
                    fullWidth
                    disabled
                    variant="outlined"
                  />
                </Grid>
                
                {user.deactivated_at && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="비활성화일"
                      value={formatDate(user.deactivated_at)}
                      fullWidth
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 가입 클럽 목록 */}
        <Grid item xs={12}>
          <Card sx={{ height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" gutterBottom>
                가입 클럽 목록 ({userClubsData?.clubs?.length || 0}개)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {clubsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ flex: 1, minHeight: '280px' }}>
                  <CircularProgress />
                </Box>
              ) : userClubsData?.clubs?.length > 0 ? (
                <TableContainer component={Paper} sx={{ flex: 1, minHeight: '280px', maxHeight: '100%', overflow: 'auto' }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>클럽 ID</TableCell>
                        <TableCell>클럽명</TableCell>
                        <TableCell>역할</TableCell>
                        <TableCell>상태</TableCell>
                        <TableCell>가입일</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(Array.isArray(userClubsData?.clubs) ? userClubsData.clubs : []).map((club) => (
                        <TableRow key={club.id}>
                          <TableCell>{club.id}</TableCell>
                          <TableCell>{club.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={getClubRoleLabel(club.member_role)}
                              color={getClubRoleColor(club.member_role)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(club.status)}
                              color={getStatusColor(club.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(club.joined_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ flex: 1, minHeight: '280px' }}>
                  <Typography color="text.secondary">
                    가입한 클럽이 없습니다.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 라운딩/소셜 참가 이력 */}
        <Grid item xs={12}>
          <Card sx={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" gutterBottom>
                모임 참가 이력
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {meetingsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ flex: 1, minHeight: '280px' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Tabs value={meetingTab} onChange={(e, newValue) => setMeetingTab(newValue)} sx={{ mb: 2 }}>
                    <Tab label={`라운딩 (${meetingsData?.total_rounding || 0})`} />
                    <Tab label={`소셜 (${meetingsData?.total_social || 0})`} />
                  </Tabs>
                  
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '280px' }}>
                    {meetingTab === 0 ? (
                      // 라운딩 모임 목록
                      meetingsData?.rounding_meetings?.length > 0 ? (
                        <TableContainer component={Paper} sx={{ flex: 1, minHeight: '280px', maxHeight: '100%', overflow: 'auto' }}>
                          <Table stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>모임명</TableCell>
                                <TableCell>클럽명</TableCell>
                                <TableCell>모임 시간</TableCell>
                                <TableCell>참가 상태</TableCell>
                                <TableCell>참가 신청일</TableCell>
                                <TableCell>스코어</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(Array.isArray(meetingsData?.rounding_meetings) ? meetingsData.rounding_meetings : []).map((meeting) => (
                                <TableRow key={meeting.meeting_id}>
                                  <TableCell>
                                    <Typography
                                      component="a"
                                      href={`#/meetings/${meeting.meeting_id}`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        window.open(`#/meetings/${meeting.meeting_id}`, '_blank');
                                      }}
                                      sx={{ color: 'primary.main', textDecoration: 'none', cursor: 'pointer' }}
                                    >
                                      {meeting.meeting_name}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>{meeting.club_name}</TableCell>
                                  <TableCell>
                                    {meeting.meeting_time ? formatDate(meeting.meeting_time) : '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={getStatusLabel(meeting.participant_status)}
                                      color={getStatusColor(meeting.participant_status)}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>{formatDate(meeting.joined_at)}</TableCell>
                                  <TableCell>
                                    {meeting.has_score ? (
                                      <Typography variant="body2">
                                        {meeting.gross_score}타
                                        {meeting.net_score !== null && ` (넷: ${meeting.net_score})`}
                                      </Typography>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        미입력
                                      </Typography>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" sx={{ flex: 1, minHeight: '280px' }}>
                          <Typography color="text.secondary">
                            참가한 라운딩이 없습니다.
                          </Typography>
                        </Box>
                      )
                    ) : (
                      // 소셜 모임 목록
                      meetingsData?.social_meetings?.length > 0 ? (
                        <TableContainer component={Paper} sx={{ flex: 1, minHeight: '280px', maxHeight: '100%', overflow: 'auto' }}>
                          <Table stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>모임명</TableCell>
                                <TableCell>클럽명</TableCell>
                                <TableCell>모임 시간</TableCell>
                                <TableCell>참가 상태</TableCell>
                                <TableCell>참가 신청일</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(Array.isArray(meetingsData?.social_meetings) ? meetingsData.social_meetings : []).map((meeting) => (
                                <TableRow key={meeting.meeting_id}>
                                  <TableCell>
                                    <Typography
                                      component="a"
                                      href={`#/meetings/${meeting.meeting_id}`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        window.open(`#/meetings/${meeting.meeting_id}`, '_blank');
                                      }}
                                      sx={{ color: 'primary.main', textDecoration: 'none', cursor: 'pointer' }}
                                    >
                                      {meeting.meeting_name}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>{meeting.club_name}</TableCell>
                                  <TableCell>
                                    {meeting.meeting_time ? formatDate(meeting.meeting_time) : '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={getStatusLabel(meeting.participant_status)}
                                      color={getStatusColor(meeting.participant_status)}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>{formatDate(meeting.joined_at)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" sx={{ flex: 1, minHeight: '280px' }}>
                          <Typography color="text.secondary">
                            참가한 소셜 모임이 없습니다.
                          </Typography>
                        </Box>
                      )
                    )}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 핸디캡 업데이트 이력 */}
        <Grid item xs={12}>
          <Card sx={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" gutterBottom>
                핸디캡 업데이트 이력
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {handicapHistoryLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ flex: 1, minHeight: '280px' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {/* 현재 핸디캡 정보 카드 */}
                  <Box sx={{ mb: 3, minHeight: '120px' }}>
                    {handicapHistoryData?.handicap_info ? (
                      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          현재 핸디캡 정보
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" color="text.secondary">
                              초기 핸디캡
                            </Typography>
                            <Typography variant="body1">
                              {handicapHistoryData.handicap_info.initial_handicap !== null
                                ? `${handicapHistoryData.handicap_info.initial_handicap}`
                                : '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" color="text.secondary">
                              계산된 핸디캡
                            </Typography>
                            <Typography variant="body1">
                              {handicapHistoryData.handicap_info.calculated_handicap !== null
                                ? `${handicapHistoryData.handicap_info.calculated_handicap}`
                                : '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" color="text.secondary">
                              업데이트 방식
                            </Typography>
                            <Typography variant="body1">
                              {handicapHistoryData.handicap_info.handicap_update_method === 'AUTO' ? '자동' : 
                               handicapHistoryData.handicap_info.handicap_update_method === 'MANUAL' ? '수동' : '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" color="text.secondary">
                              계산 경기 수
                            </Typography>
                            <Typography variant="body1">
                              {handicapHistoryData.handicap_info.handicap_calculation_count || '-'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    ) : null}
                  </Box>
                  
                  {/* 스코어 히스토리 테이블 */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '280px' }}>
                    {handicapHistoryData?.score_history?.length > 0 ? (
                      <TableContainer component={Paper} sx={{ flex: 1, minHeight: '280px', maxHeight: '100%', overflow: 'auto' }}>
                        <Table stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>경기 날짜</TableCell>
                              <TableCell>모임명</TableCell>
                              <TableCell>클럽명</TableCell>
                              <TableCell>Gross Score</TableCell>
                              <TableCell>Net Score</TableCell>
                              <TableCell>사용된 핸디캡</TableCell>
                              <TableCell>기록 생성일</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(Array.isArray(handicapHistoryData?.score_history) ? handicapHistoryData.score_history : []).map((history) => (
                              <TableRow key={history.id}>
                                <TableCell>{formatDate(history.played_at)}</TableCell>
                                <TableCell>{history.meeting_name || '-'}</TableCell>
                                <TableCell>{history.club_name || '-'}</TableCell>
                                <TableCell>{history.gross_score}타</TableCell>
                                <TableCell>
                                  {history.net_score !== null ? `${history.net_score}` : '-'}
                                </TableCell>
                                <TableCell>{history.handicap_used}</TableCell>
                                <TableCell>{formatDate(history.created_at)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" sx={{ flex: 1, minHeight: '280px' }}>
                        <Typography color="text.secondary">
                          스코어 히스토리가 없습니다.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>사용자 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 이 사용자를 삭제하시겠습니까?<br />
            삭제된 사용자는 복구할 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>
            취소
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 메모 모달 */}
      <Dialog 
        open={noteModalOpen} 
        onClose={handleCloseNoteModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '400px'
          }
        }}
      >
        <DialogTitle>
          사용자 메모
          {selectedClubForNote && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              클럽: {selectedClubForNote.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {!selectedClubForNote ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography color="text.secondary">
                리더 또는 매니저 역할을 가진 클럽이 없습니다.
              </Typography>
            </Box>
          ) : (
            <>
              {leaderOrManagerClubs.length > 1 && (
                <Box sx={{ mb: 2 }}>
                  <Tabs value={noteTab} onChange={handleNoteTabChange} variant="scrollable" scrollButtons="auto">
                    {leaderOrManagerClubs.map((club, index) => (
                      <Tab 
                        key={club.id} 
                        label={club.name}
                        sx={{ textTransform: 'none' }}
                      />
                    ))}
                  </Tabs>
                </Box>
              )}
              
              {loadingNote ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="이 사용자에 대한 메모를 입력하세요"
                  variant="outlined"
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNoteModal}>
            취소
          </Button>
          <Button
            onClick={handleSaveNote}
            variant="contained"
            disabled={loadingNote}
            startIcon={<SaveIcon />}
          >
            {loadingNote ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDetailPage;
