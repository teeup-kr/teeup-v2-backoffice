import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Divider,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import { clubsApi } from '../../lib/api/clubs';
import { regionApi } from '../../lib/api/region';
import { useSnackbar } from '../../contexts/SnackbarContext';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import ExtendedAvatar from '../../components/@extended/Avatar';
import { MdArrowBack as ArrowLeft, MdEdit, MdDelete, MdPersonAdd, MdBlock, MdCheckCircle, MdCancel, MdGroup as GroupIcon, MdLocationOn as LocationIcon, MdCalendarToday as CalendarIcon, MdPeople as PeopleIcon, MdTrendingUp as TrendingUpIcon, MdMoreVert as MoreVertIcon, MdPerson as PersonIcon, MdSearch as SearchIcon, MdRefresh as RefreshIcon, MdSwapHoriz as SwapIcon, MdPersonRemove as PersonRemoveIcon, MdAdminPanelSettings as AdminIcon, MdNotifications as NotificationsIcon, MdDescription as DescriptionIcon, MdAttachMoney as MoneyIcon } from 'react-icons/md';

function ClubRegionDisplay({ sidoCode, gunguCodes }) {
  const { data: sidoList = [] } = useQuery({
    queryKey: ['region-sido'],
    queryFn: () => regionApi.getSidoList(),
  });
  const { data: gunguList = [] } = useQuery({
    queryKey: ['region-gungu', sidoCode],
    queryFn: () => regionApi.getGunguList(sidoCode),
    enabled: !!sidoCode,
  });
  const sidoName = sidoList.find((s) => s.code === sidoCode)?.name || sidoCode || '';
  const gunguNames = (gunguCodes || [])
    .map((code) => gunguList.find((g) => g.code === code)?.name || code)
    .filter(Boolean);
  const display = [sidoName, ...gunguNames].filter(Boolean).join(' ');
  return <Typography variant="body1">{display || 'N/A'}</Typography>;
}

const ClubDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  
  // URL 해시 기반 탭 초기화
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const tabMap = {
      'info': 0,
      'basic': 0,
      'members': 1,
      'approval': 2,
      'leader': 3
    };
    
    if (hash && tabMap.hasOwnProperty(hash)) {
      setActiveTab(tabMap[hash]);
    }
  }, []);
  
  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // URL 해시 업데이트
    const hashMap = {
      0: 'info',
      1: 'members',
      2: 'approval',
      3: 'leader'
    };
    const hash = hashMap[newValue] || 'info';
    window.history.replaceState(null, '', `#${hash}`);
  };
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  
  // 멤버 목록 필터 및 페이지네이션 상태
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [activeMemberSearchTerm, setActiveMemberSearchTerm] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('');
  const [activeMemberRoleFilter, setActiveMemberRoleFilter] = useState('');
  const [memberPage, setMemberPage] = useState(0);
  const [memberRowsPerPage, setMemberRowsPerPage] = useState(10);
  
  // 멤버 관리 탭 페이지네이션 상태
  const [memberManagePage, setMemberManagePage] = useState(0);
  const [memberManageRowsPerPage, setMemberManageRowsPerPage] = useState(5);
  
  // 가입 승인 관리 탭 페이지네이션 상태
  const [approvalPage, setApprovalPage] = useState(0);
  const [approvalRowsPerPage, setApprovalRowsPerPage] = useState(5);
  
  // 멤버 프로필 모달 상태
  const [showMemberProfileDialog, setShowMemberProfileDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // 멤버 권한 변경 모달 상태
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] = useState(null);
  const [newRole, setNewRole] = useState('');
  
  // 멤버 내보내기 모달 상태
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  
  // 가입 승인 관리 상태
  const [showRejectReasonDialog, setShowRejectReasonDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [memberToReject, setMemberToReject] = useState(null);
  
  // 가입 승인 완료 모달 상태
  const [showApprovalSuccessDialog, setShowApprovalSuccessDialog] = useState(false);
  const [approvedMemberName, setApprovedMemberName] = useState('');
  
  // 리더 교체 관련 상태
  const [newLeaderId, setNewLeaderId] = useState('');
  const [currentLeaderNewRole, setCurrentLeaderNewRole] = useState('MANAGER');
  const [showChangeLeaderDialog, setShowChangeLeaderDialog] = useState(false);

  // 공지/규정 내용 보기 모달
  const [contentModal, setContentModal] = useState({ open: false, title: '', content: '', meta: '' });

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

  // 클럽 멤버 목록 조회
  const {
    data: members,
    isLoading: membersLoading
  } = useQuery({
    queryKey: ['admin-club-members', id],
    queryFn: () => clubsApi.getClubMembers(id),
    enabled: !!id,
  });

  // 클럽 공지사항, 규정, 회비 조회
  const { data: clubNotices } = useQuery({
    queryKey: ['admin-club-notices', id],
    queryFn: () => clubsApi.getClubNotices(id, { limit: 10 }),
    enabled: !!id && !!club,
  });
  const { data: clubRegulations } = useQuery({
    queryKey: ['admin-club-regulations', id],
    queryFn: () => clubsApi.getClubRegulations(id),
    enabled: !!id && !!club,
  });
  const { data: clubFees } = useQuery({
    queryKey: ['admin-club-fees', id],
    queryFn: () => clubsApi.getClubFees(id),
    enabled: !!id && !!club,
  });

  // 클럽 삭제 mutation
  const deleteClubMutation = useMutation({
    mutationFn: () => clubsApi.deleteClub(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
      navigate('/clubs', { 
        state: { message: '클럽이 성공적으로 삭제되었습니다.' }
      });
    },
    onError: (error) => {
      console.error('클럽 삭제 실패:', error);
    }
  });

  // 클럽 상태 변경 mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data) => clubsApi.updateClubStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club', id] });
      setShowStatusDialog(false);
      setStatusReason('');
    },
    onError: (error) => {
      console.error('상태 변경 실패:', error);
    }
  });

  const handleDeleteClub = () => {
    deleteClubMutation.mutate();
    setShowDeleteDialog(false);
  };

  const handleStatusChange = () => {
    updateStatusMutation.mutate({
      status: newStatus,
      reason: statusReason,
    });
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

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return '활성';
      case 'INACTIVE': return '비공개';
      case 'SUSPENDED': return '정지';
      case 'APPROVED': return '승인';
      default: return status || '알 수 없음';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'LEADER': return '리더';
      case 'MEMBER': return '일반회원';
      case 'MANAGER': return '매니저';
      default: return role || '알 수 없음';
    }
  };

  const getMemberStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return '활성';
      case 'INACTIVE': return '비활성';
      case 'APPROVED': return '활성';  // 기존 데이터 호환을 위해 '활성'으로 표시
      case 'PENDING': return '대기중';
      case 'REJECTED': return '거절';
      default: return status || '알 수 없음';
    }
  };

  // 멤버 필터링 및 페이지네이션 핸들러
  const handleMemberSearch = () => {
    setActiveMemberSearchTerm(memberSearchTerm);
    setActiveMemberRoleFilter(memberRoleFilter);
    setMemberPage(0);
  };

  const handleMemberSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleMemberSearch();
    }
  };

  const handleMemberPageChange = (event, newPage) => {
    setMemberPage(newPage);
  };

  const handleMemberRowsPerPageChange = (event) => {
    setMemberRowsPerPage(parseInt(event.target.value, 10));
    setMemberPage(0);
  };

  const handleMemberReset = () => {
    setMemberSearchTerm('');
    setActiveMemberSearchTerm('');
    setMemberRoleFilter('');
    setActiveMemberRoleFilter('');
    setMemberPage(0);
  };

  const handleMemberNameClick = (member) => {
    setSelectedMember(member);
    setShowMemberProfileDialog(true);
  };

  // 멤버 권한 변경 mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) => clubsApi.updateMemberRole(id, userId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-members', id] });
      setShowRoleChangeDialog(false);
      setMemberToChangeRole(null);
      setNewRole('');
    },
    onError: (error) => {
      console.error('멤버 권한 변경 실패:', error);
    }
  });

  // 멤버 내보내기 mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId) => clubsApi.removeClubMember(id, userId),
    onSuccess: () => {
      const memberName = memberToRemove?.user_realname || memberToRemove?.user_nickname || '멤버';
      queryClient.invalidateQueries({ queryKey: ['admin-club-members', id] });
      setShowRemoveMemberDialog(false);
      setMemberToRemove(null);
      showSnackbar(`${memberName} 멤버 내보내기가 완료되었습니다.`, 'success');
    },
    onError: (error) => {
      console.error('멤버 내보내기 실패:', error);
      showSnackbar('멤버 내보내기 중 오류가 발생했습니다.', 'error');
    }
  });

  // 가입 승인 mutation
  const approveMembershipMutation = useMutation({
    mutationFn: (userId) => clubsApi.approveClubMembership(id, userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-members', id] });
      // 승인된 멤버 이름 찾기
      const approvedMember = pendingMembers.find(m => m.user_id === userId);
      if (approvedMember) {
        setApprovedMemberName(approvedMember.user_realname || approvedMember.user_nickname || '멤버');
      } else {
        setApprovedMemberName('멤버');
      }
      setShowApprovalSuccessDialog(true);
      // 페이지네이션 초기화 (항목이 줄어들 수 있으므로)
      setApprovalPage(0);
    },
    onError: (error) => {
      console.error('가입 승인 실패:', error);
    }
  });

  // 가입 거부 mutation
  const rejectMembershipMutation = useMutation({
    mutationFn: (userId) => clubsApi.rejectClubMembership(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-members', id] });
      setShowRejectReasonDialog(false);
      setRejectReason('');
      setMemberToReject(null);
      // 페이지네이션 초기화 (항목이 줄어들 수 있으므로)
      setApprovalPage(0);
    },
    onError: (error) => {
      console.error('가입 거부 실패:', error);
    }
  });

  // 리더 교체 mutation
  const changeLeaderMutation = useMutation({
    mutationFn: async ({ newLeaderId, currentLeaderNewRole }) => {
      // 현재 리더들을 찾아서 매니저/멤버로 변경
      const currentLeaders = members?.members?.filter(m => m.role === 'LEADER' && (m.status === 'ACTIVE' || m.status === 'APPROVED')) || [];
      
      // 현재 리더들을 새 역할로 변경
      for (const leader of currentLeaders) {
        await clubsApi.updateMemberRole(id, leader.user_id, currentLeaderNewRole);
      }
      
      // 새 리더를 리더로 설정
      await clubsApi.updateMemberRole(id, newLeaderId, 'LEADER');
    },
    onSuccess: () => {
      // 상태 초기화
      setNewLeaderId('');
      setCurrentLeaderNewRole('MANAGER');
      
      // 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['admin-club-members', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-club', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] });
    },
    onError: (error) => {
      console.error('리더 교체 실패:', error);
    }
  });

  // 멤버 권한 변경 핸들러
  const handleRoleChangeClick = (member) => {
    setMemberToChangeRole(member);
    // 일반회원은 매니저로, 매니저는 일반회원으로 변경 가능
    setNewRole(member.role === 'MEMBER' ? 'MANAGER' : 'MEMBER');
    setShowRoleChangeDialog(true);
  };

  const handleRoleChangeConfirm = () => {
    if (memberToChangeRole && newRole) {
      updateMemberRoleMutation.mutate({
        userId: memberToChangeRole.user_id,
        newRole: newRole
      });
    }
  };

  // 멤버 내보내기 핸들러
  const handleRemoveMemberClick = (member) => {
    setMemberToRemove(member);
    setShowRemoveMemberDialog(true);
  };

  const handleRemoveMemberConfirm = () => {
    if (memberToRemove) {
      removeMemberMutation.mutate(memberToRemove.user_id);
    }
  };

  // 멤버 필터링 및 정렬 로직
  const getFilteredMembers = () => {
    if (!members?.members) return [];
    
    let filtered = [...members.members];
    
    // 가입일 순으로 정렬 (최신순)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // 역할 필터 적용
    if (activeMemberRoleFilter && activeMemberRoleFilter !== 'ALL') {
      filtered = filtered.filter(m => m.role === activeMemberRoleFilter);
    }
    
    // 실명 검색 적용
    if (activeMemberSearchTerm) {
      const searchLower = activeMemberSearchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.user_realname?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  // 페이지네이션 적용
  const getPaginatedMembers = () => {
    const filtered = getFilteredMembers();
    const start = memberPage * memberRowsPerPage;
    const end = start + memberRowsPerPage;
    return filtered.slice(start, end);
  };

  // 승인 대기 멤버 필터링 및 정렬 (최신순)
  const getPendingMembers = () => {
    const pending = members?.members?.filter(member => member.status === 'PENDING') || [];
    // 가입일 내림차순 정렬 (최신순)
    return [...pending].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };
  
  const pendingMembers = getPendingMembers();
  
  // 멤버 관리 탭용 필터링 및 정렬 (최신순)
  const getManagedMembers = () => {
    if (!members?.members) return [];
    
    // PENDING 상태 제외
    let filtered = members.members.filter(m => m.status !== 'PENDING');
    
    // 가입일 내림차순 정렬 (최신순)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return filtered;
  };
  
  // 멤버 관리 탭 페이지네이션 적용
  const getPaginatedManagedMembers = () => {
    const filtered = getManagedMembers();
    const start = memberManagePage * memberManageRowsPerPage;
    const end = start + memberManageRowsPerPage;
    return filtered.slice(start, end);
  };
  
  // 가입 승인 관리 탭 페이지네이션 적용
  const getPaginatedPendingMembers = () => {
    const filtered = pendingMembers;
    const start = approvalPage * approvalRowsPerPage;
    const end = start + approvalRowsPerPage;
    return filtered.slice(start, end);
  };

  // 가입 승인 핸들러
  const handleApproveMember = (member) => {
    approveMembershipMutation.mutate(member.user_id);
  };
  
  // 가입 승인 완료 모달 닫기 핸들러
  const handleCloseApprovalSuccessDialog = () => {
    setShowApprovalSuccessDialog(false);
    setApprovedMemberName('');
  };

  // 가입 거부 핸들러
  const handleRejectMemberClick = (member) => {
    setMemberToReject(member);
    setRejectReason('');
    setShowRejectReasonDialog(true);
  };

  const handleConfirmReject = () => {
    if (memberToReject) {
      rejectMembershipMutation.mutate(memberToReject.user_id);
    }
  };

  // 리더 교체 핸들러
  const handleChangeLeaderClick = () => {
    if (!newLeaderId) return;
    setShowChangeLeaderDialog(true);
  };

  const handleChangeLeaderConfirm = () => {
    if (!newLeaderId) return;
    changeLeaderMutation.mutate({ newLeaderId, currentLeaderNewRole });
    setShowChangeLeaderDialog(false);
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
                onClick={() => navigate('/clubs')}
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
                  {club.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {club.type === 'REGULAR' ? '정기 클럽' : '비정기 클럽'}
                </Typography>
              </Box>
              <Chip
                label={getStatusText(club.status)}
                color={getStatusColor(club.status)}
                variant="filled"
              />
            </Stack>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <AnimateButton>
              <Button
                variant="outlined"
                startIcon={<MdEdit />}
                onClick={() => navigate(`/clubs/${id}/edit`)}
              >
                수정
              </Button>
            </AnimateButton>
            <AnimateButton>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => {
                  setNewStatus(club.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
                  setShowStatusDialog(true);
                }}
                onFocus={(e) => {
                  // Dialog가 열릴 때 포커스 충돌 방지
                  if (showStatusDialog) {
                    e.target.blur();
                  }
                }}
              >
                상태 변경
              </Button>
            </AnimateButton>
            <AnimateButton>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setShowDeleteDialog(true)}
              >
                삭제
              </Button>
            </AnimateButton>
          </Stack>
        </Stack>
      </MainCard>
      {/* 탭 네비게이션 */}
      <MainCard sx={{ mb: 3, pt: 0 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="기본 정보" />
          <Tab label="멤버 관리" />
          <Tab label="가입 승인 관리" />
          <Tab label="리더 권한 관리" />
        </Tabs>
      </MainCard>

      {activeTab === 0 && (
      <Stack spacing={3} sx={{ width: '100%' }}>
        {/* 좌측 8 / 우측 4 (신청 상세와 동일 비율) */}
        <Grid container spacing={3}>
          {/* 좌측 메인 */}
          <Grid size={{ xs: 12, lg: 8 }} sx={{ display: 'flex' }}>
            <MainCard sx={{ width: '100%', height: '100%', maxWidth: 'none' }}>
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <GroupIcon style={{ color: '#1976d2' }} />
                  <Typography variant="h6">클럽 정보</Typography>
                </Stack>
                <Divider />
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">클럽명</Typography>
                      <Typography variant="h6">{club.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">클럽 유형</Typography>
                      <Typography variant="h6">{club.type === 'REGULAR' ? '정기' : '비정기'}</Typography>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant="body2" color="text.secondary">클럽 설명</Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>{club.description}</Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">활동 지역</Typography>
                      <ClubRegionDisplay sidoCode={club.sido_code} gunguCodes={club.gungu_codes} />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">연락처</Typography>
                      <Typography variant="body1">{club.contact_info || 'N/A'}</Typography>
                    </Grid>
                  </Grid>

                  {club.additional_info && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">추가 정보</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>{club.additional_info}</Typography>
                    </Box>
                  )}
                </Stack>
              </Stack>
            </MainCard>
          </Grid>

          {/* 우측 사이드 */}
          <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <MainCard sx={{ width: '100%', maxWidth: 'none' }}>
              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TrendingUpIcon style={{ color: '#1976d2' }} />
                  <Typography variant="h6">클럽 통계</Typography>
                </Stack>
                <Divider />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary.main">{club.current_member_count || 0}</Typography>
                      <Typography variant="body2" color="textSecondary">현재 멤버 수</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">{club.meeting_count || 0}</Typography>
                      <Typography variant="body2" color="textSecondary">현재 모임 수</Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">대표자</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {members?.members?.find(m => m.role === 'LEADER')?.user_realname || club.representative_name || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">생성일</Typography>
                    <Typography variant="body1">{new Date(club.created_at).toLocaleDateString('ko-KR')}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">마지막 수정일</Typography>
                    <Typography variant="body1">{new Date(club.updated_at).toLocaleDateString('ko-KR')}</Typography>
                  </Box>
                </Stack>
              </Stack>
            </MainCard>

            {club.regular_fee && (
              <MainCard sx={{ width: '100%', maxWidth: 'none' }}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TrendingUpIcon style={{ color: '#1976d2' }} />
                    <Typography variant="h6">정기 회비</Typography>
                  </Stack>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">금액</Typography>
                    <Typography variant="h6" color="primary.main">
                      {club.regular_fee.amount?.toLocaleString()}원
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">주기</Typography>
                    <Typography variant="body1">{club.regular_fee.cycle}</Typography>
                  </Box>
                  {club.regular_fee.description && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">설명</Typography>
                      <Typography variant="body1">{club.regular_fee.description}</Typography>
                    </Box>
                  )}
                </Stack>
              </MainCard>
            )}
          </Grid>
        </Grid>

        {/* 클럽 정보 (공지/규정/회비) */}
        <MainCard sx={{ width: '100%', maxWidth: 'none' }}>
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <GroupIcon style={{ color: '#1976d2' }} />
              <Typography variant="h6">클럽 정보</Typography>
            </Stack>
            <Divider />
            <Grid container spacing={3}>
              {/* 공지사항 */}
              <Grid item xs={12} md={4}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsIcon fontSize="small" /> 공지사항
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => navigate(`/clubs/${id}/notices`)}>
                    관리
                  </Button>
                </Stack>
                <Box sx={{ maxHeight: 240, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                  {clubNotices?.data?.length > 0 ? (
                    <Stack spacing={1}>
                      {clubNotices.data.map((n) => (
                        <Box
                          key={n.id}
                          onClick={() => setContentModal({
                            open: true,
                            title: (n.is_important ? '📌 ' : '') + n.title,
                            content: n.content || '',
                            meta: `${n.author_name || ''} · ${n.created_at ? new Date(n.created_at).toLocaleDateString('ko-KR') : ''}`,
                          })}
                          sx={{
                            pb: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': { borderBottom: 0 },
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' },
                            borderRadius: 1,
                            px: 0.5,
                            mx: -0.5,
                          }}
                        >
                          <Typography variant="body2" fontWeight={500}>{n.is_important && '📌 '}{n.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {n.author_name} · {n.created_at ? new Date(n.created_at).toLocaleDateString('ko-KR') : ''}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">아직 등록된 공지사항이 없습니다</Typography>
                  )}
                </Box>
              </Grid>
              {/* 규정 */}
              <Grid item xs={12} md={4}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon fontSize="small" /> 규정
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => navigate(`/clubs/${id}/regulations`)}>
                    관리
                  </Button>
                </Stack>
                <Box sx={{ maxHeight: 240, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                  {clubRegulations?.categories?.length > 0 ? (
                    <Stack spacing={1}>
                      {clubRegulations.categories.map((cat) => (
                        <Box key={cat.id}>
                          <Typography variant="body2" fontWeight={600}>{cat.name}</Typography>
                          {cat.regulations?.length > 0 ? (
                            cat.regulations.map((r) => (
                              <Typography
                                key={r.id}
                                variant="caption"
                                display="block"
                                sx={{
                                  pl: 1,
                                  cursor: 'pointer',
                                  '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                                }}
                                onClick={() => setContentModal({
                                  open: true,
                                  title: r.title,
                                  content: r.content || '',
                                  meta: `${cat.name}`,
                                })}
                              >
                                · {r.title}
                              </Typography>
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>항목 없음</Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">아직 등록된 규정이 없습니다</Typography>
                  )}
                </Box>
              </Grid>
              {/* 회비 */}
              <Grid item xs={12} md={4}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon fontSize="small" /> 회비
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => navigate(`/clubs/${id}/fees`)}>
                    관리
                  </Button>
                </Stack>
                <Box sx={{ maxHeight: 240, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                  {clubFees?.length > 0 ? (
                    <Stack spacing={1}>
                      {clubFees.map((f) => (
                        <Box key={f.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">{f.name}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {Number(f.amount)?.toLocaleString()}원
                            {f.cycle ? ` / ${({ MONTHLY: '월', QUARTERLY: '분기', YEARLY: '년', ONE_TIME: '1회' })[f.cycle] || f.cycle}` : ''}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">아직 등록된 회비 항목이 없습니다</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Stack>
        </MainCard>

        {/* 공지/규정 내용 보기 모달 */}
        <Dialog
          open={contentModal.open}
          onClose={() => setContentModal((p) => ({ ...p, open: false }))}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { maxHeight: '80vh' } }}
        >
          <DialogTitle sx={{ display: 'block' }}>
            <Typography component="span" variant="h6" sx={{ display: 'block' }}>
              {contentModal.title}
            </Typography>
            {contentModal.meta && (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {contentModal.meta}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent dividers>
            <Box
              sx={{
                '& .rich-content': {
                  fontSize: '15px',
                  lineHeight: 1.8,
                  color: 'text.primary',
                },
                '& .rich-content h1, & .rich-content h2, & .rich-content h3': { fontSize: '1.1em', fontWeight: 600, mt: 1.5, mb: 0.5 },
                '& .rich-content p': { margin: '0.5em 0' },
                '& .rich-content img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
                '& .rich-content ul, & .rich-content ol': { pl: 2.5, my: 0.5 },
                '& .rich-content a': { color: 'primary.main', textDecoration: 'underline' },
                '& .rich-content blockquote': { borderLeft: 4, borderColor: 'divider', pl: 2, my: 1, color: 'text.secondary' },
              }}
            >
              {contentModal.content ? (
                <Box
                  className="rich-content"
                  component="div"
                  dangerouslySetInnerHTML={{ __html: contentModal.content }}
                />
              ) : (
                <Typography color="text.secondary">내용 없음</Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setContentModal((p) => ({ ...p, open: false }))}>닫기</Button>
          </DialogActions>
        </Dialog>

        {/* 아래는 전체폭으로 멤버 목록 */}
        <MainCard sx={{ width: '100%', maxWidth: 'none' }}>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={2}>
                <PeopleIcon style={{ color: '#1976d2' }} />
                <Typography variant="h6">멤버 목록</Typography>
              </Stack>
              <AnimateButton>
                <Button
                  variant="outlined"
                  startIcon={<MdPersonAdd />}
                  onClick={() => setActiveTab(1)}
                >
                  멤버 관리
                </Button>
              </AnimateButton>
            </Stack>
            <Divider />
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                placeholder="실명으로 검색"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                onKeyPress={handleMemberSearchKeyPress}
                size="small"
                sx={{ minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>역할</InputLabel>
                <Select
                  value={memberRoleFilter}
                  onChange={(e) => setMemberRoleFilter(e.target.value)}
                  label="역할"
                >
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="MEMBER">일반회원</MenuItem>
                  <MenuItem value="MANAGER">매니저</MenuItem>
                  <MenuItem value="LEADER">리더</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleMemberSearch}
                startIcon={<SearchIcon />}
              >
                검색
              </Button>
              <Button
                variant="outlined"
                onClick={handleMemberReset}
                startIcon={<RefreshIcon />}
              >
                초기화
              </Button>
            </Stack>
            {membersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>멤버</TableCell>
                        <TableCell>이메일</TableCell>
                        <TableCell>역할</TableCell>
                        <TableCell>상태</TableCell>
                        <TableCell>가입일</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getPaginatedMembers().length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <Typography variant="body2" color="textSecondary">
                              일치하는 회원이 없습니다.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        getPaginatedMembers().map((member) => (
                          <TableRow key={member.id} hover>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                {member.user_profile_image ? (
                                  <ExtendedAvatar
                                    alt={member.user_realname || member.user_nickname}
                                    src={member.user_profile_image}
                                    color="primary"
                                    size="sm"
                                  >
                                    {(member.user_realname || member.user_nickname)?.charAt(0)}
                                  </ExtendedAvatar>
                                ) : (
                                  <ExtendedAvatar
                                    alt={member.user_realname || member.user_nickname}
                                    color="primary"
                                    size="sm"
                                  >
                                    <PersonIcon />
                                  </ExtendedAvatar>
                                )}
                                <Typography 
                                  variant="subtitle2" 
                                  fontWeight="600"
                                  onClick={() => handleMemberNameClick(member)}
                                  sx={{ 
                                    cursor: 'pointer',
                                    '&:hover': { 
                                      color: 'primary.main',
                                      textDecoration: 'underline' 
                                    } 
                                  }}
                                >
                                  {member.user_realname || member.user_nickname || '-'}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {member.user_email || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getRoleText(member.role)}
                                color={member.role === 'LEADER' ? 'primary' : 'default'}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getMemberStatusText(member.status)}
                                color={member.status === 'ACTIVE' ? 'success' : 'default'}
                                size="small"
                                variant="filled"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {new Date(member.created_at).toLocaleDateString('ko-KR')}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {getFilteredMembers().length > 0 && (
                    <TablePagination
                      component="div"
                      count={getFilteredMembers().length}
                      page={memberPage}
                      onPageChange={handleMemberPageChange}
                      rowsPerPage={memberRowsPerPage}
                      onRowsPerPageChange={handleMemberRowsPerPageChange}
                      rowsPerPageOptions={[10, 25, 50]}
                      labelRowsPerPage="페이지당 행 수:"
                      labelDisplayedRows={({ from, to, count }) => 
                        `${from}-${to} / 총 ${count}개`
                      }
                    />
                  )}
                </TableContainer>
              </>
            )}
          </Stack>
        </MainCard>
      </Stack>
      )}

      {activeTab === 1 && (
        <MainCard>
          <Stack spacing={3}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PeopleIcon style={{ color: '#1976d2' }} />
                <Typography variant="h6">멤버 관리</Typography>
            </Stack>
            <Divider />
            {membersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>이름</TableCell>
                      <TableCell>이메일</TableCell>
                      <TableCell>역할</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>가입일</TableCell>
                      <TableCell align="center">액션</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getPaginatedManagedMembers().map((member) => (
                      <TableRow key={member.id} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ 
                              cursor: 'pointer',
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => handleMemberNameClick(member)}
                          >
                            {member.user_realname || member.user_nickname || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{member.user_email || '-'}</TableCell>
                        <TableCell>
                          <Chip label={getRoleText(member.role)} color={member.role === 'LEADER' ? 'primary' : 'default'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip label={getMemberStatusText(member.status)} color={member.status === 'ACTIVE' ? 'success' : member.status === 'APPROVED' ? 'success' : 'default'} size="small" variant="filled" />
                        </TableCell>
                        <TableCell>{new Date(member.created_at).toLocaleDateString('ko-KR')}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            {/* 권한 변경 버튼 (일반회원→매니저, 매니저→일반회원) */}
                            {(member.role === 'MEMBER' || member.role === 'MANAGER') && (
                              <Tooltip title={member.role === 'MEMBER' ? '매니저로 변경' : '일반회원으로 변경'}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleRoleChangeClick(member)}
                                >
                                  <SwapIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {/* 멤버 내보내기 버튼 */}
                            <Tooltip title="멤버 내보내기">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveMemberClick(member)}
                              >
                                <PersonRemoveIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {getManagedMembers().length > 0 && (
                  <TablePagination
                    component="div"
                    count={getManagedMembers().length}
                    page={memberManagePage}
                    onPageChange={(event, newPage) => setMemberManagePage(newPage)}
                    rowsPerPage={memberManageRowsPerPage}
                    onRowsPerPageChange={(event) => {
                      setMemberManageRowsPerPage(parseInt(event.target.value, 10));
                      setMemberManagePage(0);
                    }}
                    rowsPerPageOptions={[5]}
                    labelRowsPerPage="페이지당 행 수:"
                    labelDisplayedRows={({ from, to, count }) => 
                      `${from}-${to} / 총 ${count}개`
                    }
                  />
                )}
              </TableContainer>
            )}
          </Stack>
        </MainCard>
      )}

      {activeTab === 2 && (
        <MainCard>
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <PeopleIcon style={{ color: '#1976d2' }} />
              <Typography variant="h6">가입 승인 관리</Typography>
            </Stack>
            <Divider />
            {membersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
          </Box>
            ) : (
              <>
                {pendingMembers.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      승인 대기 중인 멤버가 없습니다.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>이름</TableCell>
                          <TableCell>이메일</TableCell>
                          <TableCell>상태</TableCell>
                          <TableCell>가입 신청일</TableCell>
                          <TableCell align="center">액션</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getPaginatedPendingMembers().map((member) => (
                          <TableRow key={member.id} hover>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ 
                                  cursor: 'pointer',
                                  color: 'primary.main',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                                onClick={() => handleMemberNameClick(member)}
                              >
                                {member.user_realname || member.user_nickname || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {member.user_email || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getMemberStatusText(member.status)}
                                color="warning"
                                size="small"
                                variant="filled"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {new Date(member.created_at).toLocaleDateString('ko-KR')}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <Tooltip title="승인">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleApproveMember(member)}
                                    disabled={approveMembershipMutation.isPending}
                                  >
                                    <MdCheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="거부">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRejectMemberClick(member)}
                                    disabled={rejectMembershipMutation.isPending}
                                  >
                                    <MdCancel />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {pendingMembers.length > 0 && (
                      <TablePagination
                        component="div"
                        count={pendingMembers.length}
                        page={approvalPage}
                        onPageChange={(event, newPage) => setApprovalPage(newPage)}
                        rowsPerPage={approvalRowsPerPage}
                        onRowsPerPageChange={(event) => {
                          setApprovalRowsPerPage(parseInt(event.target.value, 10));
                          setApprovalPage(0);
                        }}
                        rowsPerPageOptions={[5]}
                        labelRowsPerPage="페이지당 행 수:"
                        labelDisplayedRows={({ from, to, count }) => 
                          `${from}-${to} / 총 ${count}개`
                        }
                      />
                    )}
                  </TableContainer>
                )}
              </>
            )}
          </Stack>
        </MainCard>
      )}

      {activeTab === 3 && (
        <MainCard>
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <AdminIcon style={{ color: '#1976d2' }} />
              <Box>
                <Typography variant="h6">리더 권한 관리</Typography>
                <Typography variant="body2" color="text.secondary">
                  클럽 리더를 안전하게 교체할 수 있습니다
                </Typography>
          </Box>
            </Stack>
            <Divider />
            
            {membersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={3}>
                {/* 현재 리더 정보 */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    현재 리더 정보
                  </Typography>
                  {members?.members?.filter(m => m.role === 'LEADER' && (m.status === 'APPROVED' || m.status === 'ACTIVE')).length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {members.members
                        .filter(m => m.role === 'LEADER' && (m.status === 'APPROVED' || m.status === 'ACTIVE'))
                        .map((leader) => (
                          <Chip
                            key={leader.user_id}
                            icon={<AdminIcon />}
                            label={`${leader.user_realname || leader.user_nickname}${leader.user_nickname && leader.user_realname ? ` (${leader.user_nickname})` : ''}`}
                            color="error"
                            variant="outlined"
                          />
                        ))}
                    </Box>
                  ) : (
                    <Alert severity="warning">
                      현재 리더가 없습니다. 새 리더를 임명해주세요.
                    </Alert>
                  )}
                </Box>

                <Divider />

                {/* 새 리더 선택 */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    새 리더 선택
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>새 리더 선택</InputLabel>
                    <Select
                      value={newLeaderId}
                      onChange={(e) => setNewLeaderId(e.target.value)}
                      label="새 리더 선택"
                      disabled={changeLeaderMutation.isPending}
                    >
                      {members?.members
                        ?.filter(m => (m.status === 'APPROVED' || m.status === 'ACTIVE') && m.role !== 'LEADER')
                        .map((member) => (
                          <MenuItem key={member.user_id} value={member.user_id}>
                            <Box>
                              <Typography variant="body1">
                                {member.user_realname || member.user_nickname}
                                {member.user_realname && member.user_nickname && ` (${member.user_nickname})`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                현재: {member.role === 'MANAGER' ? '매니저' : '멤버'}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Box>

                <Divider />

                {/* 현재 리더의 새 역할 설정 */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    현재 리더의 새 역할 설정
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>새 역할</InputLabel>
                    <Select
                      value={currentLeaderNewRole}
                      onChange={(e) => setCurrentLeaderNewRole(e.target.value)}
                      label="새 역할"
                      disabled={changeLeaderMutation.isPending}
                    >
                      <MenuItem value="MANAGER">매니저</MenuItem>
                      <MenuItem value="MEMBER">일반 멤버</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="text.secondary">
                    현재 리더들은 선택한 역할로 변경됩니다.
                  </Typography>
                </Box>

                <Divider />

                {/* 변경 버튼 */}
                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleChangeLeaderClick}
                    disabled={!newLeaderId || changeLeaderMutation.isPending}
                    startIcon={<AdminIcon />}
                    color="primary"
                    sx={{ minWidth: 200 }}
                  >
                    {changeLeaderMutation.isPending ? '변경 중...' : '리더 교체하기'}
                  </Button>
                </Box>
              </Stack>
            )}
          </Stack>
        </MainCard>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>클럽 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 이 클럽을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleDeleteClub}
            color="error"
            variant="contained"
            disabled={deleteClubMutation.isPending}
          >
            {deleteClubMutation.isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상태 변경 다이얼로그 */}
      <Dialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        maxWidth="sm"
        fullWidth
        disableAutoFocus
        disableEnforceFocus
      >
        <DialogTitle>클럽 상태 변경</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>변경할 상태</InputLabel>
              <Select
                value={newStatus || ''}
                onChange={(e) => setNewStatus(e.target.value)}
              label="변경할 상태"
              >
                <MenuItem value="ACTIVE">활성</MenuItem>
                <MenuItem value="INACTIVE">비공개</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="변경 사유"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              multiline
              rows={3}
              placeholder="상태 변경 사유를 입력해주세요"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatusDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? '변경 중...' : '상태 변경'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 멤버 권한 변경 다이얼로그 */}
      <Dialog
        open={showRoleChangeDialog}
        onClose={() => {
          setShowRoleChangeDialog(false);
          setMemberToChangeRole(null);
          setNewRole('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>멤버 권한 변경</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              멤버: {memberToChangeRole?.user_realname || memberToChangeRole?.user_nickname}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              현재 역할: {getRoleText(memberToChangeRole?.role)}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>변경할 역할</InputLabel>
              <Select
                value={newRole || ''}
                onChange={(e) => setNewRole(e.target.value)}
                label="변경할 역할"
              >
                {memberToChangeRole?.role === 'MEMBER' && (
                  <MenuItem value="MANAGER">매니저</MenuItem>
                )}
                {memberToChangeRole?.role === 'MANAGER' && (
                  <MenuItem value="MEMBER">일반회원</MenuItem>
                )}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowRoleChangeDialog(false);
            setMemberToChangeRole(null);
            setNewRole('');
          }}>
            취소
          </Button>
          <Button
            onClick={handleRoleChangeConfirm}
            variant="contained"
            disabled={updateMemberRoleMutation.isPending || !newRole}
          >
            {updateMemberRoleMutation.isPending ? '변경 중...' : '변경'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 멤버 내보내기 확인 다이얼로그 */}
      <Dialog
        open={showRemoveMemberDialog}
        onClose={() => {
          setShowRemoveMemberDialog(false);
          setMemberToRemove(null);
        }}
      >
        <DialogTitle>멤버 내보내기 확인</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 <strong>{memberToRemove?.user_realname || memberToRemove?.user_nickname}</strong> 멤버를 내보내시겠습니까?
            이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowRemoveMemberDialog(false);
            setMemberToRemove(null);
          }}>
            취소
          </Button>
          <Button
            onClick={handleRemoveMemberConfirm}
            color="error"
            variant="contained"
            disabled={removeMemberMutation.isPending}
          >
            {removeMemberMutation.isPending ? '처리 중...' : '내보내기'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 거부 사유 다이얼로그 */}
      <Dialog
        open={showRejectReasonDialog}
        onClose={() => {
          setShowRejectReasonDialog(false);
          setRejectReason('');
          setMemberToReject(null);
        }}
        maxWidth="sm"
        fullWidth
        disableAutoFocus
        disableEnforceFocus
      >
        <DialogTitle>가입 거절</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              멤버: {memberToReject?.user_realname || memberToReject?.user_nickname}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              거절 사유를 입력해주세요 (선택사항)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="거절 사유를 입력하세요"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowRejectReasonDialog(false);
              setRejectReason('');
              setMemberToReject(null);
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirmReject}
            color="error"
            variant="contained"
            disabled={rejectMembershipMutation.isPending}
          >
            {rejectMembershipMutation.isPending ? '처리 중...' : '거절 완료'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 리더 교체 확인 다이얼로그 */}
      <Dialog
        open={showChangeLeaderDialog}
        onClose={() => setShowChangeLeaderDialog(false)}
        disableAutoFocus
        disableEnforceFocus
      >
        <DialogTitle>리더 교체 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {(() => {
              const currentLeaders = members?.members?.filter(m => m.role === 'LEADER' && (m.status === 'APPROVED' || m.status === 'ACTIVE')) || [];
              const newLeader = members?.members?.find(m => m.user_id === newLeaderId);
              
              if (!newLeader) return '새 리더를 찾을 수 없습니다.';
              
              const leaderNames = currentLeaders.map(l => l.user_realname || l.user_nickname).join(', ');
              const newLeaderName = newLeader.user_realname || newLeader.user_nickname;
              const roleText = currentLeaderNewRole === 'MANAGER' ? '매니저' : '멤버';
              
              return `현재 리더 ${leaderNames}를 ${roleText}로 변경하고, ${newLeaderName}님을 새 리더로 임명하시겠습니까?`;
            })()}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChangeLeaderDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleChangeLeaderConfirm}
            color="primary"
            variant="contained"
            disabled={changeLeaderMutation.isPending || !newLeaderId}
          >
            {changeLeaderMutation.isPending ? '변경 중...' : '리더 교체하기'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 가입 승인 완료 모달 */}
      <Dialog
        open={showApprovalSuccessDialog}
        onClose={handleCloseApprovalSuccessDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box
              sx={{
                mx: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                mb: 2
              }}
            >
              <MdCheckCircle style={{ fontSize: 32, color: '#4caf50' }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              완료
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {approvedMemberName}님의 가입 승인이 완료되었습니다.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleCloseApprovalSuccessDialog}
              sx={{ mt: 2 }}
            >
              확인
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* 멤버 프로필 다이얼로그 */}
      <Dialog
        open={showMemberProfileDialog}
        onClose={() => setShowMemberProfileDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            {selectedMember?.user_profile_image ? (
              <ExtendedAvatar
                alt={selectedMember?.user_nickname}
                src={selectedMember?.user_profile_image}
                color="primary"
                size="md"
              >
                {selectedMember?.user_nickname?.charAt(0)}
              </ExtendedAvatar>
            ) : (
              <ExtendedAvatar
                alt={selectedMember?.user_nickname}
                color="primary"
                size="md"
              >
                <PersonIcon />
              </ExtendedAvatar>
            )}
            <Box>
              <Typography variant="h6">{selectedMember?.user_nickname}</Typography>
              <Typography variant="body2" color="textSecondary">
                회원 프로필 정보
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedMember && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Divider />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">실명</Typography>
                  <Typography variant="body1" fontWeight="600">
                    {selectedMember.user_realname || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">닉네임</Typography>
                  <Typography variant="body1" fontWeight="600">
                    {selectedMember.user_nickname || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">이메일</Typography>
                  <Typography variant="body1">
                    {selectedMember.user_email || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">전화번호</Typography>
                  <Typography variant="body1">
                    {selectedMember.user_phone_number || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">생년월일</Typography>
                  <Typography variant="body1">
                    {selectedMember.user_birthdate 
                      ? new Date(selectedMember.user_birthdate).toLocaleDateString('ko-KR')
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">성별</Typography>
                  <Typography variant="body1">
                    {selectedMember.user_gender === 'MALE' ? '남성' : 
                     selectedMember.user_gender === 'FEMALE' ? '여성' : 
                     selectedMember.user_gender === 'OTHER' ? '기타' :
                     '알 수 없음'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">핸디캡</Typography>
                  <Typography variant="body1">
                    {selectedMember.user_handicap !== null && selectedMember.user_handicap !== undefined
                      ? selectedMember.user_handicap
                      : '알 수 없음'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">평균 스코어</Typography>
                  <Typography variant="body1">
                    {selectedMember.user_average_score !== null && selectedMember.user_average_score !== undefined
                      ? selectedMember.user_average_score
                      : '알 수 없음'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">클럽 내 역할</Typography>
                  <Chip
                    label={getRoleText(selectedMember.role)}
                    color={selectedMember.role === 'LEADER' ? 'primary' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">멤버십 상태</Typography>
                  <Chip
                    label={getMemberStatusText(selectedMember.status)}
                    color={selectedMember.status === 'ACTIVE' || selectedMember.status === 'APPROVED' ? 'success' : 'default'}
                    size="small"
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">가입일</Typography>
                  <Typography variant="body1">
                    {new Date(selectedMember.created_at).toLocaleDateString('ko-KR')}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMemberProfileDialog(false)} variant="contained">
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClubDetailPage;
